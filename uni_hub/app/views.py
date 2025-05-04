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
from rest_framework import permissions, generics
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.utils import timezone
import requests
from django.urls import reverse
from rest_framework_simplejwt.tokens import AccessToken
from django.core.exceptions import ObjectDoesNotExist
from rest_framework.parsers import MultiPartParser, FormParser 
from django.core.files.base import ContentFile
import requests
from app.models import User
from django.http import JsonResponse
from django.core.files.base import ContentFile
from storages.backends.s3boto3 import S3Boto3Storage
from django.core.files.base import ContentFile
from django.db.models import Q
from .recommendations import *
from .email_templates import RSVPNotificationEmail
# Custom /auth/customjwt/create to store the refresh token as a cookie
# Using customized Djoser TokenObtainPairView
class CustomTokenObtainPairView(TokenObtainPairView):
    # Use custom serializer
    serializer_class = CustomTokenObtainPairSerializer  
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        # If credentials okay
        if response.status_code == 200:
            # Grab refresh token from response
            refresh = response.data.pop("refresh", None)
            
            
            # Storing in http cookie using simple jwt settings
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
    
            
# When getting new access/refresh tokens, refresh will store in http only cookie
# Using customized Djoser TokenRefreshView
class CustomTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        # Get refresh token from the HTTP only cookie
        refresh_token = request.COOKIES.get("refresh_token")

        # If no refresh token found, send 400
        if not refresh_token:
            return Response({"error": "No refresh token provided"}, status=status.HTTP_400_BAD_REQUEST)


        request.data["refresh"] = refresh_token

        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
           
            # Get current user from the token
            access_token = response.data.get("access")
            token_data = AccessToken(access_token)
            user_id = token_data.get("user_id")
            
            # Get fresh user data from the database
            user = User.objects.get(id=user_id)
            
            # Create new token with updated user data 
            # Neccesary to update user info incase of when updating profile
            serializer = CustomTokenObtainPairSerializer()
            token = serializer.get_token(user)
            
            # Update the access token in the response
            response.data["access"] = str(token.access_token)
            
            # Handle new refresh token
            new_refresh = str(token)
            response.data.pop("refresh", None)
            
            # Store new refresh token in HttpOnly cookie
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


# View for fetching user details for displaying on front-end
class GetProfileDetailsView(APIView):
    permission_classes = [IsAuthenticated] # Require login
    serializer_class = CustomUserSerializer
    # Only allow GET
    def get(self, request, *args, **kwargs):
        user_id = kwargs.get('id') # Passed user ID

        try:
            user = User.objects.get(id=user_id) # Get the user
            serializer = self.serializer_class(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except ObjectDoesNotExist: # If user not found
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        except ValueError:
            return Response({"error": "Invalid user ID format."}, status=status.HTTP_400_BAD_REQUEST)




# View for updating user first name, last name, bio, and interests
class UserProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated] # Required login
    parser_classes = (MultiPartParser, FormParser)  # Allow file uploads

    # PATCH to allow only partial edits of user data
    def patch(self, request, user_id):
        user = User.objects.filter(id=user_id).first()
        if not user:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        
        # If the user isn't the logged in user do not allow updating
        if user != request.user:
            return Response({"detail": "You do not have permission to update this profile."}, status=status.HTTP_403_FORBIDDEN)

        serializer = UserProfileUpdateSerializer(user, data=request.data, partial=True, context={"request": request})

        if serializer.is_valid():
            serializer.save()

            if 'profile_picture' in request.FILES:
                print("Profile Picture Successfully Uploaded to S3:", user.profile_picture)

            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserCommunityListView(generics.ListAPIView):
    serializer_class = UserCommunitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user_id = self.request.query_params.get("user_id")
        if not user_id:
            return UserCommunity.objects.none()  # Return empty queryset if no user_id is provided
        
        return UserCommunity.objects.filter(user_id=user_id)        


class KeywordSuggestionsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        query = request.query_params.get('query', '')
        if not query or len(query) < 2:
            return Response([], status=status.HTTP_200_OK)
        
        #Find keywords that start with or contain the query 
        keywords = Keyword.objects.filter(
            Q(keyword__istartswith=query) | Q(keyword__icontains=query)
        ).distinct().values_list('keyword', flat=True)[:10] #Limit 10 suggestions 
        
        return Response(list(keywords), status=status.HTTP_200_OK)

class UniversityListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        universities = University.objects.all().order_by('university_name')
        data = [{'id': u.id, 'name': u.university_name} for u in universities]
        return Response(data)

class ProfileBadgesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get user ID from parameters
        user_id = self.request.query_params.get("user_id")

        # Use passed user ID
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "Cannot get user's badges."}, status=404)
        
        # Return count of occurence for the user ID in each of these tables
        community_count = UserCommunity.objects.filter(user=user).count()
        following_count = Follow.objects.filter(following_user=user).count()
        followed_count = Follow.objects.filter(followed_user=user).count()
        post_count = Post.objects.filter(user=user).count()
        comment_count = Comment.objects.filter(user=user).count()
        achievement_count = Achievement.objects.filter(user=user).count()

        # Get respone stucture and colour to use for badge
        data = {
            "user_id": user_id,
            "communities_count": {
                "badge_level": self.get_badge_level(community_count),
                "badge_icon": "Users",
                "badge_title": self.get_badge_title("Community Member", community_count)
            },
            "posts_count": {
                "badge_level": self.get_badge_level(post_count),
                "badge_icon": "FileText",
                "badge_title": self.get_badge_title("Poster", post_count)
            },
            "following_count": {
                "badge_level": self.get_badge_level(following_count),
                "badge_icon": "UserPlus",
                "badge_title": self.get_badge_title("Follower", following_count)
            },
            "followed_count": {
                "badge_level": self.get_badge_level(followed_count),
                "badge_icon": "UserCheck",
                "badge_title": self.get_badge_title("Popularity", followed_count)
            },
            "achievements_count": {
                "badge_level": self.get_badge_level(achievement_count),
                "badge_icon": "Star",
                "badge_title": self.get_badge_title("Achiever", achievement_count)
            },
            "comments_count": {
                "badge_level": self.get_badge_level(comment_count),
                "badge_icon": "MessageCircle",
                "badge_title": self.get_badge_title("Commenter", comment_count)
            },
        }

        return Response(data)
    
    # Returns the colour to use for the badge
    def get_badge_level(self, count):
        # Return badge level based on count
        if count < 25:
            return "muted"
        elif 25 <= count <= 50:
            return "success"
        else:
            return "info"
        
    # Returns the title to display on the badge
    def get_badge_title(self, badge_title, count):
        # Return badge title
        
        # Append "Beginner", "Intermediate", or "Advanced" based on the count
        if count < 25:
            return "Beginner " + badge_title
        elif 25 <= count <= 50:
            return "Intermediate " + badge_title
        else:
            return "Advanced " + badge_title

# Gets all users within a community 
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_community_members(request):
    community_id = request.query_params.get("community_id")

    # If fetching from a community that doesnt exist throw an error
    if not community_id:
        return Response({"error": "Missing community_id"}, status=400)

    members = UserCommunity.objects.filter(
        community__id=community_id
    ).select_related("user")

    users = [
        {
            "id": uc.user.id,
            "first_name": uc.user.first_name,
            "last_name": uc.user.last_name,
            "profile_picture": uc.user.profile_picture.url if uc.user.profile_picture else None,
            "is_following": Follow.objects.filter(
                following_user=request.user, followed_user=uc.user
            ).exists(),
            "role": uc.role # Display users role for drop down list
        }
        for uc in members
    ]

    return Response(users)
    
