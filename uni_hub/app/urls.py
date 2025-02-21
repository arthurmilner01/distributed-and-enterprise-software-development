from django.urls import path, include
from rest_framework.routers import DefaultRouter, Route, DynamicRoute
from .viewsets import *
from .views import *

urlpatterns = [
    path("auth/jwt/create/", CustomTokenObtainPairView.as_view(), name="jwt-create"),
    path("auth/jwt/refresh", CustomTokenRefreshView.as_view(), name="jwt-refresh"),
]



