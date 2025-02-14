from django.urls import path, include
from rest_framework.routers import DefaultRouter, Route, DynamicRoute
from .viewsets import *
from .views import *


urlpatterns = [
    path("student/", UserProfileView.as_view(), name="user-profile"),

]



