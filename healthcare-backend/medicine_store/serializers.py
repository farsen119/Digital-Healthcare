from rest_framework import serializers
from .models import Medicine, Cart, CartItem, StockHistory

class StockHistorySerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source='medicine.name', read_only=True)
    class Meta:
        model = StockHistory
        fields = ['id', 'medicine', 'medicine_name', 'change', 'reason', 'date', 'user']

class MedicineSerializer(serializers.ModelSerializer):
    is_low_stock = serializers.SerializerMethodField()

    class Meta:
        model = Medicine
        fields = '__all__'
        extra_kwargs = {
            'image': {'required': False, 'allow_null': True}
        }

    def get_is_low_stock(self, obj):
        return obj.stock < 10  # or any threshold you want

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