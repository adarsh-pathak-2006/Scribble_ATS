from django.dispatch import receiver
from django.db.models.signals import post_save
from .tasks import processresumepdftotext
from .models import Resume, ResumeScan

@receiver(post_save, sender=Resume)
def processresumesignal(sender, instance, created, **kwargs):
    if created:
        processresumepdftotext.delay(userid=instance.profile.user.id, resumeid=instance.id)
