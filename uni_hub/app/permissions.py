from rest_framework.permissions import BasePermission

# Checking user has event manager permissions
class IsEventManager(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'E'

# Checking user has community leader permissions
class IsCommunityLeader(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'C'