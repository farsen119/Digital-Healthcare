from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Medicine, Cart, CartItem, Order, OrderItem
from .serializers import MedicineSerializer, CartSerializer, CartItemSerializer, OrderSerializer

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
        medicine = Medicine.objects.get(id=medicine_id)
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
        medicine = Medicine.objects.get(id=medicine_id)
        CartItem.objects.filter(cart=cart, medicine=medicine).delete()
        serializer = CartSerializer(cart)
        return Response(serializer.data)

# Order APIs
class OrderCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        cart = Cart.objects.get(user=request.user)
        items = cart.items.all()
        if not items:
            return Response({'error': 'Cart is empty'}, status=400)
        total_price = 0
        order = Order.objects.create(user=request.user, total_price=0)
        for item in items:
            if item.medicine.stock < item.quantity:
                return Response({'error': f'Not enough stock for {item.medicine.name}'}, status=400)
            price = item.medicine.price * item.quantity
            OrderItem.objects.create(order=order, medicine=item.medicine, quantity=item.quantity, price=price)
            item.medicine.stock -= item.quantity
            item.medicine.save()
            total_price += price
        order.total_price = total_price
        order.save()
        items.delete()  # Clear cart
        return Response(OrderSerializer(order).data, status=201)

class UserOrdersView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)
    


