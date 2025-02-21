from django.shortcuts import render
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from .models import *
from .serializers import *
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.conf import settings

#Custom /auth/customjwt/create to store the refresh token as a cookie
class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        #If credentials okay
        if response.status_code == 200:
            #Grab refresh token from response
            refresh = response.data.pop("refresh", None)
            #Access token added to response
            access = response.data["access"]

            #Storing in http cookie using simple jwt settings
            response.set_cookie(
                key="refresh_token",
                value=refresh,
                httponly=True,
                secure=settings.SIMPLE_JWT.get("AUTH_COOKIE_SECURE", True),
                samesite=settings.SIMPLE_JWT.get("AUTH_COOKIE_SAMESITE", "Lax"),
                path=settings.SIMPLE_JWT.get("AUTH_COOKIE_PATH", "/"),  
            )

        return response
    
#Custom token refresh which gets new access token and replaces refresh token with old token
class CustomTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            #Get the newly generated refresh token
            refresh = response.data.pop("refresh", None)
            #Access token added to response
            access = response.data["access"]

            #Storing in http cookie using simple jwt settings
            response.set_cookie(
                key="refresh_token",
                value=refresh,
                httponly=True,
                secure=settings.SIMPLE_JWT.get("AUTH_COOKIE_SECURE", True),
                samesite=settings.SIMPLE_JWT.get("AUTH_COOKIE_SAMESITE", "Lax"),
                path=settings.SIMPLE_JWT.get("AUTH_COOKIE_PATH", "/"),  
            )
        
        return response


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