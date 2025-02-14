from django.utils.timesince import timesince
from rest_framework import serializers
from djoser.serializers import UserCreateSerializer
from django.contrib.auth import get_user_model
from .models import *

User = get_user_model()

class UserAuthSerializer(UserCreateSerializer):
    class Meta(UserCreateSerializer.Meta):
        model = User
        fields = ['id','username','email','password']
        extra_kwargs = {'password': {'write_only':True}}
    
    def perform_create(self, validated_data):
        user = User.objects.create_user(**validated_data)

        return user