class RecommendedCommunitiesView(generics.ListAPIView):
    """
    API endpoint to get community recommendations for the logged-in user
    based on keywords of communities they have already joined.
    """
    serializer_class = CommunitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        limit = int(self.request.query_params.get('limit', 5)) # Default to 5 recommendations
        # Call the specific recommendation logic
        # This function now returns a QuerySet, so ListAPIView handles it directly
        return get_community_recommendations_by_joined_keywords(user, limit=limit)

class RecommendedUsersView(APIView): # Changed from ListAPIView
    """
    API endpoint to get user recommendations based on mutuals and interests.
    Returns data in format: {"mutuals": [...], "interest_based": [...]}
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        limit = int(request.query_params.get('limit', 6)) # Combined limit
        mutual_limit = limit // 2 + (limit % 2) # Give slightly more to mutuals potentially
        interest_limit = limit // 2

        # Get mutual recommendations (returns QuerySet or list)
        mutual_recs_qs = get_user_recommendations_mutuals(user, limit=mutual_limit)

        # --- Get interest-based recommendations (Placeholder - implement this logic) ---
        # interest_recs_qs = get_user_recommendations_interest(user, limit=interest_limit, exclude_ids=set(mutual_recs_qs.values_list('id', flat=True))) # Example: Exclude mutuals
        interest_recs_qs = User.objects.none() # Replace with actual call when ready
        # --- End Placeholder ---


        # Serialize the results
        # Pass context to ensure is_following works correctly in serializer
        context = {'request': request}
        mutual_serializer = UserSearchSerializer(mutual_recs_qs, many=True, context=context)
        interest_serializer = UserSearchSerializer(interest_recs_qs, many=True, context=context)

        # Construct the response dictionary
        response_data = {
            "mutuals": mutual_serializer.data,
            "interest_based": interest_serializer.data
        }

        return Response(response_data)
class RSVPUpdateView(generics.GenericAPIView):
    """
    Allows authenticated community members to create or update their RSVP
    for a specific event. Checks event capacity on 'Accepted' status.
    """
    serializer_class = RSVPSerializer
    permission_classes = [permissions.IsAuthenticated, IsCommunityMemberForEvent]
    queryset = Event.objects.all() # Needed for get_object/permission check
    lookup_url_kwarg = 'event_pk' # Specify the URL keyword for the event ID

    # Define get_object to fetch the Event for permission checks
    def get_object(self):
        queryset = self.get_queryset()
        event_pk = self.kwargs.get(self.lookup_url_kwarg)
        obj = get_object_or_404(queryset, pk=event_pk)
        self.check_object_permissions(self.request, obj) # Manually check object perms
        return obj

    def post(self, request, *args, **kwargs):
        event = self.get_object() # Fetch event and run object permissions
        user = request.user
        status_to_set = request.data.get('status')

        # Validate status choice
        if status_to_set not in dict(RSVP.RSVP_STATUS_CHOICES):
            return Response({'detail': 'Invalid RSVP status provided.'}, status=status.HTTP_400_BAD_REQUEST)

        # --- Capacity Check ---
        if status_to_set == 'Accepted' and event.capacity is not None:
            accepted_count = RSVP.objects.filter(event=event, status='Accepted').count()
            existing_rsvp = RSVP.objects.filter(user=user, event=event).first()
            is_currently_accepted = existing_rsvp and existing_rsvp.status == 'Accepted'

            # Block only if full AND user isn't already accepted
            if accepted_count >= event.capacity and not is_currently_accepted:
                 return Response({'detail': 'Event has reached maximum capacity.'}, status=status.HTTP_400_BAD_REQUEST)
        # --- End Capacity Check ---

        # Create or update the RSVP entry
        rsvp, created = RSVP.objects.update_or_create(
            user=user,
            event=event,
            defaults={'status': status_to_set}
        )

        RSVPNotificationEmail.send_notification(
            event=event,
            user=user,
            rsvp_status=status_to_set
        )
        serializer = self.get_serializer(rsvp) # Serialize the created/updated RSVP
        resp_status = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(serializer.data, status=resp_status)