from rest_framework import serializers
from .models import Profile
from django.contrib.auth.models import User

class UserGetSerializer(serializers.ModelSerializer):
    class Meta:
        model=User
        fields=['username', 'email']

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model=User
        fields=['username', 'email']

class OTPSerializer(serializers.Serializer):
    otp=serializers.CharField()

class PasswordSerializer(serializers.Serializer):
    password=serializers.CharField()

class ProfileSerializer(serializers.ModelSerializer):
    user=UserGetSerializer(read_only=True)
    class Meta:
        model=Profile
        fields='__all__'
        read_only_fields=['created_on']