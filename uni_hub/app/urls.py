from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .viewsets import *
from .views import *

# Using router to generate the URLs for viewsets
router = DefaultRouter()
router.register(r'follow', FollowViewSet, basename='follow')
router.register(r'communityfollow', CommunityFollowViewSet, basename='communityfollow')
router.register(r'communities', CommunityViewSet, basename='community')
router.register(r'announcements', AnnouncementViewSet, basename='announcement')
router.register(r'achievements', AchievementViewSet, basename='achievements')
router.register(r'pinnedposts', PinnedPostViewSet, basename='pinnedposts')
router.register(r'events', EventViewSet, basename='events')
router.register(r'users', UserSearchViewSet, basename='user-search')
urlpatterns = [
    path("auth/jwt/create/", CustomTokenObtainPairView.as_view(), name="jwt-create"),
    path("auth/jwt/refresh", CustomTokenRefreshView.as_view(), name="jwt-refresh"),
    path('auth/logout', logout_view, name='logout'),
    # All router URLs go under /api/
    path('api/', include(router.urls)),
    path('user/<int:id>/', GetProfileDetailsView.as_view(), name='get-user-details'),
    path('user/update/<int:user_id>/', UserProfileUpdateView.as_view(), name='user-profile-update'),
    path("api/posts/<int:post_id>/comments/", CommentListCreateView.as_view(), name="post-comments"),
    path('api/keywords/suggestions/', KeywordSuggestionsView.as_view(), name='keyword-suggestions'),
    path("api/user-communities/", UserCommunityListView.as_view(), name="user-communities"),
    path("api/user-badges/", ProfileBadgesView.as_view(), name="user-badges"),
    path("api/community/members/", get_community_members, name="community-members"),
    path("api/posts/<int:post_id>/toggle-like/", toggle_like, name="toggle-like"),
    path('api/universities/list/', UniversityListView.as_view(), name='university-list'),

    path('api/events/<int:community_id>/', EventViewSet.as_view({'post': 'create'}), name='create-event'),


]
