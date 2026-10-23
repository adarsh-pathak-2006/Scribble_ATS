from django.shortcuts import get_object_or_404
from .models import ResumeScan, ResumeCreation, Resume
from accounts.models import Profile
from .serializers import (
    ResumeScanSerializer,
    ResumeScanListSerializer,
    ResumeCreationSerializer,
    ResumeCreationListSerializer,
    ResumeSerializer,
    ResumeListSerializer
)
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.cache import cache
from config.cache_keys import (
    resume_list_cachekey,
    resume_scans_list_cache_key,
    resume_scans_detail_cache_key,
    created_resume_cache_key,
    created_resume_detail_cache_key,
    get_cache_version
)
from .tasks import processresumepdftotext, atscorecalculationtask, atsfriendlyresumecreationtask
from config.pagination import GeneralPagination, CreatedResumePagination
from config.throttling import GeneralThrottle, ResumeCreateThrottle, ResumeScanThrottle
from rest_framework.permissions import IsAuthenticated

class ResumeListAPI(APIView):
    throttle_classes = [GeneralThrottle]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        version = get_cache_version("resumes", request.user.id)
        pageno = request.query_params.get("page", "1")
        page_size = request.query_params.get("page_size", "10")
        cache_key = resume_list_cachekey(userid=request.user.id, pageno=pageno, page_size=page_size, version=version)

        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data, status=status.HTTP_200_OK)

        paginator = GeneralPagination()
        queryset = paginator.paginate_queryset(
            Resume.objects.filter(profile__user=request.user).order_by("-created_on"),
            view=self,
            request=request
        )
        serial = ResumeListSerializer(queryset, many=True, context={'request': request})
        response = paginator.get_paginated_response(serial.data)
        cache.set(cache_key, response.data, timeout=8000)
        return response

    def post(self, request):
        serial = ResumeSerializer(data=request.data, context={'request': request})
        if serial.is_valid():
            profile, _ = Profile.objects.get_or_create(user=request.user)
            serial.save(profile=profile)
            return Response(serial.data, status=status.HTTP_201_CREATED)
        return Response(serial.errors, status=status.HTTP_400_BAD_REQUEST)


class ResumeScanAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get_throttles(self):
        if self.request.method == 'POST':
            return [ResumeScanThrottle()]
        return [GeneralThrottle()]

    def get(self, request, resumeslug):
        version = get_cache_version("scans", resumeslug)
        pageno = request.query_params.get("page", "1")
        page_size = request.query_params.get("page_size", "10")
        cache_key = resume_scans_list_cache_key(resumeslug=resumeslug, pageno=pageno, page_size=page_size, version=version)

        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data, status=status.HTTP_200_OK)

        paginator = GeneralPagination()
        queryset = paginator.paginate_queryset(
            ResumeScan.objects.filter(resume__slug=resumeslug, resume__profile__user=request.user).order_by("-created_on"),
            view=self,
            request=request
        )
        serial = ResumeScanListSerializer(queryset, many=True)
        response = paginator.get_paginated_response(serial.data)
        cache.set(cache_key, response.data, timeout=8000)
        return response

    def post(self, request, resumeslug):
        serial = ResumeScanSerializer(data=request.data)
        if serial.is_valid():
            jd = serial.validated_data['job_description']
            resume_data = get_object_or_404(Resume.objects.select_related('profile__user'), slug=resumeslug, profile__user=request.user)
            if not resume_data.resumedata:
                return Response(
                    {'message': 'The resume PDF is still being processed. Please wait a moment and try again.'},
                    status=status.HTTP_409_CONFLICT
                )
            task = atscorecalculationtask.delay(jd=jd, resumeslug=resume_data.slug)
            return Response(
                {
                    'message': 'ATS score calculation started. The result will be available shortly.',
                    'task_id': task.id
                },
                status=status.HTTP_202_ACCEPTED
            )
        return Response(serial.errors, status=status.HTTP_400_BAD_REQUEST)


class ResumeScanDetailAPI(APIView):
    throttle_classes = [GeneralThrottle]
    permission_classes = [IsAuthenticated]

    def get(self, request, resumeslug, scanslug):
        cache_key = resume_scans_detail_cache_key(resumeslug=resumeslug, scanslug=scanslug)
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data, status=status.HTTP_200_OK)
        data = get_object_or_404(
            ResumeScan.objects.select_related('resume__profile__user'),
            resume__profile__user=request.user,
            resume__slug=resumeslug,
            slug=scanslug
        )
        serial = ResumeScanSerializer(data, context={'request': request})
        cache.set(cache_key, serial.data, timeout=8000)
        return Response(serial.data, status=status.HTTP_200_OK)


class CreatedResumeListAPI(APIView):
    throttle_classes = [GeneralThrottle]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        version = get_cache_version("created_resumes", request.user.id)
        pageno = request.query_params.get("page", "1")
        page_size = request.query_params.get("page_size", "5")
        cache_key = created_resume_cache_key(userid=request.user.id, pageno=pageno, page_size=page_size, version=version)

        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data, status=status.HTTP_200_OK)

        paginator = CreatedResumePagination()
        queryset = paginator.paginate_queryset(
            ResumeCreation.objects.select_related('scan').filter(profile__user=request.user).order_by("-created_on"),
            view=self,
            request=request
        )
        serial = ResumeCreationListSerializer(queryset, many=True)
        response = paginator.get_paginated_response(serial.data)
        cache.set(cache_key, response.data, timeout=3000)
        return response


class CreatedResumeDetailAPI(APIView):
    throttle_classes = [GeneralThrottle]
    permission_classes = [IsAuthenticated]

    def get(self, request, slug):
        cache_key = created_resume_detail_cache_key(userid=request.user.id, slug=slug)
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data, status=status.HTTP_200_OK)
        data = get_object_or_404(
            ResumeCreation.objects.select_related('profile__user', 'scan__resume'),
            profile__user=request.user,
            slug=slug
        )
        serial = ResumeCreationSerializer(data, context={'request': request})
        cache.set(cache_key, serial.data, timeout=3000)
        return Response(serial.data, status=status.HTTP_200_OK)


class ATSResumeCreationAPI(APIView):
    throttle_classes = [ResumeCreateThrottle]
    permission_classes = [IsAuthenticated]

    def post(self, request, scanslug):
        scan_data = get_object_or_404(
            ResumeScan.objects.select_related('resume__profile__user'),
            resume__profile__user=request.user,
            slug=scanslug
        )
        if scan_data.ats_score is None:
            return Response(
                {'message': 'The ATS score is not calculated yet. Please wait.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if scan_data.ats_score >= 80:
            return Response(
                {'message': 'The ATS score is already 80 or above. No new resume creation required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        task = atsfriendlyresumecreationtask.delay(scanid=scan_data.id, userid=request.user.id)
        return Response(
            {
                'message': 'The resume generation task has started and will be saved shortly.',
                'task_id': task.id
            },
            status=status.HTTP_202_ACCEPTED
        )


        
                