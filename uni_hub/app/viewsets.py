from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .permissions import *
from .models import *
from .serializers import *

#View set for following
class FollowViewSet(viewsets.ModelViewSet):
    #All rows
    queryset = Follow.objects.all()
    #Use follow serializer
    serializer_class = FollowSerializer
    #Required logged in user
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        #If a user ID is passed filter by that ID otherwise use logged in user id
        user_id = self.request.query_params.get("user_id")

        if user_id:
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Follow.objects.none()  #If user doesn't exist return no results
        else:
            user = self.request.user  #Use logged in user ID

        return Follow.objects.filter(following_user=user)  #Get users following
    
    @action(detail=False, methods=["POST"])
    def follow(self, request):
        #ID to follow
        user_id = request.data.get("user_id")

        #If user ID not provided
        if not user_id:
            return Response({"error": "User ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        #Ensure the user is not trying to follow themselves
        if int(user_id) == request.user.id:
            return Response({"error": "You cannot follow yourself."}, status=status.HTTP_400_BAD_REQUEST)

        #Get user to follow details
        try:
            followed_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        #Check if already following
        if Follow.objects.filter(following_user=request.user, followed_user=followed_user).exists():
            return Response({"error": "You are already following this user."}, status=status.HTTP_400_BAD_REQUEST)

        #Create the follow row in db
        Follow.objects.create(following_user=request.user, followed_user=followed_user)

        return Response({"success": "Followed successfully."}, status=status.HTTP_201_CREATED)

    #To unfollow a user
    @action(detail=False, methods=["DELETE"])
    def unfollow(self, request):
        #User ID to unfolow
        user_id = request.query_params.get("user_id")

        #If user not passed
        if not user_id:
            return Response({"error": "User ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        #Get user to unfollow
        try:
            followed_user = User.objects.get(id=user_id)
        #If user ID not in database
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        #Get follow row to delete
        follow = Follow.objects.filter(following_user=request.user, followed_user=followed_user).first()
        #If exists detete
        if follow:
            follow.delete()
            return Response({"success": "Unfollowed successfully."}, status=status.HTTP_204_NO_CONTENT)
        
        #Else return error
        return Response({"error": "You are not following this user."}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["GET"])
    def followers(self, request):
        #Get passed user ID if applicable to allow fetching of any users followers
        user_id = request.query_params.get("user_id")

        if user_id:  
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        else:
            user = request.user  #Use logged in user
        
        #Get list of followers
        followers = Follow.objects.filter(followed_user=user).select_related("following_user")
        #Get list of follows in json as the response
        #Using separate serializer that wont user logged in user ID
        follower_data = UserFollowerSerializer([f.following_user for f in followers], many=True)

        return Response(follower_data.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=["GET"])
    def following(self, request):
        #Get passed user ID if applicable to allow fetching of any users followers
        user_id = request.query_params.get("user_id")

        if user_id:  
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        else:
            user = request.user  #Use logged in user
        
        #Get list of following
        following = Follow.objects.filter(following_user=user).select_related("following_user")
        #Get list of follows
        following_users = [f.following_user for f in following]
        #Using separate serializer that wont user logged in user ID
        following_data = UserFollowerSerializer(following_users, many=True)

        return Response(following_data.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=["GET"])
    def check_following(self, request):
        user_id = request.query_params.get("user_id")

        if not user_id:
            return Response({"error": "User ID is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        #If viewing own profile return true
        if int(user_id) == request.user.id:
            return Response({"is_following": True}, status=status.HTTP_200_OK)

        try:
            followed_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        #Check logged-in user follows viewed user
        is_following = Follow.objects.filter(following_user=request.user, followed_user=followed_user).exists()

        return Response({"is_following": is_following}, status=status.HTTP_200_OK)