from django.urls import path
from . import views

urlpatterns=[
    path("", views.index, name="index"),
    path("builder", views.builder, name="builder"),
    path("controller/<int:road_id>", views.controller, name="controller"),

    path("create", views.create_road, name="create_road"),
    path("delete/<int:road_id>", views.delete_road, name="delete_road"),
    path("update/<int:road_id>", views.update_road, name="update_road"),
    
    path("api/controller-times/<int:road_id>/update", views.update_controller_times_api, name="update_controller_times_api"),
]