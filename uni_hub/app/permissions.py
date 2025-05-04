from rest_framework.permissions import BasePermission, IsAuthenticated, SAFE_METHODS
from .models import *

class IsEventManager(BasePermission):
    # Allows read actions for normal users and create/update/delete for Leader/Event Manager
    message = 'You do not have permission to perform this action on this event.' # Specific error message

    def has_permission(self, request, view):
        # Allow list view for any authenticated user initially (permissions applied later if needed)
        # Let has_object_permission handle retrieve access control
        if view.action == 'list' or request.method in SAFE_METHODS:
             # Allow if authenticated
             return True

        # For create, check role against the community ID provided in the request data
        if view.action == 'create':
            if not request.user.is_authenticated:
                 return False

            community_id = request.data.get("community") # Get community from POST data
            if not community_id:
                self.message = "Community ID is required to create an event."
                return False # Cannot check permission without target community

            # Convert to int to prevent type errors
            try:
                community_id_int = int(community_id)
            except (ValueError, TypeError):
                self.message = "Invalid Community ID format."
                return False

            # Check if user has the required role in the specified community for creation
            can_create = UserCommunity.objects.filter(
                user=request.user,
                community_id=community_id_int,
                role__in=["Leader", "EventManager"] # Case-sensitive roles
            ).exists()
            if not can_create:
                 self.message = "You must be a Leader or Event Manager in this community to create events."
            return can_create

        # Return IsAuthenticated value as default
        return request.user.is_authenticated


    def has_object_permission(self, request, view, obj):

        if request.method in SAFE_METHODS:
            return True # IsAuthenticated is also applied

        if not request.user.is_authenticated:
            return False

        # Check if the event object has a community linked
        if not hasattr(obj, 'community') or not obj.community:
             # Should not happen with a non-nullable ForeignKey
             self.message = "Event is not linked to a community."
             return False

        # Check if the authenticated user has the required role in the event's community
        has_role = UserCommunity.objects.filter(
            user=request.user,
            community=obj.community, # Check against the specific community of the event
            role__in=["Leader", "EventManager"] # Allowed roles
        ).exists()
        if not has_role:
            self.message = "You must be a Leader or Event Manager in this community to modify this event."
        return has_role

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
class IsCommunityMemberForEvent(BasePermission):
    message = 'You must be a member of the community to RSVP.'

    def has_permission(self, request, view):
        # Let IsAuthenticated handle the initial check
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Assumes 'obj' is the Event instance passed from the view
        if not hasattr(obj, 'community') or not obj.community:
            return False
        return UserCommunity.objects.filter(
            user=request.user,
            community=obj.community
        ).exists()