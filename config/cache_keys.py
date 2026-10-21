def session_cachekey(sessionid):
    return f"session_cache_key_sessionid:{sessionid}"

def otp_cachekey(sessionid, email):
    return f"otp_cache_key_sessionid:{sessionid}_email:{email}"