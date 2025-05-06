from rest_framework import serializers
from djoser.serializers import UserCreateSerializer, UserSerializer
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import *
from .models import Community, Keyword, UserCommunity
from django.contrib.auth import get_user_model
from datetime import date
import re

class UniversitySerializer(serializers.ModelSerializer):
    class Meta:
        model = University
        fields = "__all__"
        
storage = S3Boto3Storage()

# Custom Djoser for creating a user to remove username and use email
class CustomUserCreateSerializer(UserCreateSerializer):
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    dob = serializers.DateField(required=True)
    address = serializers.CharField(required=True)
    postcode = serializers.CharField(required=True)
    university = UniversitySerializer(read_only=True)
    class Meta(UserCreateSerializer.Meta):
        model = User
        fields = ['id', 'email', 'password', 'first_name', 'last_name', 'dob', 'address', 'postcode', 'university']
        extra_kwargs = {'password': {'write_only':True}}

    def create(self, validated_data):
        email = validated_data.get("email","")
        email_domain = email.split("@")[-1]
        # Sets user's university based on the domain of the email used to sign-up
        university = University.objects.filter(university_domain=email_domain).first()

        # Check user is over 16 years old
        today = date.today()
        inputAge = validated_data.get("dob", "")
        age = today.year - inputAge.year - ((today.month, today.day) < (inputAge.month, inputAge.day))

        if age < 16:
            raise serializers.ValidationError({"dob": "You must be at least 16 years old to register."})

        # If no university found
        if not university:
            raise serializers.ValidationError({"email": "No university found for this email domain, is this a valid university email?"})
        
        validated_data["university"] = university

        user = User.objects.create_user(**validated_data)
        return user

class CommentSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    user_name = serializers.CharField(source='user.first_name', read_only=True)
    user_last_name = serializers.CharField(source='user.last_name', read_only=True)
    user_image = serializers.SerializerMethodField() 

    class Meta:
        model = Comment
        fields = ["id", "user", "user_name", "user_last_name", "user_image", "comment_text", "created_at"]

    def get_user_image(self, obj):
        """Ensure correct URL for user profile image (S3 or default)"""
        if isinstance(obj, dict):
            user = obj.get('user', None)  # Get user if dict passed
        else:
            user = obj.user  # Access directly if it's a model

        if user and user.profile_picture:
            storage = S3Boto3Storage()
            return storage.url(user.profile_picture.name)
        
        return ""


# Add custom claims to the token
# This includes these details about a user in their token for easy access
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def get_token(self, user):
        token = super().get_token(user)

        token["id"] = user.id
        token["email"] = user.email
        token["role"] = user.role
        token["first_name"] = user.first_name
        token["last_name"] = user.last_name

        return token

from storages.backends.s3boto3 import S3Boto3Storage

# Serializer for user
class CustomUserSerializer(serializers.ModelSerializer):
    university = UniversitySerializer()
    profile_picture_url = serializers.SerializerMethodField()
    interests_list = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "bio",
            "interests",
            "interests_list", 
            "role",
            "profile_picture",
            "profile_picture_url",
            "university",
            "academic_program",
            "academic_year"
        ]
    
    def get_interests_list(self, obj):
        """Return a list of interest objects for the user"""
        user_interests = UserInterest.objects.filter(user=obj).select_related('interest')
        return [{'id': ui.interest.id, 'interest': ui.interest.interest} for ui in user_interests]

    def get_profile_picture_url(self, obj):
        if obj.profile_picture and hasattr(obj.profile_picture, "name"):
            storage = S3Boto3Storage()
            url = storage.url(obj.profile_picture.name)
            if url.startswith("/"):
                return "https:" + url
            elif not url.startswith("http"):
                return "https://" + url
            return url
        return ""





