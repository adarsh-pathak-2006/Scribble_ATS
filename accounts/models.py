from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    user=models.OneToOneField(User, on_delete=models.CASCADE)
    nickname=models.CharField(max_length=100, null=True)
    bio=models.TextField(null=True, blank=True)
    pfp=models.ImageField(upload_to='pfps/', null=True, blank=True)
    created_on=models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.nickname
