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
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework import permissions

from django.conf import settings
from django.utils import timezone
import requests
from django.urls import reverse
from rest_framework_simplejwt.tokens import AccessToken
from django.core.exceptions import ObjectDoesNotExist


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
    

class CommunityViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing communities.
    When a community is created via CommunitySerializer, the creator is automatically assigned as its leader.
    """
    queryset = Community.objects.all()
    serializer_class = CommunitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_context(self):
        # Pass the request to the serializer to access request.user in create()
        return {"request": self.request}

    @action(detail=True, methods=['post'], permission_classes=[IsCommunityLeader])
    def assign_role(self, request, pk=None):
        """
        Custom action to assign a new role to a community member.
        Expects JSON with "userId" and "newRole".
        Only accessible by the community leader.
        """
        community = self.get_object()
        user_id = request.data.get("userId")
        new_role = request.data.get("newRole")
        if not user_id or not new_role:
            return Response({"error": "userId and newRole are required."},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            user_community = UserCommunity.objects.get(user_id=user_id, community=community)
            user_community.role = new_role
            user_community.save()
            return Response({"detail": "Role updated successfully."}, status=status.HTTP_200_OK)
        except UserCommunity.DoesNotExist:
            return Response({"error": "User is not a member of this community."},
                            status=status.HTTP_400_BAD_REQUEST)
            
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
           
            #Get current user from the token
            access_token = response.data.get("access")
            token_data = AccessToken(access_token)
            user_id = token_data.get("user_id")
            
            #Get fresh user data from the database
            user = User.objects.get(id=user_id)
            
            #Create new token with updated user data 
            #Neccesary to update user info incase of when updating profile
            serializer = CustomTokenObtainPairSerializer()
            token = serializer.get_token(user)
            
            #Update the access token in the response
            response.data["access"] = str(token.access_token)
            
            #Handle refresh token
            new_refresh = str(token)
            response.data.pop("refresh", None)
            
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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    response = Response({"message": "Logged out successfully."}, status=status.HTTP_200_OK)
    response.delete_cookie("refresh_token")
    return response


#View for fetching user details
class GetProfileDetailsView(APIView):
    permission_classes = [IsAuthenticated] 
    serializer_class = CustomUserSerializer
    #Only allow GET
    def get(self, request, *args, **kwargs):
        user_id = kwargs.get('id')

        try:
            user = User.objects.get(id=user_id)
            serializer = self.serializer_class(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except ObjectDoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        except ValueError:
            return Response({"error": "Invalid user ID format."}, status=status.HTTP_400_BAD_REQUEST)



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


@api_view(['GET'])
def user_communities_list(request):
    user_id = request.GET.get('user_id')
    if not user_id:
        return Response({"error": "Missing user_id"}, status=status.HTTP_400_BAD_REQUEST)

    user_communities = UserCommunity.objects.filter(user_id=user_id).select_related('community')
    serializer = UserCommunitySerializer(user_communities, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)    