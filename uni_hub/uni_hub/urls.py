from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenVerifyView, TokenBlacklistView
from app.views import *

urlpatterns = [
    path('admin/', admin.site.urls),
    path('auth/', include('djoser.urls')),
    path('auth/jwt/verify/', TokenVerifyView.as_view(), name='token-verify'),
    path('auth/jwt/blacklist/', TokenBlacklistView.as_view(), name='token-blacklist'),
    path("", include("app.urls")),
    path('api-auth/', include('rest_framework.urls')),  # Enables login form in DRF
    path("user/update/<int:user_id>/", UserProfileUpdateView.as_view(), name="user-update"),
    path('api/events/<int:event_pk>/rsvp/', RSVPUpdateView.as_view(), name='event-rsvp'),
]

