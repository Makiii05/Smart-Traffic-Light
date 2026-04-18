from django.urls import path
from . import views

urlpatterns=[
    path("", views.index, name="index"),
    path("builder", views.builder, name="builder"),
    path("controller/<int:road_id>", views.controller, name="controller"),
]