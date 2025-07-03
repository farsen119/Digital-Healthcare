from django.urls import path
from .views import RecentActivityView

urlpatterns = [
    path('recent-activities/', RecentActivityView.as_view(), name='recent-activities'),

]