from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager

# Create your models here.
class University(models.Model):
    university_name = models.CharField(max_length = 200)
    university_domain = models.CharField(max_length = 100, unique = True)
    university_logo = models.ImageField(upload_to="university_logos/", max_length = 200, null=True, blank=True)
    

    from django.contrib.auth.models import BaseUserManager

#Custom user manager to allow no username
class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set.')
        
        email = self.normalize_email(email)

        #Creating user without the username
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """
        Create and return a superuser with an email, password, and extra fields.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        return self.create_user(email, password, **extra_fields)

#Custom user
class User(AbstractUser):
    is_active = models.BooleanField(default=False)  #Require activation for new user
    email = models.EmailField(unique=True)  #Unique email
    bio = models.CharField(max_length=200, null=True, blank=True)
    interests = models.CharField(max_length=200, null=True, blank=True)
    role = models.CharField(max_length=1, default='S') #S for student, E for event manager, C for community leader
    profile_picture = models.ImageField(upload_to="profile_pics/", max_length = 200, null=True, blank=True)
    university = models.ForeignKey(University, on_delete=models.CASCADE)

    USERNAME_FIELD = "email"  #Use email for login
    REQUIRED_FIELDS = []

    objects = CustomUserManager()  #Using custom user manager