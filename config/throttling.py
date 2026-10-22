from rest_framework.throttling import UserRateThrottle

class OTPGenerationThrottle(UserRateThrottle):
    rate="10/hour"

class OTPVerificationThrottle(UserRateThrottle):
    rate="15/hour"

class GeneralThrottle(UserRateThrottle):
    rate="30/minute"