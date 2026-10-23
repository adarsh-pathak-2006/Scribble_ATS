from rest_framework import serializers
from .models import ResumeScan, ResumeCreation, Resume
from accounts.serializers import ProfileSerializer

class ResumeSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    class Meta:
        model = Resume
        fields = '__all__'
        read_only_fields = ['created_on', 'resumedata', 'slug']

class ResumeListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = ['id', 'slug', 'resumepdf', 'created_on']
        read_only_fields = ['id', 'slug', 'resumepdf', 'created_on']

class ResumeScanSerializer(serializers.ModelSerializer):
    resume = ResumeSerializer(read_only=True)
    class Meta:
        model = ResumeScan
        fields = '__all__'
        read_only_fields = ['ats_score', 'created_on', 'slug']

class ResumeScanListSerializer(serializers.ModelSerializer):
    resume_slug = serializers.CharField(source='resume.slug', read_only=True)
    class Meta:
        model = ResumeScan
        fields = ['id', 'slug', 'resume_slug', 'job_description', 'ats_score', 'created_on']
        read_only_fields = fields

class ResumeCreationSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    scan = ResumeScanSerializer(read_only=True)
    class Meta:
        model = ResumeCreation
        fields = '__all__'
        read_only_fields = ['generated_resume', 'created_on', 'slug']

class ResumeCreationListSerializer(serializers.ModelSerializer):
    scan_slug = serializers.CharField(source='scan.slug', read_only=True)
    ats_score = serializers.IntegerField(source='scan.ats_score', read_only=True)
    class Meta:
        model = ResumeCreation
        fields = ['id', 'slug', 'scan_slug', 'ats_score', 'created_on']
        read_only_fields = fields