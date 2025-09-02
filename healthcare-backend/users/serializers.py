from rest_framework import serializers
from .models import CustomUser

class PublicDoctorSerializer(serializers.ModelSerializer):
    """Serializer for public display of doctors (no sensitive information)"""
    photo = serializers.ImageField(required=False, allow_null=True)
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'first_name', 'last_name', 'specialization', 'photo',
            'qualification', 'hospital', 'consultation_fee', 'bio',
            'available_days', 'consultation_hours', 'experience_years',
            'doctor_type', 'is_live', 'is_available_for_consultation',
            'current_queue_position', 'max_queue_size', 'consultation_duration',
            'is_consulting', 'current_patient'
        ]
        read_only_fields = ['id']

class UserSerializer(serializers.ModelSerializer):
    photo = serializers.ImageField(required=False, allow_null=True)
    bmi = serializers.ReadOnlyField()
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'role', 'first_name', 'last_name',
            'specialization', 'photo', 'phone', 'city',
            # Doctor-specific fields
            'license_number', 'experience_years', 'qualification', 'hospital',
            'consultation_fee', 'bio', 'available_days', 'consultation_hours', 'is_live', 'is_available_for_consultation',
            'doctor_type', 'current_queue_position', 'max_queue_size', 'consultation_duration',
            'is_consulting', 'current_patient', 'visiting_days', 'visiting_day_times',
             # Pharmacist-specific fields
            'pharmacy_name', 'pharmacy_license', 'pharmacy_address', 'working_hours', 'is_available',
            # Nurse fields
            'nurse_license', 'nursing_qualification', 'nurse_specialization', 'nurse_experience_years', 'hospital_assignment', 'shift_preference', 'is_available_for_duty',
            # Age and Gender fields
            'age', 'gender',
            # Patient-specific fields
            'date_of_birth', 'address', 'blood_group', 'emergency_contact_name', 'emergency_contact_phone',
            'emergency_contact_relationship', 'medical_history', 'current_medications', 'allergies',
            'height', 'weight', 'occupation', 'marital_status', 'bmi'
        ]
        read_only_fields = ['id']  # ID should not be editable

    def to_representation(self, instance):
        """Custom representation"""
        return super().to_representation(instance)

    def update(self, instance, validated_data):
        # Handle partial updates properly
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Handle doctor type specific field clearing
        if instance.role == 'doctor' and 'doctor_type' in validated_data:
            doctor_type = validated_data['doctor_type']
            
            # Clear fields based on doctor type
            if doctor_type == 'permanent':
                # Clear visiting doctor fields for permanent doctors
                instance.visiting_days = []
                instance.visiting_day_times = {}
            elif doctor_type == 'visiting':
                # Clear permanent doctor fields for visiting doctors
                instance.available_days = ''
                instance.consultation_hours = ''
                instance.max_queue_size = 10
                instance.consultation_duration = 15
        
        instance.save()
        return instance

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    photo = serializers.ImageField(required=False, allow_null=True)
    age = serializers.IntegerField(required=True, min_value=1, max_value=120, allow_null=False)
    gender = serializers.ChoiceField(choices=CustomUser.GENDER_CHOICES, required=True, allow_blank=False)
    phone = serializers.CharField(required=True, allow_blank=False)

    class Meta:
        model = CustomUser
        fields = [
            'username', 'email', 'password', 'role', 'first_name', 'last_name',
            'specialization', 'photo', 'phone', 'city',
            # Doctor-specific fields
            'license_number', 'experience_years', 'qualification', 'hospital',
            'consultation_fee', 'bio', 'available_days', 'consultation_hours', 'is_live', 'is_available_for_consultation',
            'doctor_type', 'current_queue_position', 'max_queue_size', 'consultation_duration',
            'is_consulting', 'current_patient', 'visiting_days', 'visiting_day_times',
            # Pharmacist-specific fields
            'pharmacy_name', 'pharmacy_license', 'pharmacy_address', 'working_hours', 'is_available',
            # Nurse fields
            'nurse_license', 'nursing_qualification', 'nurse_specialization', 'nurse_experience_years', 'hospital_assignment', 'shift_preference', 'is_available_for_duty',
            # Age and Gender fields
            'age', 'gender',
            # Patient-specific fields
            'date_of_birth', 'address', 'blood_group', 'emergency_contact_name', 'emergency_contact_phone',
            'emergency_contact_relationship', 'medical_history', 'current_medications', 'allergies',
            'height', 'weight', 'occupation', 'marital_status'
        ]

    def validate_username(self, value):
        if CustomUser.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists")
        return value

    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value

    def create(self, validated_data):
        # Parse JSON strings for complex fields
        if 'visiting_day_times' in validated_data and isinstance(validated_data['visiting_day_times'], str):
            import json
            try:
                validated_data['visiting_day_times'] = json.loads(validated_data['visiting_day_times'])
            except json.JSONDecodeError:
                validated_data['visiting_day_times'] = {}
        
        if 'visiting_days' in validated_data and isinstance(validated_data['visiting_days'], str):
            import json
            try:
                validated_data['visiting_days'] = json.loads(validated_data['visiting_days'])
            except json.JSONDecodeError:
                validated_data['visiting_days'] = []
        
        try:
            user = CustomUser.objects.create_user(
                username=validated_data['username'],
                email=validated_data['email'],
                password=validated_data['password'],
                role=validated_data['role'],
                first_name=validated_data.get('first_name', ''),
                last_name=validated_data.get('last_name', ''),
                specialization=validated_data.get('specialization', ''),
                photo=validated_data.get('photo', None),
                phone=validated_data.get('phone', ''),
                city=validated_data.get('city', ''),
                # Doctor-specific fields
                license_number=validated_data.get('license_number', ''),
                experience_years=validated_data.get('experience_years', None),
                qualification=validated_data.get('qualification', ''),
                hospital=validated_data.get('hospital', ''),
                consultation_fee=validated_data.get('consultation_fee', None),
                bio=validated_data.get('bio', ''),
                available_days=validated_data.get('available_days', ''),
                consultation_hours=validated_data.get('consultation_hours', ''),
                is_live=validated_data.get('is_live', False),
                is_available_for_consultation=validated_data.get('is_available_for_consultation', False),
                doctor_type=validated_data.get('doctor_type', 'permanent'),
                current_queue_position=validated_data.get('current_queue_position', 0),
                max_queue_size=validated_data.get('max_queue_size', 10),
                consultation_duration=validated_data.get('consultation_duration', 15),
                is_consulting=validated_data.get('is_consulting', False),
                current_patient=validated_data.get('current_patient', None),
                visiting_days=validated_data.get('visiting_days', []),
                visiting_day_times=validated_data.get('visiting_day_times', {}),
                # Pharmacist-specific fields
                pharmacy_name=validated_data.get('pharmacy_name', ''),
                pharmacy_license=validated_data.get('pharmacy_license', ''),
                pharmacy_address=validated_data.get('pharmacy_address', ''),
                working_hours=validated_data.get('working_hours', ''),
                is_available=validated_data.get('is_available', True),
                # Nurse fields
                nurse_license=validated_data.get('nurse_license', ''),
                nursing_qualification=validated_data.get('nursing_qualification', ''),
                nurse_specialization=validated_data.get('nurse_specialization', ''),
                nurse_experience_years=validated_data.get('nurse_experience_years', None),
                hospital_assignment=validated_data.get('hospital_assignment', ''),
                shift_preference=validated_data.get('shift_preference', ''),
                is_available_for_duty=validated_data.get('is_available_for_duty', False),
                # Age and Gender fields
                age=validated_data.get('age', None),
                gender=validated_data.get('gender', ''),
                # Patient-specific fields
                date_of_birth=validated_data.get('date_of_birth', None),
                address=validated_data.get('address', ''),
                blood_group=validated_data.get('blood_group', ''),
                emergency_contact_name=validated_data.get('emergency_contact_name', ''),
                emergency_contact_phone=validated_data.get('emergency_contact_phone', ''),
                emergency_contact_relationship=validated_data.get('emergency_contact_relationship', ''),
                medical_history=validated_data.get('medical_history', ''),
                current_medications=validated_data.get('current_medications', ''),
                allergies=validated_data.get('allergies', ''),
                height=validated_data.get('height', None),
                weight=validated_data.get('weight', None),
                occupation=validated_data.get('occupation', ''),
                marital_status=validated_data.get('marital_status', ''),
            )
            return user
        except Exception as e:
            raise serializers.ValidationError(f"Error creating user: {str(e)}")
    
    def validate(self, data):
        role = data.get('role')
        
        # Prevent admin role creation through API (only superusers can create admins)
        if role == 'admin':
            raise serializers.ValidationError({"role": "Admin role cannot be created through this interface. Only superusers can create admin accounts."})
        
        # Validate required fields for all users
        if not data.get('first_name'):
            raise serializers.ValidationError({"first_name": "First name is required."})
        if not data.get('last_name'):
            raise serializers.ValidationError({"last_name": "Last name is required."})
        if not data.get('phone'):
            raise serializers.ValidationError({"phone": "Phone number is required."})
        if not data.get('age'):
            raise serializers.ValidationError({"age": "Age is required."})
        if not data.get('gender'):
            raise serializers.ValidationError({"gender": "Gender is required."})
        
        # Validate age range
        age = data.get('age')
        if age and (age < 1 or age > 120):
            raise serializers.ValidationError({"age": "Age must be between 1 and 120."})
        
        # Role-specific validations
        if role == 'doctor':
            if not data.get('specialization'):
                raise serializers.ValidationError({"specialization": "This field is required for doctors."})
            if not data.get('license_number'):
                raise serializers.ValidationError({"license_number": "Medical license number is required for doctors."})
            if not data.get('qualification'):
                raise serializers.ValidationError({"qualification": "Qualification is required for doctors."})
            
            # Validate doctor type for doctors
            doctor_type = data.get('doctor_type', 'permanent')
            if doctor_type not in ['permanent', 'visiting']:
                raise serializers.ValidationError({"doctor_type": "Doctor type must be either 'permanent' or 'visiting'."})
            
            # Set default values for doctor type specific fields
            if doctor_type == 'permanent':
                data.setdefault('max_queue_size', 10)
                data.setdefault('consultation_duration', 15)
                # Clear visiting doctor fields for permanent doctors
                data['visiting_days'] = []
                data['visiting_day_times'] = {}
            elif doctor_type == 'visiting':
                data.setdefault('visiting_days', [])
                data.setdefault('visiting_day_times', {})
                # Clear permanent doctor fields for visiting doctors
                data['available_days'] = ''
                data['consultation_hours'] = ''
                data['max_queue_size'] = 10
                data['consultation_duration'] = 15
        
        # Role-specific validations for pharmacists
        if role == 'pharmacist':
            if not data.get('pharmacy_name'):
                raise serializers.ValidationError({"pharmacy_name": "Pharmacy name is required for pharmacists."})
            if not data.get('pharmacy_license'):
                raise serializers.ValidationError({"pharmacy_license": "Pharmacy license number is required for pharmacists."})
            if not data.get('pharmacy_address'):
                raise serializers.ValidationError({"pharmacy_address": "Pharmacy address is required for pharmacists."})
            if not data.get('working_hours'):
                raise serializers.ValidationError({"working_hours": "Working hours are required for pharmacists."})
        
        return data