from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, DoctorStatus

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ['username', 'email', 'role', 'first_name', 'last_name', 'specialization', 'phone', 'city', 'age', 'gender', 'is_live', 'is_available_for_consultation']
    list_filter = ['role', 'specialization', 'city', 'gender', 'is_live', 'is_available_for_consultation']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'specialization']
    
    # Fields to display in the admin form
    fieldsets = UserAdmin.fieldsets + (
        ('Role Information', {'fields': ('role', 'specialization', 'is_live', 'is_available_for_consultation')}),
        ('Contact Information', {'fields': ('phone', 'city', 'photo')}),
        ('Personal Information', {'fields': ('age', 'gender')}),
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
        ('Role Information', {'fields': ('role', 'specialization', 'is_live', 'is_available_for_consultation')}),
        ('Contact Information', {'fields': ('phone', 'city', 'photo')}),
        ('Personal Information', {'fields': ('age', 'gender')}),
        ('Doctor Information', {
            'fields': (
                'license_number', 'experience_years', 'qualification', 
                'hospital', 'consultation_fee', 'bio', 'available_days', 'consultation_hours'
            ),
            'classes': ('collapse',),
            'description': 'These fields are specific to doctors'
        }),
    )

class DoctorStatusAdmin(admin.ModelAdmin):
    list_display = ['doctor', 'is_online', 'is_available_for_consultation', 'last_activity', 'status_changed_by']
    list_filter = ['is_online', 'is_available_for_consultation', 'status_changed_by']
    search_fields = ['doctor__username', 'doctor__first_name', 'doctor__last_name']
    readonly_fields = ['login_time', 'last_activity']
    
    fieldsets = (
        ('Doctor Information', {
            'fields': ('doctor', 'is_online', 'is_available_for_consultation')
        }),
        ('Status Details', {
            'fields': ('status_changed_by', 'login_time', 'logout_time', 'last_activity'),
            'classes': ('collapse',)
        }),
    )

admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(DoctorStatus, DoctorStatusAdmin)