from rest_framework import serializers
from djoser.serializers import UserCreateSerializer, UserSerializer
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import *
from .models import Community, Keyword, UserCommunity
from django.contrib.auth import get_user_model

class UniversitySerializer(serializers.ModelSerializer):
    class Meta:
        model = University
        fields = "__all__"

class CustomUserCreateSerializer(UserCreateSerializer):
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    university = UniversitySerializer(read_only=True)
    class Meta(UserCreateSerializer.Meta):
        model = User
        fields = ['id', 'email', 'password', 'first_name', 'last_name', 'university']
        extra_kwargs = {'password': {'write_only':True}}
    
    def create(self, validated_data):
        email = validated_data.get("email","")
        email_domain = email.split("@")[-1]

        university = University.objects.filter(university_domain=email_domain).first()

        #If no university found
        if not university:
            raise serializers.ValidationError({"email": "No university found for this email domain, is this a valid university email?"})
        
        validated_data["university"] = university

        user = User.objects.create_user(**validated_data)
        return user

class CommentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.first_name", read_only=True)
    user_last_name = serializers.CharField(source="user.last_name", read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "user", "user_name", "user_last_name", "post", "comment_text", "created_at"]
        read_only_fields = ["id", "user", "created_at"]

#Add custom claims to the token
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def get_token(self, user):
        token = super().get_token(user)

        token["id"] = user.id
        token["email"] = user.email
        token["role"] = user.role
        token["first_name"] = user.first_name
        token["last_name"] = user.last_name

        return token


class CustomUserSerializer(UserSerializer):
    university = UniversitySerializer()

    class Meta(UserSerializer.Meta):
        model = User
        fields = ["id", "email", "first_name", "last_name", "bio", "interests", "role", "profile_picture", "university"]

#For updating bio, interests and profile picture
class UserProfileUpdateSerializer(UserSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'bio', 'profile_picture', 'interests']

    def update(self, instance, validated_data):
        #Update the user with the input data
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.bio = validated_data.get('bio', instance.bio)
        instance.profile_picture = validated_data.get('profile_picture', instance.profile_picture)
        instance.interests = validated_data.get('interests', instance.interests)
        instance.save()
        return instance


#Serilizer for global posts

from rest_framework import serializers
from app.models import Post, Comment, Community
from app.serializers import CommentSerializer

class PostSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.first_name", read_only=True)
    user_last_name = serializers.CharField(source="user.last_name", read_only=True)
    user_image = serializers.ImageField(source="user.profile_picture", read_only=True)
    community = serializers.PrimaryKeyRelatedField(
        queryset=Community.objects.all(),
        required=False,
        allow_null=True
    )
    comments = serializers.SerializerMethodField()  # ✅ Fetch latest 5 comments for each post

    class Meta:
        model = Post
        fields = [
            "id",
            "user",
            "user_name",
            "user_last_name",
            "user_image",
            "community",
            "post_text",
            "created_at",
            "likes",
            "comments",  # ✅ Include comments in the response
        ]
        read_only_fields = ["id", "created_at", "user", "likes"]

    def get_comments(self, obj):
        """Fetch the latest 5 comments for each post."""
        latest_comments = obj.comments.order_by("-created_at")[:5]  # ✅ Use "comments" instead of "comment_set"
        return CommentSerializer(latest_comments, many=True).data  # ✅ Serialize comments properly

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











#Serilizer for following
class FollowSerializer(serializers.ModelSerializer):
    follower = serializers.HiddenField(default=serializers.CurrentUserDefault())  #Set to logged-in user
    followed = serializers.IntegerField(write_only=True) #User ID of followed user
    class Meta:
        model = Follow
        fields = ["id", "following_user", "followed_user", "followed_at"]

    #When POST request on the viewset
    def create(self, validated_data):
        #Get user
        request_user = self.context["request"].user
        #Get followed user
        followed_user = validated_data.pop("followed")

        #Check followed user exists in db and get
        try:
            followed_user = User.objects.get(id=followed_user)
        except User.DoesNotExist:
            raise serializers.ValidationError({"error": "User not found."})
        
        #If followed is same as request user
        if request_user == followed_user:
            raise serializers.ValidationError({"error": "You cannot follow yourself."})

        #Create or get if already created the following relationship
        follow, created = Follow.objects.get_or_create(follower=request_user, followed=followed_user)
        #If following relationship is not created return error
        if not created:
            raise serializers.ValidationError({"error": "You are already following this user."})

        return follow
    
#Used to return any users follower list (GET request)
class UserFollowerSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField()  #Return follower's ID
    username = serializers.CharField()  #Return followers username

    class Meta:
        model = User
        fields = ['id', 'username']

    
# serializers.py

User = get_user_model()
class CommunitySerializer(serializers.ModelSerializer):
    # For input: We'll accept a list of strings
    # For output: We'll provide a read-only array of strings
    keywords = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False
    )
    # We'll add a separate read-only field for output
    keyword_list = serializers.SerializerMethodField(read_only=True)

    # NEW: Return the user ID of the leader
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


class UserCommunitySerializer(serializers.ModelSerializer):
    community_name = serializers.ReadOnlyField(source='community.community_name')
    class Meta:
        model = UserCommunity
        fields = ['id', 'community_name', 'role', 'community', 'community_id']

#Used to return community list (GET request)
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

class AnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = ["id", "title", "content", "created_at", "created_by", "community"]
        read_only_fields = ["id", "created_at", "created_by", "community"]        


