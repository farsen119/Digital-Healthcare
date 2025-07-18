from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('users.urls')),
    path('api/', include('appointments.urls')),
    path('api/prescriptions/', include('prescriptions.urls')),
    path('api/', include('activity.urls')),
    path('api/', include('medicine_store.urls')),
    path('api/order-management/', include('order_management.urls')),

    path('api/notifications/', include('notifications.urls')),



]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)