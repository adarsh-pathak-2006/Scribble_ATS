from django.urls import path
from .views import RegisterAPI, OTPVerificationAPI, PasswordSetAPI, MyProfileAPI

urlpatterns = [
    path('register/', RegisterAPI.as_view()),
    path('otp-verify/<str:sessid>/', OTPVerificationAPI.as_view()),
    path('password-set/<str:sessid>/', PasswordSetAPI.as_view()),
    path('profile/', MyProfileAPI.as_view()),
]
