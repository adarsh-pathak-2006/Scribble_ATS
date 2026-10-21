from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Profile
from .serializers import RegisterSerializer, ProfileSerializer, OTPSerializer, PasswordSerializer
from config.cache_keys import session_cachekey, otp_cachekey, profile_cache_key
from django.core.cache import cache
from django.utils.crypto import get_random_string

class RegisterAPI(APIView):
    def post(self, request):
        serial=RegisterSerializer(data=request.data)
        if serial.is_valid():
            username=serial.validated_data['username']
            email=serial.validated_data.get("email")

            if User.objects.filter(Q(username=username) | Q(email=email)).exists():
                return Response({'message':'username or email already exists'}, status=400)
            sessid=get_random_string(length=10)
            cache.set(session_cachekey(sessionid=sessid), {'username':username, 'email':email, 'verified':False}, timeout=3000)
            return Response({'message':'otp generated', 'session_id':sessid}, status=201)
        return Response(serial.errors, status=400)

class OTPVerificationAPI(APIView):
    def post(self, request, sessid):
        sess_data=cache.get(session_cachekey(sessionid=sessid))
        if not sess_data:
            return Response({'message':'registration session expired'}, status=400)
        if sess_data.get("verified"):
            return Response({'message':'session already verified go ahead and set the password'}, status=400)
        gen_otp=cache.get(otp_cachekey(sessionid=sessid, email=sess_data['email']))
        if not gen_otp:
            return Response({'message':'OTP expired or wasnot generated'}, status=400)
        serial=OTPSerializer(data=request.data)
        if serial.is_valid():
            entered_otp=serial.validated_data['otp']
            if gen_otp != entered_otp:
                return Response({'message':'wrong otp entered try again'}, status=400)
            abc=sess_data['verified']=True
            cache.set(session_cachekey(sessionid=sessid), abc, timeout=3000)
            cache.delete(otp_cachekey(sessionid=sessid, email=sess_data['email']))
            return Response({"message":"otp verified successfully set password now"}, status=201)
        return Response(serial.errors, status=400)

class PasswordSetAPI(APIView):
    def post(self, request, sessid):
        sess_data=cache.get(session_cachekey(sessionid=sessid))
        if not sess_data:
            return Response({'message':'session expired retry'}, status=400)
        if not sess_data['verified']:
            return Response({'message':'session_data is not verified yet..get your dumbahh to register first'}, status=400)
        serial=PasswordSerializer(data=request.data)
        if serial.is_valid():
            password=serial.validated_data['password']
            User.objects.create_user(username=sess_data.get("username"), email=sess_data.get("email"), password=password)
            cache.delete(session_cachekey(sessionid=sessid))
            return Response({'message':'registration successfull'}, status=201)
        return Response(serial.errors, status=400)

class MyProfileAPI(APIView):
    def get(self, request):
        cached_data=cache.get(profile_cache_key(userid=request.user.id))
        if cached_data:
            return Response(cached_data, status=200)
        data=get_object_or_404(Profile, user=request.user)
        serial=ProfileSerializer(data)
        cache.set(profile_cache_key(userid=request.user.id), serial.data, timeout=10000)
        return Response(serial.data, status=200)

    def put(self, request):
        instance=get_object_or_404(Profile, user=request.user)
        serial=ProfileSerializer(instance, data=request.data, partial=True)
        if serial.is_valid():
            serial.save()
            return Response(serial.data, status=200)
        return Response(serial.errors, status=400)

    

        