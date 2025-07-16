from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Medicine, Cart, CartItem, StockHistory
from .serializers import MedicineSerializer, CartSerializer, StockHistorySerializer
from django.shortcuts import get_object_or_404

# Medicine APIs
class MedicineListCreateView(generics.ListCreateAPIView):
    queryset = Medicine.objects.all()
    serializer_class = MedicineSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]

class MedicineDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Medicine.objects.all()
    serializer_class = MedicineSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'DELETE']:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]

# Cart APIs
class CartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cart, created = Cart.objects.get_or_create(user=request.user)
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    def post(self, request):
        cart, created = Cart.objects.get_or_create(user=request.user)
        medicine_id = request.data.get('medicine_id')
        quantity = int(request.data.get('quantity', 1))
        medicine = get_object_or_404(Medicine, id=medicine_id)
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            medicine=medicine,
            defaults={'quantity': quantity}
        )
        if not created:
            cart_item.quantity = quantity
            cart_item.save()
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    def delete(self, request):
        cart, created = Cart.objects.get_or_create(user=request.user)
        medicine_id = request.data.get('medicine_id')
        medicine = get_object_or_404(Medicine, id=medicine_id)
        CartItem.objects.filter(cart=cart, medicine=medicine).delete()
        serializer = CartSerializer(cart)
        return Response(serializer.data)
    
class StockHistoryListView(generics.ListAPIView):
    queryset = StockHistory.objects.select_related('medicine', 'user').order_by('-date')
    serializer_class = StockHistorySerializer
    permission_classes = [permissions.IsAdminUser]