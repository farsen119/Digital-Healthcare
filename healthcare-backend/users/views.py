from rest_framework import generics, permissions, viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from .models import CustomUser
from .serializers import UserSerializer, RegisterSerializer

# # --- Part 1: Registration View ---
# # This part is for creating new users. It remains unchanged.
class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = RegisterSerializer
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [permissions.AllowAny]


# # --- Part 2: The Corrected UserViewSet ---
# # This handles everything else: listing, filtering, updating, and profiles.
# class UserViewSet(viewsets.ModelViewSet):
#     serializer_class = UserSerializer
#     parser_classes = [MultiPartParser, FormParser]
#     queryset = CustomUser.objects.all().order_by('-date_joined')

#     # This single method solves your filtering problem.
#     def get_queryset(self):
#         """
#         This method automatically filters users based on the 'role' parameter
#         provided in the URL. For example: /api/users/?role=doctor
#         """
#         # Start with the default queryset of all users.
#         queryset = super().get_queryset()
        
#         # Check if a 'role' was provided in the URL like '?role=some_role'
#         role = self.request.query_params.get('role')
        
#         if role:
#             # If a role was provided, filter the queryset.
#             # This is what makes your dropdowns for 'doctors' and 'patients' work.
#             return queryset.filter(role=role)
            
#         # If no role was provided, return the default queryset.
#         return queryset

#     # This method manages who can do what.
#     def get_permissions(self):
#         """
#         - Only Admins can list, retrieve, update, or delete users.
#         - Any authenticated user can access their own profile.
#         """
#         if self.action == 'profile':
#             return [permissions.IsAuthenticated()]
        
#         # For all other standard actions (list, update, etc.),
#         # only allow if the user is an admin.
#         return [permissions.IsAdminUser()]

#     # Your custom profile action, preserved and kept as is.
#     @action(detail=False, methods=['get', 'put'], url_path='profile')
#     def profile(self, request):
#         """
#         Allows a user to get or update their own profile.
#         Accessed via GET or PUT to /api/users/profile/
#         """
#         user = request.user
#         if request.method == 'GET':
#             serializer = self.get_serializer(user)
#             return Response(serializer.data)
#         elif request.method == 'PUT':
#             serializer = self.get_serializer(user, data=request.data, partial=True)
#             serializer.is_valid(raise_exception=True)
#             serializer.save()
#             return Response(serializer.data)

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
            return [permissions.AllowAny()]
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