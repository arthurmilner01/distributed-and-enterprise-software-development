from rest_framework.permissions import BasePermission
from .models import *

class IsEventManager(BasePermission):
    """
    Checking user is either event manager or community leader
    (community leaders can do all event manager functions)
    """
    def has_permission(self, request, view):
        # Get community ID primarily from data for POST, fallback to kwargs/params
        community_id = None
        if request.method == 'POST':
            # For create, check the 'community' field in request data, as serializer expects it
            community_id = request.data.get("community")
        else:
             # For other methods (like PUT/PATCH on detail view), check kwargs or query_params
             community_id = view.kwargs.get("community_id") or view.kwargs.get("pk") or request.query_params.get("community_id")
             # If targeting a specific event for update/delete, need has_object_permission (see note below)

        if not community_id:
            # If still no ID, try getting from query_params as a last resort for GET maybe?
             community_id = request.query_params.get("community_id")
             if not community_id:
                 return False # Cannot check permission without a community ID

        # Convert potential string ID to int for lookup if needed, handle error
        try:
            community_id_int = int(community_id)
        except (ValueError, TypeError):
             return False # Invalid community ID format

        # Return true if user role is either "Leader" or "EventManager" for this community
        return UserCommunity.objects.filter(
            user=request.user,
            community_id=community_id_int, # Use the integer ID for lookup
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