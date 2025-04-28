from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist

# Create your models here.
class University(models.Model):
    university_name = models.CharField(max_length = 200)
    university_domain = models.CharField(max_length = 100, unique = True)
    university_logo = models.ImageField(upload_to="university_logos/", max_length = 200, null=True, blank=True)

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
        extra_fields.setdefault('role', 'A')
        extra_fields.setdefault('is_active', 1)

        try:
            university = University.objects.get(university_domain="@admin.com")
        except ObjectDoesNotExist:
            university = None

        extra_fields.setdefault('university', university)

        return self.create_user(email, password, **extra_fields)

#Custom user
class User(AbstractUser):
    is_active = models.BooleanField(default=False)  #Require activation for new user
    email = models.EmailField(unique=True)  #Unique email
    username = None
    dob = models.DateField(max_length=100, null=False, default='2000-01-01')
    address = models.CharField(max_length=200, null=False, default='Test Address')
    postcode = models.CharField(max_length=50, null=False, default='BS16 1ZX')
    bio = models.CharField(max_length=200, null=True, blank=True)
    interests = models.CharField(max_length=200, null=True, blank=True)
    role = models.CharField(max_length=1, default='S') #S for student, E for event manager, C for community leader
    profile_picture = models.ImageField(upload_to="profile_pics/", max_length = 200, null=True, blank=True)
    university = models.ForeignKey(University, on_delete=models.CASCADE)

    USERNAME_FIELD = "email"  #Use email for login
    REQUIRED_FIELDS = []

    objects = CustomUserManager()  #Using custom user manager
    def get_profile_picture_url(self):
        """Return the full S3 URL for the profile picture or a default image."""
        if self.profile_picture:
            return self.profile_picture.url
        return ""
    

#Keyword
class Keyword(models.Model):
    keyword = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.keyword

#Community
class Community(models.Model):
    community_name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    rules = models.TextField(null=True, blank=True)
    privacy = models.CharField(max_length=50, null=True, blank=True)
    keywords = models.ManyToManyField(Keyword, through="CommunityKeyword", related_name="communities") 
    is_community_owner = models.ForeignKey(
    User,
    on_delete=models.CASCADE,
    related_name="owned_communities",
    null=True,
    blank=True
    )

    
    def __str__(self):
        return self.community_name


#Junction table for Communities and Keywords (Many to many)
class CommunityKeyword(models.Model):
    community = models.ForeignKey("Community", on_delete=models.CASCADE)
    keyword = models.ForeignKey("Keyword", on_delete=models.CASCADE)

    class Meta:
        unique_together = ('community', 'keyword')  #To prevent duplicates

    def __str__(self):
        return f"{self.community.community_name} - {self.keyword.keyword}"

#Junction table for Users and Communities (Many to many)
class UserCommunity(models.Model):
    COMMUNITY_ROLES = (
    ("Leader", "Leader"),
    ("EventManager", "Event Manager"),
    ("Member", "Member"),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="user_communities")
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name="user_communities")
    joined_at = models.DateTimeField(auto_now_add=True) 
    role = models.CharField(max_length=20,default="Member")

    class Meta:
        unique_together = ('user', 'community')  #To prevent duplicates

    def __str__(self):
        return f"{self.user.email} ({self.role}) in {self.community.community_name}"
    
#Junction table for Users and requests to join private Communities
class UserRequestCommunity(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    community = models.ForeignKey(Community, on_delete=models.CASCADE)
    requested_at = models.DateTimeField(auto_now_add=True)



#Event 
class Event(models.Model):
    event_name = models.CharField(max_length=255)
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name="events")
    date = models.DateTimeField()  
    location = models.CharField(max_length=255, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    event_type = models.CharField(max_length=50, null=True, blank=True)

    def __str__(self):
        return self.event_name
    
from storages.backends.s3boto3 import S3Boto3Storage
s3_storage = S3Boto3Storage()

class Post(models.Model):
    created_at = models.DateField(auto_now_add=True)
    post_text = models.TextField(null=True, blank=True)
    image = models.ImageField(upload_to='post_images/', storage=s3_storage, null=True, blank=True)
    community = models.ForeignKey(
        Community, on_delete=models.CASCADE, related_name="posts", null=True, blank=True  # Allow global posts
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")

    def __str__(self):
        return f"Post {self.id} by {self.user.email} {'in ' + self.community.community_name if self.community else ' (Global)'}"

    @property
    def like_count(self):
        return self.post_likes.count() 

    
# New class M2M relationship for keeping track of likes on posts
class PostLike(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="post_likes")
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="post_likes")  
    liked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "post") # Prevent duplicate likes

    def __str__(self):
        return f"{self.user.email} liked Post {self.post.id}"



#PinnedPost
class PinnedPost(models.Model):
    post = models.OneToOneField(Post, on_delete=models.CASCADE, related_name="pinned_post")
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name="pinned_posts")
    pinned_at = models.DateTimeField(auto_now_add=True)
    pinned_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="pinned_posts")

    order = models.IntegerField(default=0)

    class Meta:                                 
        ordering = ['community', 'order']        # Default ordering by community then order

    def __str__(self):
        return f"Pinned Post {self.post.id} in {self.community.community_name} by {self.pinned_by.email}"

#Follow
class Follow(models.Model):
    following_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="following")
    followed_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="followers")
    followed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('following_user', 'followed_user')

    def __str__(self):
        return f"{self.following_user.email} follows {self.followed_user.email}"

#RSVP
class RSVP(models.Model):
    RSVP_STATUS_CHOICES = [
        ('Accepted', 'Accepted'),
        ('Tentative', 'Tentative'),
        ('Declined', 'Declined'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="rsvps")
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="rsvps")
    status = models.CharField(max_length=10, choices=RSVP_STATUS_CHOICES)
    rsvp_date = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} RSVP {self.status} for {self.event.event_name}"

#Achievement
class Achievement(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="achievements")
    title = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    date_achieved = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.title} by {self.user.email}"

#Comment
class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comments")
    comment_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.user.email} on post {self.post.id}"

class Announcement(models.Model):
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name="announcements")
    title = models.CharField(max_length=255)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="announcements")

    def __str__(self):
        return f"{self.title} ({self.community.community_name})"
    