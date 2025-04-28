from rest_framework import serializers
from djoser.serializers import UserCreateSerializer, UserSerializer
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import *
from .models import Community, Keyword, UserCommunity
from django.contrib.auth import get_user_model
from datetime import date

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
    user_name = serializers.CharField(source='user.first_name', read_only=True)
    user_last_name = serializers.CharField(source='user.last_name', read_only=True)
    user_image = serializers.SerializerMethodField() 

    class Meta:
        model = Comment
        fields = ["id", "user", "user_name", "user_last_name", "user_image", "comment_text", "created_at"]

    def get_user_image(self, obj):
        """Ensure correct URL for user profile image (S3 or default)"""
        if obj.user.profile_picture:
            storage = S3Boto3Storage()
            return storage.url(obj.user.profile_picture.name)
        return "https://via.placeholder.com/150"


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

    class Meta:
        model = User
        fields = [
            "id", "email", "first_name", "last_name",
            "bio", "interests", "role", "profile_picture",
            "profile_picture_url", "university"
        ]

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
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'bio', 'profile_picture', 'interests']

    def update(self, instance, validated_data):
        request = self.context.get('request')

        if 'profile_picture' in request.FILES:
            image = request.FILES['profile_picture']
            storage = S3Boto3Storage()
            file_path = f"profile_pics/{instance.id}/{image.name}"  
            saved_path = storage.save(file_path, image)  
            instance.profile_picture = saved_path  
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.bio = validated_data.get('bio', instance.bio)
        instance.interests = validated_data.get('interests', instance.interests)
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
    comments = serializers.SerializerMethodField()  # Fetch latest 5 comments for each post

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
            "image_url",       
            "created_at",
            "like_count",
            "comments",
        ]
        read_only_fields = ["id", "user", "created_at", "comments"]
    def get_image_url(self, obj):
        if obj.image:
            storage = S3Boto3Storage()
            return storage.url(obj.image.name)
        return None
    def get_comments(self, obj):
        """Fetch the latest 5 comments for each post."""
        latest_comments = obj.comments.order_by("-created_at")[:5]  
        return CommentSerializer(latest_comments, many=True).data  

    def create(self, validated_data):
        validated_data.pop("user", None)
        user = self.context["request"].user

        # If a community is already in validated_data, use it
        if "community" in validated_data and validated_data["community"] is not None:
            post = Post.objects.create(user=user, **validated_data)
            return post

        # Otherwise, assign to Global Community
        try:
            global_community = Community.objects.get(community_name="Global Community (News Feed)")
            validated_data["community"] = global_community
        except Community.DoesNotExist:
            raise serializers.ValidationError("Global Community (News Feed) does not exist.")

        post = Post.objects.create(user=user, **validated_data)
        return post
    def get_user_image(self, obj):
        """Ensure correct URL for user profile image (S3 or default)"""
        if obj.user.profile_picture:
            storage = S3Boto3Storage()
            return storage.url(obj.user.profile_picture.name)
        return "https://via.placeholder.com/150"

    def validate(self, data):
        post_text = data.get('post_text', '').strip()
        image = data.get('image')

        if not post_text and not image:
            raise serializers.ValidationError("Post must have text or an image.")

        return data
    
    def get_community_name(self, obj):
        return obj.community.community_name if obj.community else None

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
    # For input: Accept a list of strings
    # For output: Provide a read-only array of strings
    keywords = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False
    )
    # Add a separate read-only field for output
    keyword_list = serializers.SerializerMethodField(read_only=True)

    # Return the user ID of the leader
    is_community_owner = serializers.PrimaryKeyRelatedField(
        read_only=True
    )
    
    member_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = Community
        fields = [
            "id",
            "community_name",
            "description",
            "rules",
            "privacy",
            "keywords",       # used for input
            "keyword_list",   # used for output
            "is_community_owner",  # the leader's user ID
            "member_count", 
        ]

    def create(self, validated_data):
        keywords_data = validated_data.pop("keywords", [])
        user = self.context["request"].user

        # Create the community
        community = Community.objects.create(
            is_community_owner=user,
            **validated_data
        )

        # Also create the user->community relationship
        UserCommunity.objects.create(
            user=user,
            community=community,
            role="Leader"
        )

        # Now handle the incoming keywords
        for kw in keywords_data:
            kw = kw.strip()
            if kw:
                keyword_obj, created = Keyword.objects.get_or_create(keyword=kw)
                community.keywords.add(keyword_obj)

        return community

    def get_keyword_list(self, obj):
        """Return an array of keyword strings for output."""
        return [k.keyword for k in obj.keywords.all()]

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
    post_created_at = serializers.DateField(source='post.created_at', read_only=True)  
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
        return "https://via.placeholder.com/150"

class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = '__all__'

    def validate(self, data):
        
        return data


class UserSearchSerializer(serializers.ModelSerializer):
    university = UniversitySerializer(read_only=True)
    profile_picture_url = serializers.CharField(source='get_profile_picture_url', read_only=True)
    is_following = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'first_name', 'last_name', 'bio',
            'profile_picture_url', 'university', 'is_following'
        ]
        read_only_fields = fields 

    def get_is_following(self, obj):
        request = self.context.get('request')
        return Follow.objects.filter(following_user=request.user, followed_user=obj).exists()