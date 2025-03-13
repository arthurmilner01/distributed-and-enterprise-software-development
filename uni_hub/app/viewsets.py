from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .permissions import *
from .models import *
from .serializers import *
from django.db.models import Q, Count


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
    

#View set for joining/leaving communities
class CommunityFollowViewSet(viewsets.ModelViewSet):
    #All rows
    queryset = UserCommunity.objects.all()
    #Use follow serializer
    serializer_class = UserCommunitySerializer
    #Required logged in user
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        #Use logged in user
        user = self.request.user  #Use logged in user ID

        return UserCommunity.objects.filter(user=user)  #Get joined communities
    
    @action(detail=False, methods=["POST"])
    def follow(self, request):
        #ID to follow
        community_id = request.data.get("community_id")

        #If user ID not provided
        if not community_id:
            return Response({"error": "Community ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        #Get user to follow details
        try:
            followed_community = Community.objects.get(id=community_id)
        except Community.DoesNotExist:
            return Response({"error": "Community not found."}, status=status.HTTP_404_NOT_FOUND)

        #Check if already following
        if UserCommunity.objects.filter(user=request.user, community=followed_community).exists():
            return Response({"error": "You are already a member of this community."}, status=status.HTTP_400_BAD_REQUEST)
        
        #Check if community is private
        if followed_community.privacy == "private":
            return Response({"error": "This community is private. You need to request to join."}, status=status.HTTP_403_FORBIDDEN)

        #Create the follow row in db
        try:
            UserCommunity.objects.create(user=request.user, community=followed_community)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"success": "Joined community successfully."}, status=status.HTTP_201_CREATED)

    #To unfollow a community
    @action(detail=False, methods=["DELETE"])
    def unfollow(self, request):
        #User ID to unfolow
        community_id = request.query_params.get("community_id")

        #If user not passed
        if not community_id:
            return Response({"error": "Community ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        #Get user to unfollow
        try:
            unfollowed_community = Community.objects.get(id=community_id)
        #If user ID not in database
        except Community.DoesNotExist:
            return Response({"error": "Community not found."}, status=status.HTTP_404_NOT_FOUND)

        #Get follow row to delete
        unfollow = UserCommunity.objects.filter(user=request.user, community=unfollowed_community).first()
        #If exists detete
        if unfollow:
            unfollow.delete()
            return Response({"success": "Successfully left the community."}, status=status.HTTP_204_NO_CONTENT)
        
        #Else return error
        return Response({"error": "You are not a member of this community."}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=["POST"])
    def request_follow(self, request):
        community_id = request.data.get("community_id")

        if not community_id:
            return Response({"error": "Community ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Get community details
        try:
            community = Community.objects.get(id=community_id)
        except Community.DoesNotExist:
            return Response({"error": "Community not found."}, status=status.HTTP_404_NOT_FOUND)

        # Check privacy
        if community.privacy != "private":
            return Response({"error": "This community is not private. You can join directly."}, status=status.HTTP_400_BAD_REQUEST)

        # Check if the user has already requested to join this community
        if UserRequestCommunity.objects.filter(user=request.user, community=community).exists():
            return Response({"error": "You have already requested to join this community."}, status=status.HTTP_400_BAD_REQUEST)

        # Create the request to join community
        try:
            user_request = UserRequestCommunity.objects.create(user=request.user, community=community)
            return Response({"success": "Request to join community sent."}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    #To unfollow a community
    @action(detail=False, methods=["DELETE"])
    def cancel_follow_request(self, request):
        #Community ID to unfolow
        community_id = request.query_params.get("community_id")

        #If user not passed
        if not community_id:
            return Response({"error": "Community ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        #Get community to unfollow
        try:
            unfollowed_community = Community.objects.get(id=community_id)
        #If community ID not in database
        except Community.DoesNotExist:
            return Response({"error": "Community not found."}, status=status.HTTP_404_NOT_FOUND)

        #Get row to delete
        unfollow = UserRequestCommunity.objects.filter(user=request.user, community=unfollowed_community).first()
        #If exists detete
        if unfollow:
            unfollow.delete()
            return Response({"success": "Successfully cancelled the follow request."}, status=status.HTTP_204_NO_CONTENT)
        
        #Else return error
        return Response({"error": "You are not a member of this community."}, status=status.HTTP_400_BAD_REQUEST)
        

    @action(detail=False, methods=["GET"])
    def followers(self, request):
        user = request.user  #Use logged in user
        
        #Get list of followed communities
        followed_communities = UserCommunity.objects.filter(user=user).select_related("community")
        #Get list of follows in json as the response
        community_data = UserCommunityFollowerSerializer([f.community for f in followed_communities], many=True)

        return Response(community_data.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=["GET"])
    def follow_requests(self, request):
        user = request.user  #Use logged in user
        
        #Get list of followed communities
        requested_communities = UserRequestCommunity.objects.filter(user=user).select_related("community")
        #Get list of follows in json as the response
        community_data = UserCommunityFollowerSerializer([f.community for f in requested_communities], many=True)

        return Response(community_data.data, status=status.HTTP_200_OK)

    
    @action(detail=False, methods=["GET"])
    def check_following(self, request):
        community_id = request.query_params.get("community_id")

        if not community_id:
            return Response({"error": "Community ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            followed_community = Community.objects.get(id=community_id)
        except Community.DoesNotExist:
            return Response({"error": "Community not found."}, status=status.HTTP_404_NOT_FOUND)

        #Check logged-in user follows viewed community
        is_following = UserCommunity.objects.filter(user=request.user, community=followed_community).exists()

        return Response({"is_following": is_following}, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=["GET"])
    def communities_all(self, request):
        #Fetch all available communities
        communities = Community.objects.all()
        serializer = UserCommunityFollowerSerializer(communities, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)
    
    #For filtering only to communities user has not request/joined
    @action(detail=False, methods=["GET"])
    def relevant_communities(self, request):
        user = request.user  # Get the logged-in user

        # Get list of communities the user is already following
        followed_communities = UserCommunity.objects.filter(user=user).values_list('community', flat=True)

        # Get list of communities the user has requested to join
        requested_communities = UserRequestCommunity.objects.filter(user=user).values_list('community', flat=True)

        # Get all communities excluding those the user is following or has requested to join
        relevant_communities = Community.objects.exclude(id__in=followed_communities).exclude(id__in=requested_communities)

        # Filter by only communities with an owner
        relevant_communities = relevant_communities.filter(is_community_owner__isnull=False)

        # Serialize the data and return it
        serializer = UserCommunityFollowerSerializer(relevant_communities, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        community_id = self.request.query_params.get('community_id')
        if community_id:
            qs = qs.filter(community_id=community_id)
        return qs

    def perform_create(self, serializer):
        community_id = self.request.data.get('community_id')
        if not community_id:
            raise serializers.ValidationError({"community_id": "This field is required."})
        # Get community and check leadership if needed...
        serializer.save(created_by=self.request.user, community_id=community_id)


class CommunityViewSet(viewsets.ModelViewSet):
    serializer_class = CommunitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Customize the queryset based on query parameters.
        This handles filtering and ordering.
        """
        queryset = Community.objects.all()
        
        queryset = queryset.annotate(member_count=Count('user_communities'))
        
        search_query = self.request.query_params.get('search', None)
        keywords = self.request.query_params.get('keywords', None)
        privacy = self.request.query_params.get('privacy', None)
        ordering = self.request.query_params.get('ordering', '-id')
        
        #Search text (looks in name and description)
        if search_query:
            queryset = queryset.filter(
                Q(community_name__icontains=search_query) | 
                Q(description__icontains=search_query)
            )
        
        #Keywords filter
        if keywords:
            keyword_list = [k.strip() for k in keywords.split(',') if k.strip()]
            if keyword_list:
                #Filter communities that have ALL of the specified keywords
                for keyword in keyword_list:
                    queryset = queryset.filter(keywords__keyword=keyword)
                queryset = queryset.distinct()
        
        #Privacy
        if privacy and privacy != 'all':
            queryset = queryset.filter(privacy=privacy)
        
        #Sort ordering
        if ordering == 'community_name':
            queryset = queryset.order_by('community_name')
        elif ordering == '-community_name':
            queryset = queryset.order_by('-community_name')
        elif ordering == 'member_count':
            queryset = queryset.order_by('member_count')
        elif ordering == '-member_count':
            queryset = queryset.order_by('-member_count')
        else:
            queryset = queryset.order_by('-id' if ordering == '-id' else 'id')
        
        return queryset

    def get_serializer_context(self):
        #Pass the request to the serializer to access request.user in create()
        return {"request": self.request}

