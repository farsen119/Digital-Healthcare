from django.contrib import admin
from .models import Medicine, Cart, CartItem

admin.site.register(Medicine)
admin.site.register(Cart)
admin.site.register(CartItem)