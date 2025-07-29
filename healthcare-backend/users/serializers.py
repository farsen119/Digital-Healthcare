from rest_framework import serializers
from .models import CustomUser

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
            # Age and Gender fields
            'age', 'gender',
            # Patient-specific fields
            'date_of_birth', 'address', 'blood_group', 'emergency_contact_name', 'emergency_contact_phone',
            'emergency_contact_relationship', 'medical_history', 'current_medications', 'allergies',
            'height', 'weight', 'occupation', 'marital_status', 'bmi'
        ]
        read_only_fields = ['id']  # ID should not be editable

    def update(self, instance, validated_data):
        # Handle partial updates properly
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
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
        
        return data