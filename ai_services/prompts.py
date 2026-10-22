def ats_scoring_prompt(jd, resumetxt):
    return f"""
        Evaluate how well this resume matches the job description.

        Resume:
        {resumetxt}

        Job Description:
        {jd}

        Return an ATS compatibility score from 0 to 100.
        Consider relevant skills, experience, qualifications,
        and job-description keyword matches.

        Return only an integer. No explanation, no text, no JSON.
        """

def ats_friendly_resume_prompt(jd, resumetxt):
    return f"""
Create an ATS-friendly resume tailored to the job description.

Use only facts supported by the original resume.
Do not invent skills, experience, qualifications, dates,
certifications, or achievements.

Use empty strings or empty lists for missing information.
Return the resume according to the supplied response schema.

ORIGINAL RESUME:
{resumetxt}

JOB DESCRIPTION:
{jd}
"""  