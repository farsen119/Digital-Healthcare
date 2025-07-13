from rest_framework import generics, permissions, viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from .models import CustomUser
from .serializers import UserSerializer, RegisterSerializer

class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = RegisterSerializer
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [permissions.AllowAny]

class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    parser_classes = [MultiPartParser, FormParser]
    queryset = CustomUser.objects.all().order_by('-date_joined')

    def get_queryset(self):
        queryset = super().get_queryset()
        role = self.request.query_params.get('role')
        if role:
            return queryset.filter(role=role)
        return queryset

    def get_permissions(self):
        if self.action == 'profile':
            return [permissions.IsAuthenticated()]
        if self.action == 'list':
            return [permissions.IsAuthenticated()]
        # Only admins can retrieve, update, or delete other users
        return [permissions.IsAdminUser()]

    @action(detail=False, methods=['get', 'put'], url_path='profile')
    def profile(self, request):
        user = request.user
        if request.method == 'GET':
            serializer = self.get_serializer(user)
            return Response(serializer.data)
        elif request.method == 'PUT':
            serializer = self.get_serializer(user, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)