# For updating name, bio, interests and profile picture
class UserProfileUpdateSerializer(serializers.ModelSerializer):
    interests_list = serializers.JSONField(required=False)  # Change to JSONField
    
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'bio', 'profile_picture', 'interests', 'interests_list', 'academic_program', 'academic_year']

    def update(self, instance, validated_data):
        request = self.context.get('request')
        interests_list = validated_data.pop('interests_list', None)
        
        # Handle profile picture upload
        if 'profile_picture' in request.FILES:
            image = request.FILES['profile_picture']
            storage = S3Boto3Storage()
            file_path = f"profile_pics/{instance.id}/{image.name}"  
            saved_path = storage.save(file_path, image)  
            instance.profile_picture = saved_path
            
        # Update regular fields  
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.bio = validated_data.get('bio', instance.bio)
        instance.interests = validated_data.get('interests', instance.interests)
        instance.academic_program = validated_data.get('academic_program', instance.academic_program)
        instance.academic_year = validated_data.get('academic_year', instance.academic_year)
        
        # Handle interests relationship if provided
        if interests_list is not None:
            UserInterest.objects.filter(user=instance).delete()
            print(interests_list)
            if isinstance(interests_list, str):
                try:
                    import json
                    interests_list = json.loads(interests_list)
                except:
                    pass
            
            # Create new user interests from the list
            if isinstance(interests_list, list):
                for interest_item in interests_list:
                    interest_item = interest_item.strip() if isinstance(interest_item, str) else str(interest_item)
                    if interest_item:
                        interest_obj, created = Interest.objects.get_or_create(interest=interest_item)
                        UserInterest.objects.create(user=instance, interest=interest_obj)
        
        instance.save()
        return instance

#Serilizer for global posts

from app.models import Post, Comment, Community
from app.serializers import CommentSerializer

class PostSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.first_name", read_only=True)
    image = serializers.ImageField(required=False, allow_null=True)
    user_last_name = serializers.CharField(source="user.last_name", read_only=True)
    user_image = serializers.SerializerMethodField() 
    image_url = serializers.SerializerMethodField()
    like_count = serializers.IntegerField(read_only=True)
    community = serializers.PrimaryKeyRelatedField(
        queryset=Community.objects.all(),
        required=False,
        allow_null=True
    )
    community_name = serializers.SerializerMethodField()
    comments = CommentSerializer(many=True, read_only=True)
    liked_by_user = serializers.SerializerMethodField()
    is_members_only = serializers.BooleanField(required=False, default=False)
    class Meta:
        model = Post
        fields = [
            "id",
            "user",
            "user_name",
            "user_last_name",
            "user_image",
            "community",
            "community_name",
            "post_text",
            "image",
            "is_members_only",             
            "image_url",       
            "created_at",
            "like_count",
            "comments",
            "liked_by_user"
        ]
        read_only_fields = ["id", "user", "created_at", "comments"]

    def get_image_url(self, obj):
        if isinstance(obj, dict):
        # If obj is a dictionary
            image = obj.get('image', None)
        else:
            # If obj is a model instance
            image = getattr(obj, 'image', None)
        
        if image:
            storage = S3Boto3Storage()
            return storage.url(image.name)

        return ""
    
    def get_liked_by_user(self, obj):
        # If the user has liked the post return true to visually display this
        user = self.context.get("request").user
        if user and user.is_authenticated:
            return obj.post_likes.filter(user=user).exists()
        # Else return false
        return False
    
    def create(self, validated_data):
        # Extracts hashtags from a post, only get unique hashtags ignoring repeats
        def extract_hashtags(text):
            return set(re.findall(r"#(\w+)", text))
        
        validated_data.pop("user", None)
        user = self.context["request"].user

        # If a community is already in validated_data, use it
        if "community" in validated_data and validated_data["community"] is not None:
            post = Post.objects.create(user=user, **validated_data)
        else:
            # Otherwise, assign to Global Community
            try:
                global_community = Community.objects.get(community_name="Global Community (News Feed)")
                validated_data["community"] = global_community
            except Community.DoesNotExist:
                raise serializers.ValidationError("Global Community (News Feed) does not exist.")

            post = Post.objects.create(user=user, **validated_data)

        # Get the post's text
        text = validated_data.get("post_text", "")
        # Extract hashtags from the post
        hashtags = extract_hashtags(text)
        # For each hashtag create a relationship in hashtag table
        for tag in hashtags:
            # Use lowercase version of hashtag to force format of hashtag on backend
            # Create if not already in database
            hashtag_obj, created = Hashtag.objects.get_or_create(name=tag.lower())
            # Adds the hashtag to the many to many relationship on the post
            post.hashtags.add(hashtag_obj)

        return post
    
    
    def get_user_image(self, obj):
        """Ensure correct URL for user profile image (S3 or default)"""
        if isinstance(obj, dict):
            user = obj.get('user', None)  # Get user if dict passed
        else:
            user = obj.user  # Access directly if it's a model

        if user and user.profile_picture:
            storage = S3Boto3Storage()
            return storage.url(user.profile_picture.name)
        
        return ""

    def validate(self, data):
        post_text = data.get('post_text', '').strip()
        image = data.get('image')

        if not post_text and not image:
            raise serializers.ValidationError("Post must have text or an image.")

        return data
    
    def get_community_name(self, obj):
        if isinstance(obj, dict):
            community = obj.get('community', None)  # Access the community if it's a dict
        else:
            community = obj.community  # Directly access if it's a model
        
        return community.community_name if community else None

