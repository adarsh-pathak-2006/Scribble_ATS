import requests
from celery import shared_task
from config.cache_keys import session_cachekey, otp_cachekey
from django.core.cache import cache
from django.conf import settings

@shared_task
def otpcreationtask(id):
    sess_data=cache.get(session_cachekey(sessionid=id))
    if not sess_data:
        return "Registration session expired"
    response=requests.post(url=settings.OTP_URL, json={'email':sess_data.get("email")})
    response.raise_for_status()
    data = response.json()
    generated_otp = data.get("otp")
    cache.set(otp_cachekey(sessionid=id, email=sess_data.get("email")), str(generated_otp), timeout=3000)
    return f"otp sent to the {sess_data.get('email')}"
