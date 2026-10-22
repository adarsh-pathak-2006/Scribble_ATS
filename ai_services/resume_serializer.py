from rest_framework import serializers


class PersonalInfoSerializer(serializers.Serializer):
    name = serializers.CharField()
    email = serializers.CharField()
    phone = serializers.CharField()
    location = serializers.CharField()
    linkedin = serializers.CharField()
    github = serializers.CharField()


class SkillsSerializer(serializers.Serializer):
    programming = serializers.ListField(
        child=serializers.CharField()
    )
    backend = serializers.ListField(
        child=serializers.CharField()
    )
    databases = serializers.ListField(
        child=serializers.CharField()
    )
    tools = serializers.ListField(
        child=serializers.CharField()
    )
    other = serializers.ListField(
        child=serializers.CharField()
    )


class ExperienceSerializer(serializers.Serializer):
    role = serializers.CharField()
    company = serializers.CharField()
    start_date = serializers.CharField()
    end_date = serializers.CharField()
    bullets = serializers.ListField(
        child=serializers.CharField()
    )


class ProjectSerializer(serializers.Serializer):
    name = serializers.CharField()
    technologies = serializers.ListField(
        child=serializers.CharField()
    )
    bullets = serializers.ListField(
        child=serializers.CharField()
    )
    url = serializers.CharField()


class EducationSerializer(serializers.Serializer):
    degree = serializers.CharField()
    institution = serializers.CharField()
    start_date = serializers.CharField()
    end_date = serializers.CharField()
    details = serializers.ListField(
        child=serializers.CharField()
    )


class ResumeSerializer(serializers.Serializer):
    personal_info = PersonalInfoSerializer()
    summary = serializers.CharField()
    skills = SkillsSerializer()
    experience = ExperienceSerializer(many=True)
    projects = ProjectSerializer(many=True)
    education = EducationSerializer(many=True)
    certifications = serializers.ListField(
        child=serializers.CharField()
    )
