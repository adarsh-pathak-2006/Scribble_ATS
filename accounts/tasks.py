import requests
from celery import shared_task
from config.cache_keys import session_cachekey, otp_cachekey
from django.core.cache import cache
from django.conf import settings

@shared_task
def otpcreationtask(id):
    sess_data=cache.get(session_cachekey(sessionid=id))
    response=requests.post(url=settings.OTP_URL, json={'email':sess_data.get("email")})
    generated_otp=response.get("otp")
    cache.set(otp_cachekey(sessionid=id, email=sess_data.get("email")), generated_otp, timeout=3000)
    return f"otp sent to the {sess_data.get("email")}"
