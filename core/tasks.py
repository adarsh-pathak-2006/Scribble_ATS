import pymupdf
from django.shortcuts import get_object_or_404
from celery import shared_task
from accounts.models import Profile
from .models import Resume

@shared_task
def processresumepdftotext(userid, resumeid):
    resume=get_object_or_404(Resume.objects.select_related('profile'), profile__user__id=userid, id=resumeid)
    with resume.file.open("rb") as pdf_file:
        pdf_bytes = pdf_file.read()

    with pymupdf.open(stream=pdf_bytes, filetype="pdf") as pdf:
        resume_text = "\n".join(
            page.get_text(sort=True)
            for page in pdf
        )

    resume.resumedata=resume_text
    resume.save()
    return "resume text created and saved in the db"
