from django.core.cache import cache

def get_cache_version(namespace, entity_id):
    key = f"cache_ver:{namespace}:{entity_id}"
    version = cache.get(key)
    if version is None:
        version = 1
        cache.set(key, version, timeout=86400 * 30)
    return version

def bump_cache_version(namespace, entity_id):
    key = f"cache_ver:{namespace}:{entity_id}"
    try:
        cache.incr(key)
    except Exception:
        cache.set(key, 2, timeout=86400 * 30)

def session_cachekey(sessionid):
    return f"session_cache_key_sessionid:{sessionid}"

def otp_cachekey(sessionid, email):
    return f"otp_cache_key_sessionid:{sessionid}_email:{email}"

def profile_cache_key(userid):
    return f"user_profile_cache_key_userid:{userid}"

def resume_list_cachekey(userid, pageno="1", page_size="10", version=1):
    return f"resume_list_uid:{userid}_v:{version}_p:{pageno}_ps:{page_size}"

def resume_scans_list_cache_key(resumeslug, pageno="1", page_size="10", version=1):
    return f"resume_scan_list_slug:{resumeslug}_v:{version}_p:{pageno}_ps:{page_size}"

def resume_scans_detail_cache_key(resumeslug, scanslug):
    return f"resume_scan_detail_cache_key_resumeslug:{resumeslug}_scanslug:{scanslug}"

def created_resume_cache_key(userid, pageno="1", page_size="5", version=1):
    return f"created_resume_uid:{userid}_v:{version}_p:{pageno}_ps:{page_size}"

def created_resume_detail_cache_key(userid, slug):
    return f"created_resume_detail_cache_key_userid:{userid}_slug:{slug}"