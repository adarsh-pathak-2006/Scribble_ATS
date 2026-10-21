def session_cachekey(sessionid):
    return f"session_cache_key_sessionid:{sessionid}"

def otp_cachekey(sessionid, email):
    return f"otp_cache_key_sessionid:{sessionid}_email:{email}"

def profile_cache_key(userid):
    return f"user_profile_cache_key_userid:{userid}"