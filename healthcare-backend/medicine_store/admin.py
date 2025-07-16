from django.contrib import admin
from .models import Medicine, Cart, CartItem, StockHistory

admin.site.register(Medicine)
admin.site.register(Cart)
admin.site.register(CartItem)
admin.site.register(StockHistory)
