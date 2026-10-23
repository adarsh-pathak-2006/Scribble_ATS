from django.urls import path
from .views import ResumeListAPI, ResumeScanAPI, ResumeScanDetailAPI, CreatedResumeListAPI, CreatedResumeDetailAPI, ATSResumeCreationAPI
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', ResumeListAPI.as_view()),
    path('resume/', ResumeListAPI.as_view()),
    path('<slug:resumeslug>/scan/', ResumeScanAPI.as_view()),
    path('resume/<slug:resumeslug>/scan/', ResumeScanAPI.as_view()),
    path('<slug:resumeslug>/scan/<slug:scanslug>/', ResumeScanDetailAPI.as_view()),
    path('resume/<slug:resumeslug>/scan/<slug:scanslug>/', ResumeScanDetailAPI.as_view()),
    path('created/', CreatedResumeListAPI.as_view()),
    path('created/<slug:slug>/', CreatedResumeDetailAPI.as_view()),
    path('ats-resume/<slug:scanslug>/', ATSResumeCreationAPI.as_view()),
]


if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )