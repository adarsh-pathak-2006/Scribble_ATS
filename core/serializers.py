from rest_framework.serializers import ModelSerializer
from .models import ResumeScan, ResumeCreation
from accounts.serializers import ProfileSerializer

class ResumeScanSerializer(ModelSerializer):
    user=ProfileSerializer(read_only=True)
    class Meta:
        model=ResumeScan
        fields='__all__'
        read_only_fields=['resume_data', 'ats_score', 'created_on']


class ResumeCreationSerializer(ModelSerializer):
    scan=ResumeScanSerializer(read_only=True)
    class Meta:
        model=ResumeCreation
        fields='__all__'
        read_only_fields=['generated_resume', 'created_on']