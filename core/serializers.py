from rest_framework.serializers import ModelSerializer
from .models import ResumeScan, ResumeCreation, Resume
from accounts.serializers import ProfileSerializer

class ResumeSerializer(ModelSerializer):
    profile=ProfileSerializer(read_only=True)
    class Meta:
        model=Resume
        fields='__all__'
        read_only_fields=['created_on', 'resumedata', 'slug']

class ResumeScanSerializer(ModelSerializer):
    resume=ResumeSerializer(read_only=True)
    class Meta:
        model=ResumeScan
        fields='__all__'
        read_only_fields=['ats_score', 'created_on', 'slug']


class ResumeCreationSerializer(ModelSerializer):
    scan=ResumeScanSerializer(read_only=True)
    class Meta:
        model=ResumeCreation
        fields='__all__'
        read_only_fields=['generated_resume', 'created_on', 'slug']