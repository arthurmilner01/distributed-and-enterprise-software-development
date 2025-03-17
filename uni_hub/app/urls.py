from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .viewsets import *
from .views import *

router = DefaultRouter()
router.register(r'follow', FollowViewSet, basename='follow')
router.register(r'communities', CommunityViewSet, basename='community')
router.register(r'announcements', AnnouncementViewSet, basename='announcement')

urlpatterns = [
    path("auth/jwt/create/", CustomTokenObtainPairView.as_view(), name="jwt-create"),
    path("auth/jwt/refresh", CustomTokenRefreshView.as_view(), name="jwt-refresh"),
    path('auth/logout', logout_view, name='logout'),
    # All router URLs go under /api/
    path('api/', include(router.urls)),
    path('user/<int:id>/', GetProfileDetailsView.as_view(), name='get-user-details'),
    path('user/update/<int:user_id>/', UserProfileUpdateView.as_view(), name='user-profile-update'),
    path("protected/", protected_view, name="protected-view"),
    path("event/", event_view, name="event-view"),
    # Single user-communities endpoint
    path('api/user-communities/', user_communities_list, name='user-communities-list'),
    path("api/posts/<int:post_id>/comments/", CommentListCreateView.as_view(), name="post-comments"),

]
