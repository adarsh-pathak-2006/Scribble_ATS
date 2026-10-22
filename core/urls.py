from django.urls import path
from .views import ResumeListAPI, ResumeScanAPI, ResumeScanDetailAPI, CreatedResumeListAPI, CreatedResumeDetailAPI, ATSResumeCreationAPI

urlpatterns = [
    path('resume/', ResumeListAPI.as_view()),
    path('resume/<slug:resumeslug>/scan/', ResumeScanAPI.as_view()),
    path('resume/<slug:resumeslug>/scan/<slug:scanslug>/', ResumeScanDetailAPI.as_view()),
    path('created/', CreatedResumeListAPI.as_view()),
    path('created/<slug:slug>/', CreatedResumeDetailAPI.as_view()),
    path('ats-resume/<slug:scanslug>/', ATSResumeCreationAPI.as_view()),
]
