from rest_framework.throttling import UserRateThrottle

class OTPGenerationThrottle(UserRateThrottle):
    scope = "otp_generation"
    rate = "10/hour"

class OTPVerificationThrottle(UserRateThrottle):
    scope = "otp_verification"
    rate = "15/hour"

class GeneralThrottle(UserRateThrottle):
    scope = "general"
    rate = "30/minute"

class ResumeScanThrottle(UserRateThrottle):
    scope = "resume_scan"
    rate = "30/hour"

class ResumeCreateThrottle(UserRateThrottle):
    scope = "resume_create"
    rate = "25/hour"