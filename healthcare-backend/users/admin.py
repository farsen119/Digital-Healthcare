from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ['username', 'email', 'role', 'first_name', 'last_name', 'specialization', 'phone', 'city']
    list_filter = ['role', 'specialization', 'city']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'specialization']
    
    # Fields to display in the admin form
    fieldsets = UserAdmin.fieldsets + (
        ('Role Information', {'fields': ('role', 'specialization')}),
        ('Contact Information', {'fields': ('phone', 'city', 'photo')}),
        ('Doctor Information', {
            'fields': (
                'license_number', 'experience_years', 'qualification', 
                'hospital', 'consultation_fee', 'bio', 'available_days', 'consultation_hours'
            ),
            'classes': ('collapse',),
            'description': 'These fields are specific to doctors'
        }),
    )
    
    # Fields to display when adding a new user
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Role Information', {'fields': ('role', 'specialization')}),
        ('Contact Information', {'fields': ('phone', 'city', 'photo')}),
        ('Doctor Information', {
            'fields': (
                'license_number', 'experience_years', 'qualification', 
                'hospital', 'consultation_fee', 'bio', 'available_days', 'consultation_hours'
            ),
            'classes': ('collapse',),
            'description': 'These fields are specific to doctors'
        }),
    )

admin.site.register(CustomUser, CustomUserAdmin)