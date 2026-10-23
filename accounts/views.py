import hmac
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Profile
from .serializers import RegisterSerializer, ProfileSerializer, OTPSerializer, PasswordSerializer
from config.cache_keys import session_cachekey, otp_cachekey, profile_cache_key
from django.core.cache import cache
from django.utils.crypto import get_random_string
from rest_framework.permissions import AllowAny, IsAuthenticated
from config.throttling import OTPGenerationThrottle, OTPVerificationThrottle, GeneralThrottle
from .tasks import otpcreationtask

SESSION_TIMEOUT = 600  # 10 minutes
MAX_OTP_ATTEMPTS = 5

class RegisterAPI(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [OTPGenerationThrottle]

    def post(self, request):
        serial = RegisterSerializer(data=request.data)
        if serial.is_valid():
            username = serial.validated_data['username']
            email = serial.validated_data.get("email")

            if User.objects.filter(Q(username=username) | Q(email=email)).exists():
                return Response({'message': 'Username or email already exists'}, status=status.HTTP_400_BAD_REQUEST)
            sessid = get_random_string(length=32)
            cache.set(
                session_cachekey(sessionid=sessid),
                {'username': username, 'email': email, 'verified': False, 'attempts': 0},
                timeout=SESSION_TIMEOUT
            )
            otpcreationtask.delay(id=sessid)
            return Response({'message': 'OTP generated successfully', 'session_id': sessid}, status=status.HTTP_201_CREATED)
        return Response(serial.errors, status=status.HTTP_400_BAD_REQUEST)

class OTPVerificationAPI(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [OTPVerificationThrottle]

    def post(self, request, sessid):
        sess_data = cache.get(session_cachekey(sessionid=sessid))
        if not sess_data:
            return Response({'message': 'Registration session expired or does not exist.'}, status=status.HTTP_400_BAD_REQUEST)
        if sess_data.get("verified"):
            return Response({'message': 'Session is already verified. Please proceed to set your password.'}, status=status.HTTP_400_BAD_REQUEST)

        attempts = sess_data.get('attempts', 0)
        if attempts >= MAX_OTP_ATTEMPTS:
            cache.delete(session_cachekey(sessionid=sessid))
            cache.delete(otp_cachekey(sessionid=sessid, email=sess_data['email']))
            return Response({'message': 'Too many failed attempts. Registration session has been invalidated.'}, status=status.HTTP_400_BAD_REQUEST)

        gen_otp = cache.get(otp_cachekey(sessionid=sessid, email=sess_data['email']))
        if not gen_otp:
            return Response({'message': 'OTP expired or was not generated. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)

        serial = OTPSerializer(data=request.data)
        if serial.is_valid():
            entered_otp = str(serial.validated_data['otp']).strip()
            expected_otp = str(gen_otp).strip()

            if not hmac.compare_digest(expected_otp, entered_otp):
                sess_data['attempts'] = attempts + 1
                remaining = MAX_OTP_ATTEMPTS - sess_data['attempts']
                cache.set(session_cachekey(sessionid=sessid), sess_data, timeout=SESSION_TIMEOUT)
                return Response(
                    {'message': f'Incorrect OTP entered. Attempts remaining: {remaining}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            sess_data['verified'] = True
            cache.set(session_cachekey(sessionid=sessid), sess_data, timeout=SESSION_TIMEOUT)
            cache.delete(otp_cachekey(sessionid=sessid, email=sess_data['email']))
            return Response({"message": "OTP verified successfully. You may now set your password."}, status=status.HTTP_200_OK)
        return Response(serial.errors, status=status.HTTP_400_BAD_REQUEST)

class PasswordSetAPI(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [GeneralThrottle]

    def post(self, request, sessid):
        sess_data = cache.get(session_cachekey(sessionid=sessid))
        if not sess_data:
            return Response({'message': 'Registration session expired. Please register again.'}, status=status.HTTP_400_BAD_REQUEST)
        if not sess_data.get('verified'):
            return Response({'message': 'Session is not verified yet. Please complete OTP verification first.'}, status=status.HTTP_400_BAD_REQUEST)

        serial = PasswordSerializer(data=request.data)
        if serial.is_valid():
            password = serial.validated_data['password']
            username = sess_data.get("username")
            email = sess_data.get("email")

            temp_user = User(username=username, email=email)
            try:
                validate_password(password, user=temp_user)
            except ValidationError as e:
                return Response({'errors': e.messages}, status=status.HTTP_400_BAD_REQUEST)

            try:
                User.objects.create_user(username=username, email=email, password=password)
            except IntegrityError:
                return Response({'message': 'A user with this username or email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

            cache.delete(session_cachekey(sessionid=sessid))
            return Response({'message': 'Registration successful. You may now log in.'}, status=status.HTTP_201_CREATED)
        return Response(serial.errors, status=status.HTTP_400_BAD_REQUEST)

class MyProfileAPI(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [GeneralThrottle]

    def get(self, request):
        cached_data = cache.get(profile_cache_key(userid=request.user.id))
        if cached_data:
            return Response(cached_data, status=status.HTTP_200_OK)
        data = get_object_or_404(Profile.objects.select_related('user'), user=request.user)
        serial = ProfileSerializer(data, context={'request': request})
        cache.set(profile_cache_key(userid=request.user.id), serial.data, timeout=10000)
        return Response(serial.data, status=status.HTTP_200_OK)

    def put(self, request):
        instance = get_object_or_404(Profile.objects.select_related('user'), user=request.user)
        serial = ProfileSerializer(instance, data=request.data, partial=True, context={'request': request})
        if serial.is_valid():
            serial.save()
            return Response(serial.data, status=status.HTTP_200_OK)
        return Response(serial.errors, status=status.HTTP_400_BAD_REQUEST)

    

        