from rest_framework import serializers
from .models import CustomUser

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'role', 'first_name', 'last_name',
            'specialization', 'photo', 'phone', 'city'
        ]

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    photo = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = CustomUser
        fields = [
            'username', 'email', 'password', 'role', 'first_name', 'last_name',
            'specialization', 'photo', 'phone', 'city'
        ]

    # def validate_email(self, value):
    #     if CustomUser.objects.filter(email=value).exists():
    #         raise serializers.ValidationError("Email already exists")
    #     return value

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
        )



        return user
    
    def validate(self, data):
      role = data.get('role')
      if role == 'doctor':
          if not data.get('specialization'):
              raise serializers.ValidationError({"specialization": "This field is required for doctors."})
          if not data.get('phone'):
              raise serializers.ValidationError({"phone": "This field is required for doctors."})
      if role == 'patient':
          if not data.get('phone'):
              raise serializers.ValidationError({"phone": "This field is required for patients."})
          if not data.get('photo'):
              raise serializers.ValidationError({"photo": "This field is required for patients."})
      return data