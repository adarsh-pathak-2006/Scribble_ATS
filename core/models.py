from django.db import models
from accounts.models import Profile

class Resume(models.Model):
    profile=models.ForeignKey(Profile, on_delete=models.CASCADE)
    resumepdf=models.FileField(upload_to='resumes/')
    resumedata=models.TextField(null=True)
    created_on=models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"resume of {self.user.nickname}"


class ResumeScan(models.Model):
    resume=models.ForeignKey(Resume, on_delete=models.CASCADE)
    job_description=models.TextField()
    ats_score=models.IntegerField(null=True)
    created_on=models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"resumescan of {self.user.nickname}"


class ResumeCreation(models.Model):
    scan=models.ForeignKey(ResumeScan, on_delete=models.CASCADE)
    generated_resume=models.TextField(null=True)
    created_on=models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.scan.ats_score>=80:
            raise ValueError("the ATS Score is already above 80. No new resume creation required")
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"generated resume for {self.scan.user.nickname}"