# Serializer for creating a following relationship
class FollowSerializer(serializers.ModelSerializer):
    follower = serializers.HiddenField(default=serializers.CurrentUserDefault())  # Set to logged-in user
    followed = serializers.IntegerField(write_only=True) # User ID of user to follow
    class Meta:
        model = Follow
        fields = ["id", "following_user", "followed_user", "followed_at"]

    def create(self, validated_data):
        # Get user
        request_user = self.context["request"].user
        # Get followed user
        followed_user = validated_data.pop("followed")

        # Check followed user exists in db and get
        try:
            followed_user = User.objects.get(id=followed_user)
        except User.DoesNotExist:
            raise serializers.ValidationError({"error": "User not found."})
        
        # If followed is same as request user
        if request_user == followed_user:
            raise serializers.ValidationError({"error": "You cannot follow yourself."})

        # Create or get if already created the following relationship
        follow, created = Follow.objects.get_or_create(follower=request_user, followed=followed_user)

        # If following relationship is not created return error
        if not created:
            raise serializers.ValidationError({"error": "You are already following this user."})

        return follow
    
# Used to return any users follower/following list (GET request)
class UserFollowerSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField()  # Return follower's ID
    first_name = serializers.CharField()  # Return followers first name
    last_name = serializers.CharField()  # Return followers last name
    profile_picture = serializers.SerializerMethodField() # Return followers profile picture
    is_following = serializers.SerializerMethodField()  # Checks if logged-in user is following

    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'profile_picture', 'is_following']

    def get_is_following(self, obj):
        request = self.context.get('request')
        # Return true if user is following, false if not
        if request.user:
            return Follow.objects.filter(following_user=request.user, followed_user=obj).exists()
        return False
    
    def get_profile_picture(self, obj):
        if obj.profile_picture and hasattr(obj.profile_picture, "name"):
            storage = S3Boto3Storage()
            url = storage.url(obj.profile_picture.name)
            if url.startswith("/"):
                return "https:" + url
            elif not url.startswith("http"):
                return "https://" + url
            return url
        return ""
    
class UserFollowingSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField()  # Return follower's ID
    first_name = serializers.CharField()  # Return followers first name
    last_name = serializers.CharField()  # Return followers last name
    profile_picture = serializers.SerializerMethodField() # Return followers profile picture
    is_following = serializers.SerializerMethodField()  # Checks if logged-in user is following

    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'profile_picture', 'is_following']

    def get_is_following(self, obj):
        request = self.context.get('request')
        if request.user:
            return Follow.objects.filter(following_user=request.user, followed_user=obj).exists()
        return False
    
    def get_profile_picture(self, obj):
        if obj.profile_picture and hasattr(obj.profile_picture, "name"):
            storage = S3Boto3Storage()
            url = storage.url(obj.profile_picture.name)
            if url.startswith("/"):
                return "https:" + url
            elif not url.startswith("http"):
                return "https://" + url
            return url
        return ""

