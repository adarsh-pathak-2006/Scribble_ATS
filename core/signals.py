from django.dispatch import receiver
from django.db.models.signals import post_save
from .tasks import processresumepdftotext
from .models import Resume, ResumeScan, ResumeCreation
from django.core.cache import cache
from config.cache_keys import resume_list_cachekey, resume_scans_list_cache_key, resume_scans_detail_cache_key, created_resume_cache_key, created_resume_detail_cache_key

@receiver(post_save, sender=Resume)
def processresumesignal(sender, instance, created, **kwargs):
    cache.delete(resume_list_cachekey(userid=instance.profile.user.id))
    if created:
        processresumepdftotext.delay(userid=instance.profile.user.id, resumeid=instance.id)

@receiver(post_save, sender=ResumeScan)
def resumescancacheinvalidation(sender, instance, created, **kwargs):
    cache.delete(resume_scans_detail_cache_key(resumeslug=instance.resume.slug, scanslug=instance.slug))
    for i in range(1,33):
        cache.delete(resume_scans_list_cache_key(pageno=i, resumeslug=instance.resume.slug))

@receiver(post_save, sender=ResumeCreation)
def resumecreationcacheinvalidation(sender, instance, created, **kwargs):
    cache.delete(created_resume_detail_cache_key(userid=instance.profile.user.id, slug=instance.slug))
    for i in range(1,33):
        cache.delete(created_resume_cache_key(pageno=i, userid=instance.profile.user.id))
