import requests
from celery import shared_task
from config.cache_keys import session_cachekey, otp_cachekey
from django.core.cache import cache
from django.conf import settings

@shared_task(
    bind=True,
    autoretry_for=(requests.RequestException,),
    retry_backoff=True,
    retry_kwargs={'max_retries': 3},
    ignore_result=True
)
def otpcreationtask(self, id):
    sess_data = cache.get(session_cachekey(sessionid=id))
    if not sess_data:
        return "Registration session expired"
    
    email = sess_data.get("email")
    response = requests.post(
        url=settings.OTP_URL,
        json={'email': email},
        timeout=(5.0, 10.0)
    )
    response.raise_for_status()
    data = response.json()
    generated_otp = str(data["data"]["otp"])
    
    cache.set(otp_cachekey(sessionid=id, email=email), generated_otp, timeout=600)
    return f"OTP sent successfully to {email}"
