from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrderCreateView, UserOrdersView, AdminOrdersView, OrderViewSet

router = DefaultRouter()
router.register(r'orders', OrderViewSet, basename='order')

urlpatterns = [
    path('create/', OrderCreateView.as_view(), name='order-create'),
    path('my-orders/', UserOrdersView.as_view(), name='user-orders'),
    path('admin-orders/', AdminOrdersView.as_view(), name='admin-orders'),
    path('', include(router.urls)),
]