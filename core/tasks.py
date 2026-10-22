import pymupdf
from django.shortcuts import get_object_or_404
from celery import shared_task
from accounts.models import Profile
from .models import Resume, ResumeScan
from ai_services.ai_model import calculate_ats_score

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

@shared_task
def atscorecalculationtask(jd, resumeslug):
    resume_data=get_object_or_404(Resume.objects.select_related('profile'), slug=resumeslug)
    response=calculate_ats_score(job_description=jd, resume_text=resume_data.resumedata)
    ResumeScan.objects.create(resume=resume_data, job_description=jd, ats_score=response)
    return f"ats score calculated for resumeslug:{resumeslug}"
