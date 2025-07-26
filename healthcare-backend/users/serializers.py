from rest_framework import serializers
from .models import CustomUser

class UserSerializer(serializers.ModelSerializer):
    photo = serializers.ImageField(required=False, allow_null=True)
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'role', 'first_name', 'last_name',
            'specialization', 'photo', 'phone', 'city',
            # Doctor-specific fields
            'license_number', 'experience_years', 'qualification', 'hospital',
            'consultation_fee', 'bio', 'available_days', 'consultation_hours', 'is_live'
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

    class Meta:
        model = CustomUser
        fields = [
            'username', 'email', 'password', 'role', 'first_name', 'last_name',
            'specialization', 'photo', 'phone', 'city',
            # Doctor-specific fields
            'license_number', 'experience_years', 'qualification', 'hospital',
            'consultation_fee', 'bio', 'available_days', 'consultation_hours', 'is_live'
        ]

    def validate_username(self, value):
        if CustomUser.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists")
        return value

    def create(self, validated_data):
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
        )

        return user
    
    def validate(self, data):
        role = data.get('role')
        if role == 'doctor':
            if not data.get('specialization'):
                raise serializers.ValidationError({"specialization": "This field is required for doctors."})
            if not data.get('license_number'):
                raise serializers.ValidationError({"license_number": "Medical license number is required for doctors."})
            if not data.get('qualification'):
                raise serializers.ValidationError({"qualification": "Qualification is required for doctors."})
            if not data.get('phone'):
                raise serializers.ValidationError({"phone": "This field is required for doctors."})
        if role == 'patient':
            if not data.get('phone'):
                raise serializers.ValidationError({"phone": "This field is required for patients."})
            if not data.get('photo'):
                raise serializers.ValidationError({"photo": "This field is required for patients."})
        return data