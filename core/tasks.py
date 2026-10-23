import json
import pymupdf
from celery import shared_task
from .models import Resume, ResumeScan, ResumeCreation
from accounts.models import Profile
from ai_services.ai_model import calculate_ats_score, generate_resume

MAX_PDF_PAGES = 15

@shared_task(ignore_result=True)
def processresumepdftotext(userid, resumeid):
    try:
        resume = Resume.objects.select_related('profile').get(profile__user__id=userid, id=resumeid)
    except Resume.DoesNotExist:
        return f"Resume id:{resumeid} does not exist"

    with resume.resumepdf.open("rb") as pdf_file:
        pdf_bytes = pdf_file.read()

    with pymupdf.open(stream=pdf_bytes, filetype="pdf") as pdf:
        num_pages = min(len(pdf), MAX_PDF_PAGES)
        resume_text = "\n".join(
            pdf[page_idx].get_text(sort=True)
            for page_idx in range(num_pages)
        )

    resume.resumedata = resume_text
    resume.save(update_fields=['resumedata'])
    return "resume text created and saved in the db"

@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={'max_retries': 3},
    ignore_result=True
)
def atscorecalculationtask(self, jd, resumeslug):
    try:
        resume_data = Resume.objects.select_related('profile').get(slug=resumeslug)
    except Resume.DoesNotExist:
        return f"Resume slug:{resumeslug} does not exist"

    if not resume_data.resumedata:
        raise ValueError(f"Resume text is empty or not yet parsed for {resumeslug}")

    response = calculate_ats_score(job_description=jd, resume_text=resume_data.resumedata)
    ResumeScan.objects.create(resume=resume_data, job_description=jd, ats_score=response)
    return f"ats score calculated for resumeslug:{resumeslug}"

@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={'max_retries': 3},
    ignore_result=True
)
def atsfriendlyresumecreationtask(self, scanid, userid=None):
    try:
        scan_data = ResumeScan.objects.select_related('resume__profile').get(id=scanid)
    except ResumeScan.DoesNotExist:
        return f"ResumeScan id:{scanid} does not exist"

    resume_text = scan_data.resume.resumedata
    if not resume_text:
        raise ValueError(f"Resume text is missing for scan {scanid}")

    jd = scan_data.job_description
    response = generate_resume(resume_text=resume_text, job_description=jd)
    profile_data = scan_data.resume.profile

    generated_text = json.dumps(response) if isinstance(response, (dict, list)) else str(response)
    ResumeCreation.objects.create(scan=scan_data, generated_resume=generated_text, profile=profile_data)
    return f"the resume is generated and saved for scanid:{scanid}"

