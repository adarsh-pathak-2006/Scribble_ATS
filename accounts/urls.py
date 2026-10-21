from django.urls import path
from .views import RegisterAPI, OTPVerificationAPI, PasswordSetAPI, MyProfileAPI
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('register/', RegisterAPI.as_view()),
    path('otp-verify/<str:sessid>/', OTPVerificationAPI.as_view()),
    path('password-set/<str:sessid>/', PasswordSetAPI.as_view()),
    path('profile/', MyProfileAPI.as_view()),
    path('api/token-obtain/', TokenObtainPairView.as_view()),
    path('api/token/refresh/', TokenRefreshView.as_view()),
]
