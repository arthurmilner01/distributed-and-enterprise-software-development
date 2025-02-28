from django.urls import path, include
from rest_framework.routers import DefaultRouter, Route, DynamicRoute
from .viewsets import *
from .views import *

urlpatterns = [
    path("auth/jwt/create/", CustomTokenObtainPairView.as_view(), name="jwt-create"),
    path("auth/jwt/refresh", CustomTokenRefreshView.as_view(), name="jwt-refresh"),
    path('user/<int:id>/', GetProfileDetailsView.as_view(), name='get-user-details'),  #Fetch user details by ID
    path('user/update/<int:user_id>/', UserProfileUpdateView.as_view(), name='user-profile-update'), #Update user profile
    path("protected/", protected_view, name="protected-view"),
    path("event/", event_view, name="event-view"),
]



