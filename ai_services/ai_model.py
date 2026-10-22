from google import genai
from google.genai import types
from django.conf import settings
from .prompts import ats_friendly_resume_prompt, ats_scoring_prompt

from accounts.serializers import ResumeSerializer


client = genai.Client(api_key=settings.GEMINI_API_KEY)


RESUME_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "personal_info": {
            "type": "OBJECT",
            "properties": {
                "name": {"type": "STRING"},
                "email": {"type": "STRING"},
                "phone": {"type": "STRING"},
                "location": {"type": "STRING"},
                "linkedin": {"type": "STRING"},
                "github": {"type": "STRING"},
            },
            "required": [
                "name", "email", "phone",
                "location", "linkedin", "github",
            ],
        },
        "summary": {"type": "STRING"},
        "skills": {
            "type": "OBJECT",
            "properties": {
                "programming": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"},
                },
                "backend": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"},
                },
                "databases": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"},
                },
                "tools": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"},
                },
                "other": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"},
                },
            },
            "required": [
                "programming", "backend", "databases",
                "tools", "other",
            ],
        },
        "experience": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "role": {"type": "STRING"},
                    "company": {"type": "STRING"},
                    "start_date": {"type": "STRING"},
                    "end_date": {"type": "STRING"},
                    "bullets": {
                        "type": "ARRAY",
                        "items": {"type": "STRING"},
                    },
                },
                "required": [
                    "role", "company", "start_date",
                    "end_date", "bullets",
                ],
            },
        },
        "projects": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "name": {"type": "STRING"},
                    "technologies": {
                        "type": "ARRAY",
                        "items": {"type": "STRING"},
                    },
                    "bullets": {
                        "type": "ARRAY",
                        "items": {"type": "STRING"},
                    },
                    "url": {"type": "STRING"},
                },
                "required": [
                    "name", "technologies", "bullets", "url",
                ],
            },
        },
        "education": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "degree": {"type": "STRING"},
                    "institution": {"type": "STRING"},
                    "start_date": {"type": "STRING"},
                    "end_date": {"type": "STRING"},
                    "details": {
                        "type": "ARRAY",
                        "items": {"type": "STRING"},
                    },
                },
                "required": [
                    "degree", "institution", "start_date",
                    "end_date", "details",
                ],
            },
        },
        "certifications": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
        },
    },
    "required": [
        "personal_info", "summary", "skills",
        "experience", "projects", "education",
        "certifications",
    ],
}


def generate_resume(resume_text, job_description):
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=ats_friendly_resume_prompt(jd=job_description, resumetxt=resume_text),
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=RESUME_SCHEMA,
            temperature=0.2,
        ),
    )

    if response.text is None:
        raise ValueError("Gemini returned no response.")

    import json

    data = json.loads(response.text)

    serializer = ResumeSerializer(data=data)
    serializer.is_valid(raise_exception=True)

    return serializer.validated_data


def calculate_ats_score(resume_text, job_description):
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=ats_scoring_prompt(jd=job_description, resumetxt=resume_text),
        config=types.GenerateContentConfig(
            response_mime_type="text/plain",
            temperature=0,
        ),
    )

    score = int(response.text.strip())

    if not 0 <= score <= 100:
        raise ValueError("ATS score must be between 0 and 100")

    return score
