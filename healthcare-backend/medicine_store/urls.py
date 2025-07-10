from django.urls import path
from .views import AdminOrdersView
from .views import (
    MedicineListCreateView, MedicineDetailView,
    CartView, OrderCreateView, UserOrdersView
)

urlpatterns = [
    path('medicines/', MedicineListCreateView.as_view(), name='medicine-list-create'),
    path('medicines/<int:pk>/', MedicineDetailView.as_view(), name='medicine-detail'),
    path('cart/', CartView.as_view(), name='cart'),
    path('orders/', OrderCreateView.as_view(), name='order-create'),
    path('my-orders/', UserOrdersView.as_view(), name='user-orders'),

    path('admin-orders/', AdminOrdersView.as_view(), name='admin-orders'),

]