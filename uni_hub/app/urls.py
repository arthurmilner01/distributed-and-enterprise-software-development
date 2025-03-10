from django.urls import path, include
from rest_framework.routers import DefaultRouter, Route, DynamicRoute
from .viewsets import *
from .views import *

router = DefaultRouter()
#Add follow viewset
router.register(r'follow', FollowViewSet, basename='follow')
router.register(r'communities', CommunityViewSet, basename='community')
urlpatterns = [
    path("auth/jwt/create/", CustomTokenObtainPairView.as_view(), name="jwt-create"),
    path("auth/jwt/refresh", CustomTokenRefreshView.as_view(), name="jwt-refresh"),
    path('auth/logout', logout_view, name='logout'),
    path('api/', include(router.urls)),  #Router URLs for viewsets
    path('user/<int:id>/', GetProfileDetailsView.as_view(), name='get-user-details'),  #Fetch user details by ID
    path('user/update/<int:user_id>/', UserProfileUpdateView.as_view(), name='user-profile-update'), #Update user profile
    path("protected/", protected_view, name="protected-view"),
    path("event/", event_view, name="event-view"),
    path('api/user-communities/', user_communities_list, name='user-communities-list'),

]