User = get_user_model()

class CommunitySerializer(serializers.ModelSerializer):
    keywords = serializers.ListField(
        child=serializers.CharField(max_length=50),
        write_only=True,
        required=False,
        help_text="List of keyword strings to set for the community on create/update."
    )
    keyword_list = serializers.SerializerMethodField(read_only=True)
    is_community_owner = serializers.PrimaryKeyRelatedField(read_only=True)
    member_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = Community
        fields = [
            "id", "community_name", "description", "rules", "privacy",
            "keywords",       # write-only field for input
            "keyword_list",   # read-only field for output
            "is_community_owner", "member_count",
        ]

    def get_keyword_list(self, obj):
        """Return an array of keyword strings for output."""
        return [k.keyword for k in obj.keywords.all()]

    def create(self, validated_data):
        keywords_data = validated_data.pop("keywords", [])
        user = self.context["request"].user
        community = Community.objects.create(is_community_owner=user, **validated_data)
        UserCommunity.objects.create(user=user, community=community, role="Leader")

        # Create through table entries explicitly
        for kw_name in keywords_data:
            kw_name = kw_name.strip()
            if kw_name:
                keyword_obj, created = Keyword.objects.get_or_create(keyword=kw_name)
                # Use CommunityKeyword to create the link
                CommunityKeyword.objects.create(community=community, keyword=keyword_obj)
        return community

    def update(self, instance, validated_data):
        # Pop the keywords list if it was sent in the PATCH/PUT request
        keywords_data = validated_data.pop('keywords', None)

        # Update other simple fields first using default logic
        instance = super().update(instance, validated_data)

        # Handle keywords update only if data was provided
        if keywords_data is not None:
            # Clear existing keyword relationships for this community
            CommunityKeyword.objects.filter(community=instance).delete()

            # Create new relationships for the provided keywords
            for kw_name in keywords_data:
                kw_name = kw_name.strip()
                if kw_name:
                    # Find or create the Keyword object
                    keyword_obj, created = Keyword.objects.get_or_create(keyword=kw_name)
                    # Create the link in the through table
                    CommunityKeyword.objects.create(community=instance, keyword=keyword_obj)

        return instance
# For member relationships in UserCommunity table
class UserCommunitySerializer(serializers.ModelSerializer):
    community_id = serializers.IntegerField(source="community.id", read_only=True)
    community_name = serializers.ReadOnlyField(source="community.community_name")
    class Meta:
        model = UserCommunity
        fields = ['id', 'community_id', 'community_name', 'role']

# Used to return community list
class UserCommunityFollowerSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField()
    community_name = serializers.CharField()
    description = serializers.CharField()
    rules = serializers.CharField()
    privacy = serializers.CharField()
    keywords = serializers.SerializerMethodField()
    is_community_owner = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())

    class Meta:
        model = Community
        fields = ['id', 'community_name', 'description', 'rules', 'privacy', 'keywords', 'is_community_owner']

    def get_keywords(self, obj):
        return [keyword.keyword for keyword in obj.keywords.all()] if obj.keywords.exists() else []

# For approving/denying join requests
class UserRequestCommunitySerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    community = serializers.PrimaryKeyRelatedField(queryset=Community.objects.all())
    # Method field to store user's details for displaying on front-end
    user_details = serializers.SerializerMethodField()
    class Meta:
        model = UserRequestCommunity
        fields = ['id', 'user', 'community', 'requested_at', 'user_details']

    # Get user details to display
    def get_user_details(self, obj):
        user = User.objects.get(id=obj.user.id)  # Get user details
        if user:
            return {
                "id": user.id,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "profile_picture": self.get_profile_picture_url(user)
            }
        
        return None
    
    # Because profile picture can be null
    def get_profile_picture_url(self, user):
        if user.profile_picture:
            return user.profile_picture.url
        return None

class AnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = ["id", "title", "content", "created_at", "created_by", "community"]
        read_only_fields = ["id", "created_at", "created_by", "community"]

