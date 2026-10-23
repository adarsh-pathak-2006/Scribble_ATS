import os
from rest_framework.throttling import UserRateThrottle

IS_DEV_OR_TEST = os.getenv("DEBUG", "True").lower() in ("true", "1")

class OTPGenerationThrottle(UserRateThrottle):
    scope = "otp_generation"
    rate = os.getenv("THROTTLE_OTP_GEN", "100/hour" if IS_DEV_OR_TEST else "10/hour")

class OTPVerificationThrottle(UserRateThrottle):
    scope = "otp_verification"
    rate = os.getenv("THROTTLE_OTP_VERIFY", "200/hour" if IS_DEV_OR_TEST else "15/hour")

class GeneralThrottle(UserRateThrottle):
    scope = "general"
    rate = os.getenv("THROTTLE_GENERAL", "300/minute" if IS_DEV_OR_TEST else "30/minute")

class ResumeScanThrottle(UserRateThrottle):
    scope = "resume_scan"
    rate = os.getenv("THROTTLE_SCAN", "200/hour" if IS_DEV_OR_TEST else "30/hour")

class ResumeCreateThrottle(UserRateThrottle):
    scope = "resume_create"
    rate = os.getenv("THROTTLE_CREATE", "200/hour" if IS_DEV_OR_TEST else "25/hour")