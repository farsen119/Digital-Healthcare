# activity_serializers.py
from rest_framework import serializers

class ActivitySerializer(serializers.Serializer):
    type = serializers.CharField()
    message = serializers.CharField()
    date = serializers.DateTimeField()