class AchievementSerializer(serializers.ModelSerializer):
    class Meta:
        # No user because auto assigned by perform_create
        model = Achievement
        fields = ['id', 'title', 'description', 'date_achieved']



class PinnedPostSerializer(serializers.ModelSerializer):
    post_text = serializers.CharField(source='post.post_text', read_only=True)
    user_name = serializers.CharField(source='post.user.first_name', read_only=True)
    user_last_name = serializers.CharField(source='post.user.last_name', read_only=True)
    user_image = serializers.SerializerMethodField()
    post_created_at = serializers.DateTimeField(source='post.created_at', read_only=True)  
    post_id = serializers.IntegerField(source='post.id', read_only=True)
    order = serializers.IntegerField(read_only=True)

    class Meta:
        model = PinnedPost
        fields = [
            'id', 'post_id', 'post_text', 'user_name', 'user_last_name', 
            'user_image', 'pinned_at', 'post_created_at', 'order'
        ]
        read_only_fields = ['id', 'pinned_at']
        
    def get_user_image(self, obj):
        """Ensure correct URL for user profile image (S3 or default)"""
        if obj.post.user.profile_picture:
            storage = S3Boto3Storage()
            return storage.url(obj.post.user.profile_picture.name)
        return ""

class EventSerializer(serializers.ModelSerializer):

    capacity = serializers.IntegerField(required=False, allow_null=True) # Add capacity field
    rsvp_accepted_count = serializers.SerializerMethodField(read_only=True)
    current_user_rsvp_status = serializers.SerializerMethodField(read_only=True)
    community_name = serializers.CharField(source='community.community_name', read_only=True)
    
    class Meta:
        model = Event
        # Add the new fields to the list
        fields = [
            'id', 'event_name', 'community', 'community_name', 'date', 'location',
            'description', 'event_type',
            'capacity', 'rsvp_accepted_count', 'current_user_rsvp_status'
        ]
        # Keep existing extra_kwargs if any
        
    def get_rsvp_accepted_count(self, obj):
        # Calculate count directly here
        return RSVP.objects.filter(event=obj, status='Accepted').count()

    def get_current_user_rsvp_status(self, obj):
        user = self.context.get('request').user
        if user and user.is_authenticated:
            try:
                rsvp = RSVP.objects.get(event=obj, user=user)
                return rsvp.status
            except RSVP.DoesNotExist:
                return None # No RSVP found for this user/event
        return None # User not authenticated
    
class RSVPSerializer(serializers.ModelSerializer):
    # User will be set from context, event from URL kwarg in view
    status = serializers.ChoiceField(choices=RSVP.RSVP_STATUS_CHOICES)

    class Meta:
        model = RSVP
        fields = ['id', 'user', 'event', 'status', 'rsvp_date']
        read_only_fields = ['id', 'user', 'event', 'rsvp_date'] # User/Event set by view

class UserRSVPDetailSerializer(serializers.ModelSerializer):
    # Nest the event details using the serializer above
    event = EventSerializer(read_only=True)
    class Meta:
        model = RSVP
        # Include the user's status and the nested event details
        fields = ['id', 'status', 'rsvp_date', 'event']

class UserSearchSerializer(serializers.ModelSerializer):
    university = UniversitySerializer(read_only=True)
    profile_picture_url = serializers.CharField(source='get_profile_picture_url', read_only=True)
    is_following = serializers.SerializerMethodField()
    interests_list = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'first_name', 'last_name', 'bio',
            'profile_picture_url', 'university', 'is_following', 'interests_list'
        ]
        read_only_fields = fields 

    def get_is_following(self, obj):
        request = self.context.get('request')
        return Follow.objects.filter(following_user=request.user, followed_user=obj).exists()
        
    def get_interests_list(self, obj):
        """Return a list of interest objects for the user"""
        user_interests = UserInterest.objects.filter(user=obj).select_related('interest')
        return [{'id': ui.interest.id, 'interest': ui.interest.interest} for ui in user_interests]

class InterestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interest
        fields = ['id', 'interest']
