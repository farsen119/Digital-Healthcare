from rest_framework import serializers
from .models import Medicine, Cart, CartItem, Order, OrderItem

class MedicineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medicine
        fields = '__all__'
        extra_kwargs = {
            'image': {'required': False, 'allow_null': True}
        }

class CartItemSerializer(serializers.ModelSerializer):
    medicine = MedicineSerializer(read_only=True)
    medicine_id = serializers.PrimaryKeyRelatedField(
        queryset=Medicine.objects.all(), source='medicine', write_only=True
    )

    class Meta:
        model = CartItem
        fields = ['id', 'medicine', 'medicine_id', 'quantity']

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)

    class Meta:
        model = Cart
        fields = ['id', 'user', 'created_at', 'items']

class OrderItemSerializer(serializers.ModelSerializer):
    medicine = MedicineSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = ['medicine', 'quantity', 'price']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'user', 'created_at', 'total_price', 'status', 'items']