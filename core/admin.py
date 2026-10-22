from django.contrib import admin
from .models import ResumeScan, ResumeCreation, Resume

admin.site.register(Resume)
admin.site.register(ResumeScan)
admin.site.register(ResumeCreation)
