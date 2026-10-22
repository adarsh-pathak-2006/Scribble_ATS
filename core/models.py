from django.db import models
from accounts.models import Profile


class ResumeScan(models.Model):
    user=models.ForeignKey(Profile, on_delete=models.CASCADE)
    resumepdf=models.FileField(upload_to='resumes/')
    job_description=models.TextField()
    resumedata=models.TextField(null=True)
    ats_score=models.IntegerField(null=True)
    created_on=models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"resume of {self.user.nickname}"


class ResumeCreation(models.Model):
    scan=models.ForeignKey(ResumeScan, on_delete=models.CASCADE)
    generated_resume=models.TextField(null=True)
    created_on=models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"generated resume for {self.scan.user.nickname}"
