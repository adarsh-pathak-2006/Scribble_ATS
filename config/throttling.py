from rest_framework.throttling import UserRateThrottle

class OTPGenerationThrottle(UserRateThrottle):
    rate="10/hour"

class OTPVerificationThrottle(UserRateThrottle):
    rate="15/hour"

class GeneralThrottle(UserRateThrottle):
    rate="30/minute"

class ResumeScanThrottle(UserRateThrottle):
    rate="30/hour"

class ResumeCreateThrottle(UserRateThrottle):
    rate="25/hour"