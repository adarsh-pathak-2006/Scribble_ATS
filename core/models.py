from django.db import models
from accounts.models import Profile
from django.utils.crypto import get_random_string

def slug_field_generation():
    return get_random_string(length=10)

class Resume(models.Model):
    profile=models.ForeignKey(Profile, on_delete=models.CASCADE)
    resumepdf=models.FileField(upload_to='resumes/')
    resumedata=models.TextField(null=True)
    created_on=models.DateTimeField(auto_now_add=True)
    slug=models.SlugField(default=slug_field_generation, unique=True, editable=False)

    def __str__(self):
        nickname = self.profile.nickname or self.profile.user.username
        return f"resume of {nickname}"


class ResumeScan(models.Model):
    resume=models.ForeignKey(Resume, on_delete=models.CASCADE)
    job_description=models.TextField()
    ats_score=models.IntegerField(null=True)
    created_on=models.DateTimeField(auto_now_add=True)
    slug=models.SlugField(default=slug_field_generation, unique=True, editable=False)

    def __str__(self):
        nickname = self.resume.profile.nickname or self.resume.profile.user.username
        return f"resumescan of {nickname}"


class ResumeCreation(models.Model):
    profile=models.ForeignKey(Profile, on_delete=models.CASCADE)
    scan=models.ForeignKey(ResumeScan, on_delete=models.CASCADE)
    generated_resume=models.TextField(null=True)
    created_on=models.DateTimeField(auto_now_add=True)
    slug=models.SlugField(default=slug_field_generation, unique=True, editable=False)

    def save(self, *args, **kwargs):
        if self.scan.ats_score is None:
            raise ValueError("The ATS score has not been generated yet.")
        if self.scan.ats_score >= 80:
            raise ValueError("The ATS Score is already above 80. No new resume creation required.")
        return super().save(*args, **kwargs)

    def __str__(self):
        nickname = self.profile.nickname or self.profile.user.username
        return f"generated resume for {nickname}"
