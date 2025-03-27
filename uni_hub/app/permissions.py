from rest_framework.permissions import BasePermission
from .models import *

# Checking user is either event manager or community leader (community leaders can do all event manager functions)
class IsEventManager(BasePermission):
    def has_permission(self, request, view):
        # Get community ID from url/data/params
        community_id = view.kwargs.get("community_id") or request.data.get("community_id") or request.query_params.get("community_id")

        if not community_id:
            return False  # Cannot check permission without a community ID

        # Return true if user role is either "Leader" or "EventManager"
        return UserCommunity.objects.filter(
            user=request.user,
            community_id=community_id,
            role__in=["Leader", "EventManager"]
        ).exists()
    
# Checking user is community leader
class IsCommunityLeader(BasePermission):
    def has_permission(self, request, view):
        # Get community ID from url/data/params
        community_id = view.kwargs.get("community_id") or request.data.get("community_id") or request.query_params.get("community_id")

        # If not using community id
        if not community_id:
            # Get request ID (used to approve/deny join requests)
            request_id = request.query_params.get("request_id") or request.data.get("request_id")
            # If either not found return false
            if not request_id:
                return False
            try:
                # Get the community id from the join request
                join_request = UserRequestCommunity.objects.select_related("community").get(id=request_id)
                community_id = join_request.community.id
            except UserRequestCommunity.DoesNotExist:
                return False

        # Return true if user role is "Leader"
        return UserCommunity.objects.filter(
            user=request.user,
            community_id=community_id,
            role__in=["Leader"]
        ).exists()