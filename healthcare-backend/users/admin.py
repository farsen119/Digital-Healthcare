from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, DoctorStatus

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ['username', 'email', 'role', 'first_name', 'last_name', 'specialization', 'doctor_type', 'pharmacy_name', 'phone', 'city', 'age', 'gender', 'blood_group', 'is_live', 'is_available_for_consultation', 'is_available']
    list_filter = ['role', 'specialization', 'doctor_type', 'city', 'gender', 'blood_group', 'marital_status', 'is_live', 'is_available_for_consultation', 'is_available']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'specialization', 'emergency_contact_name']
    
    # Fields to display in the admin form
    fieldsets = UserAdmin.fieldsets + (
        ('Role Information', {'fields': ('role', 'specialization', 'is_live', 'is_available_for_consultation')}),
        ('Contact Information', {'fields': ('phone', 'city', 'photo')}),
        ('Personal Information', {'fields': ('age', 'gender', 'date_of_birth', 'marital_status', 'occupation')}),
        ('Patient Information', {
            'fields': (
                'address', 'blood_group', 'height', 'weight',
                'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship',
                'medical_history', 'current_medications', 'allergies'
            ),
            'classes': ('collapse',),
            'description': 'These fields are specific to patients'
        }),
        ('Doctor Information', {
            'fields': (
                'doctor_type', 'license_number', 'experience_years', 'qualification', 
                'hospital', 'consultation_fee', 'bio', 'available_days', 'consultation_hours',
                'current_queue_position', 'max_queue_size', 'consultation_duration',
                'is_consulting', 'current_patient', 'visiting_days', 'visiting_day_times'
            ),
            'classes': ('collapse',),
            'description': 'These fields are specific to doctors'
        }),
        ('Pharmacist Information', {
            'fields': (
                'pharmacy_name', 'pharmacy_license', 'pharmacy_address', 'working_hours', 'is_available'
            ),
            'classes': ('collapse',),
            'description': 'These fields are specific to pharmacists'
        }),
    )
    
    # Fields to display when adding a new user
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Role Information', {'fields': ('role', 'specialization', 'is_live', 'is_available_for_consultation')}),
        ('Contact Information', {'fields': ('phone', 'city', 'photo')}),
        ('Personal Information', {'fields': ('age', 'gender', 'date_of_birth', 'marital_status', 'occupation')}),
        ('Patient Information', {
            'fields': (
                'address', 'blood_group', 'height', 'weight',
                'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship',
                'medical_history', 'current_medications', 'allergies'
            ),
            'classes': ('collapse',),
            'description': 'These fields are specific to patients'
        }),
        ('Doctor Information', {
            'fields': (
                'doctor_type', 'license_number', 'experience_years', 'qualification', 
                'hospital', 'consultation_fee', 'bio', 'available_days', 'consultation_hours',
                'current_queue_position', 'max_queue_size', 'consultation_duration',
                'is_consulting', 'current_patient', 'visiting_days', 'visiting_day_times'
            ),
            'classes': ('collapse',),
            'description': 'These fields are specific to doctors'
        }),
        ('Pharmacist Information', {
            'fields': (
                'pharmacy_name', 'pharmacy_license', 'pharmacy_address', 'working_hours', 'is_available'
            ),
            'classes': ('collapse',),
            'description': 'These fields are specific to pharmacists'
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