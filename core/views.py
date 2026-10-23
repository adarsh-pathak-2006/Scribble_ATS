from django.shortcuts import get_object_or_404
from .models import ResumeScan, ResumeCreation, Resume
from .serializers import ResumeScanSerializer, ResumeCreationSerializer, ResumeSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from django.core.cache import cache
from config.cache_keys import resume_list_cachekey, resume_scans_list_cache_key, resume_scans_detail_cache_key, created_resume_cache_key, created_resume_detail_cache_key
from .tasks import processresumepdftotext, atscorecalculationtask, atsfriendlyresumecreationtask
from config.pagination import GeneralPagination, CreatedResumePagination
from config.throttling import GeneralThrottle, ResumeCreateThrottle, ResumeScanThrottle
from rest_framework.permissions import IsAuthenticated

class ResumeListAPI(APIView):
    throttle_classes=[GeneralThrottle]
    permission_classes=[IsAuthenticated]
    def get(self, request):
        cached_data=cache.get(resume_list_cachekey(userid=request.user.id))
        if cached_data:
            return Response(cached_data, status=200)
        data=Resume.objects.select_related('profile__user').filter(profile__user=request.user)
        serial=ResumeSerializer(data, many=True)
        cache.set(resume_list_cachekey(userid=request.user.id), serial.data, timeout=8000)
        return Response(serial.data, status= 200)

    def post(self, request):
        serial=ResumeScanSerializer(data=request.data)
        if serial.is_valid():
            resume=serial.save()
            processresumepdftotext.delay(userid=request.user.id, resumeid=resume.id)
            return Response(serial.data, status=201)
        return Response(serial.errors, status=400)
        

class ResumeScanAPI(APIView):
    def get_throttles(self):
        if self.request.method=='POST':
            return [ResumeScanThrottle()]
        return [GeneralThrottle()]
    permission_classes=[IsAuthenticated]
    def get(self, request, resumeslug):
        pageno=request.query_params.get("page", "1")
        cached_data=cache.get(resume_scans_list_cache_key(pageno=pageno, resumeslug=resumeslug))
        if cached_data:
            return Response(cached_data, status=200)
        paginator=GeneralPagination()
        queryset=paginator.paginate_queryset(ResumeScan.objects.select_related('resume__profile__user').filter(resume__slug=resumeslug, resume__profile__user=request.user).order_by("-created_on"), view=self, request=request)
        serial=ResumeScanSerializer(queryset, many=True)
        response=paginator.get_paginated_response(serial.data)
        cache.set(resume_scans_list_cache_key(pageno=pageno, resumeslug=resumeslug), response, timeout=8000)
        return response

    def post(self, request, resumeslug):
        serial=ResumeScanSerializer(data=request.data)
        if serial.is_valid():
            jd=serial.validated_data['job_description']
            resume_data=get_object_or_404(Resume.objects.select_related('profile__user'), slug=resumeslug, profile__user=request.user)
            if not resume_data.resumedata:
                return Response({'message':'the resumepdf is not processed yet wait or try later'}, status=500)
            atscorecalculationtask.delay(jd=jd, resumeslug=resume_data.slug)
            return Response({'message':'ats score will be calculated in a moment'}, status=200)
        return Response(serial.errors, status=400)

class ResumeScanDetailAPI(APIView):
    throttle_classes=[GeneralThrottle]
    permission_classes=[IsAuthenticated]
    def get(self, request, resumeslug, scanslug):
        cached_data=cache.get(resume_scans_detail_cache_key(resumeslug=resumeslug, scanslug=scanslug))
        if cached_data:
            return Response(cached_data, status=200)
        data=get_object_or_404(ResumeScan.objects.select_related('resume__profile__user'), resume__profile__user=request.user, resume__slug=resumeslug, slug=scanslug)
        serial=ResumeScanSerializer(data)
        cache.set(resume_scans_detail_cache_key(resumeslug=resumeslug, scanslug=scanslug), serial.data, timeout=8000)
        return Response(serial.data, status=200)

class CreatedResumeListAPI(APIView):
    throttle_classes=[GeneralThrottle]
    permission_classes=[IsAuthenticated]
    def get(self, request):
        pageno=request.query_params.get("page", "1")
        cached_data=cache.get(created_resume_cache_key(pageno=pageno, userid=request.user.id))
        if cached_data:
            return Response(cached_data, status=200)
        paginator=CreatedResumePagination()
        queryset=paginator.paginate_queryset(ResumeCreation.objects.select_related('profile__user', 'scan').filter(profile__user=request.user).order_by("-created_on"), view=self, request=request)
        serial=ResumeCreationSerializer(queryset, many=True)
        response=paginator.get_paginated_response(serial.data)
        cache.set(created_resume_cache_key(pageno=pageno, userid=request.user.id), response, timeout=3000)
        return Response(response, status=200)

class CreatedResumeDetailAPI(APIView):
    throttle_classes=[GeneralThrottle]
    permission_classes=[IsAuthenticated]
    def get(self, request, slug):
        cached_data=cache.get(created_resume_detail_cache_key(userid=request.user.id, slug=slug))
        if cached_data:
            return Response(cached_data, status=200)
        data=get_object_or_404(ResumeCreation.objects.select_related('profile__user', 'scan'), profile__user=request.user, slug=slug)
        serial=ResumeCreation(data)
        cache.set(created_resume_detail_cache_key(userid=request.user.id, slug=slug), serial.data, timeout=3000)
        return Response(serial.data, status=200)

class ATSResumeCreationAPI(APIView):
    throttle_classes=[ResumeCreateThrottle]
    permission_classes=[IsAuthenticated]
    def post(self, request, scanslug):
        scan_data=get_object_or_404(ResumeScan.objects.select_related('resume__profile__user'), resume__profile__user=request.user, slug=scanslug)
        if scan_data.ats_score > 80:
            return Response({'message':'the ats score is already good..no need to change anything'}, status=400)
        atsfriendlyresumecreationtask.delay(scanid=scan_data.id)
        return Response({'message':'the resume will be created and saved shortly'})


        
                