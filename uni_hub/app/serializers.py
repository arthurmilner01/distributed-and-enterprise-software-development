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
        token["bio"] = user.bio
        token["interests"] = user.interests
        token["profile_pic"] = user.profile_picture if user.profile_picture else None

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
