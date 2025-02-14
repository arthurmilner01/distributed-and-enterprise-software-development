from django.urls import path, include
from rest_framework.routers import DefaultRouter, Route, DynamicRoute
from .viewsets import *

# class CustomRouter(DefaultRouter):
#     routes = [
#         # Custom route for a custom method on the viewset
#         Route(
#             url=r'^{prefix}/custom_action/$',
#             mapping={'get': 'custom_action'},
#             name='{basename}-custom-action',
#             detail=False,
#             initkwargs={}
#         ),
#         # Inherit all default routes
#         *DefaultRouter.routes
#     ]

# # Now we use our custom router instead of the default one
# router = CustomRouter()
# router.register(r'posts', PostViewSet)

# urlpatterns = [
#     path('', include(router.urls)),
# ]


urlpatterns = [

]



