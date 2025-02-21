from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenVerifyView, TokenBlacklistView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('auth/', include('djoser.urls')),
    path('auth/jwt/verify/', TokenVerifyView.as_view(), name='token-verify'),
    path('auth/jwt/blacklist/', TokenBlacklistView.as_view(), name='token-blacklist'),
    path("", include("app.urls")),
]

