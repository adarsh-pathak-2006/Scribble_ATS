import os

from celery import Celery

os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "config.settings",
)

# Clear any conflicting Celery broker/backend environment variables that might leak from shell or sibling projects
for env_key in ("CELERY_BROKER_URL", "CELERY_RESULT_BACKEND"):
    os.environ.pop(env_key, None)

app = Celery("config")

app.config_from_object(
    "django.conf:settings",
    namespace="CELERY",
)

app.autodiscover_tasks()
