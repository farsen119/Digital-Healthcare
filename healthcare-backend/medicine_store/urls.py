from django.urls import path
from .views import MedicineListCreateView, MedicineDetailView, CartView, StockHistoryListView

urlpatterns = [
    path('medicines/', MedicineListCreateView.as_view(), name='medicine-list-create'),
    path('medicines/<int:pk>/', MedicineDetailView.as_view(), name='medicine-detail'),
    path('cart/', CartView.as_view(), name='cart'),
    path('stock-history/', StockHistoryListView.as_view(), name='stock-history'),
    
]