from django.shortcuts import render
from rest_framework.permissions import IsAuthenticated, AllowAny
from .permissions import *
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from .models import *
from .serializers import *
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.views import APIView
from rest_framework import status
from django.conf import settings
from django.utils import timezone
import requests
from django.urls import reverse

#Custom /auth/customjwt/create to store the refresh token as a cookie
class CustomTokenObtainPairView(TokenObtainPairView):
    #Use custom serializer
    serializer_class = CustomTokenObtainPairSerializer  
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        #If credentials okay
        if response.status_code == 200:
            #Grab refresh token from response
            refresh = response.data.pop("refresh", None)
            
            
            #Storing in http cookie using simple jwt settings
            response.set_cookie(
                key="refresh_token",
                value=refresh,
                httponly=True,
                secure=settings.SIMPLE_JWT.get("AUTH_COOKIE_SECURE", False),
                samesite=settings.SIMPLE_JWT.get("AUTH_COOKIE_SAMESITE", "Lax"),
                path=settings.SIMPLE_JWT.get("AUTH_COOKIE_PATH", "/"),  
                expires= timezone.now() + settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME']
            )

        return response
    

#When getting new access/refresh tokens, refresh will store in http only cookie
class CustomTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get("refresh_token")

        #If no refresh token found, send 400
        if not refresh_token:
            return Response({"error": "No refresh token provided"}, status=status.HTTP_400_BAD_REQUEST)

        request.data["refresh"] = refresh_token

        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            #Remove existing refresh from response
            new_refresh = response.data.pop("refresh", None)  


            #Store new refresh token in HttpOnly cookie
            response.set_cookie(
                key="refresh_token",
                value=new_refresh,
                httponly=True,
                secure=settings.SIMPLE_JWT.get("AUTH_COOKIE_SECURE", False),
                samesite=settings.SIMPLE_JWT.get("AUTH_COOKIE_SAMESITE", "Lax"),
                path=settings.SIMPLE_JWT.get("AUTH_COOKIE_PATH", "/"),  
                expires= timezone.now() + settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME']
            )

        return response

#View for updating user first name, last name, bio, and interests
class UserProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    #Get user details based on user_id
    def get_user(self, user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None

    def patch(self, request, user_id):
        #PATCH request to update user
        #Get user using get_object above
        user = self.get_user(user_id)

        if user != request.user:  #Only allow if logged in user is the one updating
            return Response({"detail": "You do not have permission to update this profile."}, status=status.HTTP_403_FORBIDDEN)
        
        #Init serializer with user detail and PATCH request data
        #Partial = True is for PATCH request
        serializer = UserProfileUpdateSerializer(user, data=request.data, partial=True)

        #If data is valid make the change otherwise return error
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])  #Allowed http methods
@permission_classes([IsAuthenticated])  #Require login
def protected_view(request):
    if request.method == 'GET':
        return Response(
            {
                "message": "You have accessed a protected view!",
                "user": {
                    "username": request.user.username,
                    "email": request.user.email
                }
            },
            status=200
        )
    elif request.method == 'POST':
        return Response({"message": "POST request successful!"}, status=200)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsEventManager])
def event_view(request):
    if request.method == 'GET':
        return Response(
            {
                "message": "You have accessed an event manager view!",
                "user": {
                    "username": request.user.username,
                    "email": request.user.email
                }
            },
            status=200
        )
    elif request.method == 'POST':
        return Response({"message": "POST request successful, event manager!"}, status=200)