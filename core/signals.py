from django.dispatch import receiver
from django.db.models.signals import post_save
from .tasks import processresumepdftotext
from .models import Resume, ResumeScan, ResumeCreation
from django.core.cache import cache
from config.cache_keys import (
    resume_scans_detail_cache_key,
    created_resume_detail_cache_key,
    bump_cache_version
)

@receiver(post_save, sender=Resume)
def processresumesignal(sender, instance, created, **kwargs):
    bump_cache_version("resumes", instance.profile.user.id)
    if created:
        processresumepdftotext.delay(userid=instance.profile.user.id, resumeid=instance.id)

@receiver(post_save, sender=ResumeScan)
def resumescancacheinvalidation(sender, instance, created, **kwargs):
    cache.delete(resume_scans_detail_cache_key(resumeslug=instance.resume.slug, scanslug=instance.slug))
    bump_cache_version("scans", instance.resume.slug)

@receiver(post_save, sender=ResumeCreation)
def resumecreationcacheinvalidation(sender, instance, created, **kwargs):
    cache.delete(created_resume_detail_cache_key(userid=instance.profile.user.id, slug=instance.slug))
    bump_cache_version("created_resumes", instance.profile.user.id)
