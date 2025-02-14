from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.
class University(models.Model):
    university_name = models.CharField(max_length = 200)
    university_domain = models.CharField(max_length = 100, unique = True)
    university_logo_path = models.CharField(max_length = 200)

class User(AbstractUser):
    profile_picture_path = models.CharField(max_length = 200)
    university = models.ForeignKey(University, on_delete=models.CASCADE)