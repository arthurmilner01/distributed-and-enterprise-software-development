from rest_framework import serializers
from djoser.serializers import UserCreateSerializer, UserSerializer
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import *


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

#Serilizer for following
class FollowSerializer(serializers.ModelSerializer):
    follower = serializers.HiddenField(default=serializers.CurrentUserDefault())  #Set to logged in user unless otherwise specified
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

    

