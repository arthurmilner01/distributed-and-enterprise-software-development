from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.
class University(models.Model):
    university_name = models.CharField(max_length = 200)
    university_domain = models.CharField(max_length = 100, unique = True)
    university_logo = models.ImageField(upload_to="university_logos/", max_length = 200, null=True, blank=True)

class User(AbstractUser):
    bio = models.CharField(max_length=200, null=True, blank=True)
    interests = models.CharField(max_length=200, null=True, blank=True)
    role = models.CharField(max_length=1, default='S') #S for student, E for event manager, C for community leader
    profile_picture = models.ImageField(upload_to="profile_pics/", max_length = 200, null=True, blank=True)
    university = models.ForeignKey(University, on_delete=models.CASCADE)