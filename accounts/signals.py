from django.dispatch import receiver
from django.db.models.signals import post_save
from django.contrib.auth.models import User
from .models import Profile
from config.cache_keys import profile_cache_key
from django.core.cache import cache

@receiver(post_save, sender=User)
def profilecreationafterregistration(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=Profile)
def profilecacheinvalidation(sender, instance, created, **kwargs):
    cache.delete(profile_cache_key(userid=instance.user.id))