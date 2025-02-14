from rest_framework import serializers
from djoser.serializers import UserCreateSerializer, UserSerializer
from .models import *


class UniversitySerializer(serializers.ModelSerializer):
    class Meta:
        model = University
        fields = "__all__"

class CustomUserCreateSerializer(UserCreateSerializer):
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    bio = serializers.CharField(required=False, allow_blank=True)
    interests = serializers.CharField(required=False, allow_blank=True)
    profile_picture = serializers.ImageField(required=False)
    university = UniversitySerializer(read_only=True)
    class Meta(UserCreateSerializer.Meta):
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name', 'bio', 'interests', 'profile_picture', 'university']
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
    
class CustomUserSerializer(UserSerializer):
    university = UniversitySerializer()

    class Meta(UserSerializer.Meta):
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "bio", "interests", "role", "profile_picture", "university"]
