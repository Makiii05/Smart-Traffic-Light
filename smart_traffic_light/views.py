from django.shortcuts import render

# Create your views here.

def index(request):
    return render(request, "admin/index.html")

def builder(request):
    return render(request, "admin/builder.html")