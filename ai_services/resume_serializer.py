from rest_framework import serializers


class PersonalInfoSerializer(serializers.Serializer):
    name = serializers.CharField(required=False, allow_blank=True, default='')
    email = serializers.CharField(required=False, allow_blank=True, default='')
    phone = serializers.CharField(required=False, allow_blank=True, default='')
    location = serializers.CharField(required=False, allow_blank=True, default='')
    linkedin = serializers.CharField(required=False, allow_blank=True, default='')
    github = serializers.CharField(required=False, allow_blank=True, default='')


class SkillsSerializer(serializers.Serializer):
    programming = serializers.ListField(
        child=serializers.CharField(allow_blank=True), required=False, default=list
    )
    backend = serializers.ListField(
        child=serializers.CharField(allow_blank=True), required=False, default=list
    )
    databases = serializers.ListField(
        child=serializers.CharField(allow_blank=True), required=False, default=list
    )
    tools = serializers.ListField(
        child=serializers.CharField(allow_blank=True), required=False, default=list
    )
    other = serializers.ListField(
        child=serializers.CharField(allow_blank=True), required=False, default=list
    )


class ExperienceSerializer(serializers.Serializer):
    role = serializers.CharField(required=False, allow_blank=True, default='')
    company = serializers.CharField(required=False, allow_blank=True, default='')
    start_date = serializers.CharField(required=False, allow_blank=True, default='')
    end_date = serializers.CharField(required=False, allow_blank=True, default='')
    bullets = serializers.ListField(
        child=serializers.CharField(allow_blank=True), required=False, default=list
    )


class ProjectSerializer(serializers.Serializer):
    name = serializers.CharField(required=False, allow_blank=True, default='')
    technologies = serializers.ListField(
        child=serializers.CharField(allow_blank=True), required=False, default=list
    )
    bullets = serializers.ListField(
        child=serializers.CharField(allow_blank=True), required=False, default=list
    )
    url = serializers.CharField(required=False, allow_blank=True, default='')


class EducationSerializer(serializers.Serializer):
    degree = serializers.CharField(required=False, allow_blank=True, default='')
    institution = serializers.CharField(required=False, allow_blank=True, default='')
    start_date = serializers.CharField(required=False, allow_blank=True, default='')
    end_date = serializers.CharField(required=False, allow_blank=True, default='')
    details = serializers.ListField(
        child=serializers.CharField(allow_blank=True), required=False, default=list
    )


class ResumeSerializer(serializers.Serializer):
    personal_info = PersonalInfoSerializer(required=False, default=dict)
    summary = serializers.CharField(required=False, allow_blank=True, default='')
    skills = SkillsSerializer(required=False, default=dict)
    experience = ExperienceSerializer(many=True, required=False, default=list)
    projects = ProjectSerializer(many=True, required=False, default=list)
    education = EducationSerializer(many=True, required=False, default=list)
    certifications = serializers.ListField(
        child=serializers.CharField(allow_blank=True), required=False, default=list
    )

