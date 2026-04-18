from django.shortcuts import render

# Create your views here.

def index(request):
    return render(request, "admin/index.html")

def builder(request):
    return render(request, "admin/builder.html")

def controller(request, road_id):
    return render(request, "admin/controller.html", {
        "road_id": road_id
        })