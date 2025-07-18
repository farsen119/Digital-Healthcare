from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from django.db.models import Sum
from .models import Order, OrderItem
from .serializers import OrderSerializer
from medicine_store.models import Cart, CartItem, Medicine, StockHistory
from notifications.models import Notification  # <-- Import Notification

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
            # Stock history added
            StockHistory.objects.create(
                medicine=item.medicine,
                change=-item.quantity,
                reason='sold',
                user=request.user
            )
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

class AdminOrdersView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        orders = Order.objects.all().order_by('-created_at')
        serializer = OrderSerializer(orders, many=True)
        # Exclude cancelled orders from revenue
        total_revenue = Order.objects.exclude(status='cancelled').aggregate(total=Sum('total_price'))['total'] or 0
        return Response({
            'orders': serializer.data,
            'total_revenue': total_revenue
        })

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().order_by('-created_at')
    serializer_class = OrderSerializer

    def get_permissions(self):
        # Allow admins to list/retrieve all, users to access their own
        if self.action in ['list', 'retrieve', 'admin_orders']:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]

    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAuthenticated])
    def status(self, request, pk=None):
        order = self.get_object()
        user = request.user
        new_status = request.data.get('status')
        cancel_reason = request.data.get('cancel_reason')

        # Only allow admin or the order's owner to change status
        if not (user.is_staff or order.user == user):
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        if not new_status:
            return Response({'error': 'Status is required.'}, status=status.HTTP_400_BAD_REQUEST)

        if new_status == 'cancelled':
            if not cancel_reason:
                return Response({'error': 'Cancel reason is required.'}, status=status.HTTP_400_BAD_REQUEST)
            order.status = new_status
            order.cancel_reason = cancel_reason
            order.save(update_fields=['status', 'cancel_reason'])
            # Notify patient about cancellation
            Notification.objects.create(
                user=order.user,
                message=f"Your order #{order.id} has been cancelled. Reason: {cancel_reason}"
            )
        else:
            order.status = new_status
            order.save(update_fields=['status'])
            # Notify patient about status update
            Notification.objects.create(
                user=order.user,
                message=f"Your order #{order.id} status has been updated to '{new_status}'."
            )

        return Response(OrderSerializer(order).data)