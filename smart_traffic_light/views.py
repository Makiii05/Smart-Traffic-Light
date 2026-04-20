from django.shortcuts import render
from django.http import HttpResponseRedirect
from django.urls import reverse
from .models import Intersection, RoadType, Pedestrian

# Create your views here.

def index(request):
    intersections = Intersection.objects.select_related("road_type_config", "pedestrian_config")

    return render(request, "admin/index.html", {
        "intersections": intersections
    })

def builder(request):
    return render(request, "admin/builder.html")

def controller(request, road_id):
    intersection = Intersection.objects.select_related("road_type_config", "pedestrian_config").get(id=road_id)
    
    return render(request, "admin/controller.html", {
        "intersection": intersection
    })




def create_road(request):
    if request.method == "POST":
        # intersection table
        road_name = request.POST.get("road_name")
        intersection_type = request.POST.get("intersection_type")
        # road type table
        road_type = request.POST.get("road_type")
        vertical_road_mode = request.POST.get("vertical_road_type")
        horizontal_road_mode = request.POST.get("horizontal_road_type")
        vertical_direction = request.POST.get("vertical_direction")
        horizontal_direction = request.POST.get("horizontal_direction")
        # pedestrian table
        north = request.POST.get("pedestrian_lane_north")
        south = request.POST.get("pedestrian_lane_south")
        east = request.POST.get("pedestrian_lane_east")
        west = request.POST.get("pedestrian_lane_west")

        intersection = Intersection.objects.create(
            name=road_name,
            intersection_type=intersection_type,
        )
        RoadType.objects.create(
            intersection=intersection,
            road_type=road_type,
            vertical_road_mode=vertical_road_mode,
            horizontal_road_mode=horizontal_road_mode,
            vertical_direction=vertical_direction,
            horizontal_direction=horizontal_direction,
        )
        Pedestrian.objects.create(
            intersection=intersection,
            north=True if north else False,
            south=True if south else False,
            east=True if east else False,
            west=True if west else False,
        )
        return HttpResponseRedirect(reverse("index"))
    else:
        return HttpResponseRedirect(reverse("builder"))

def delete_road(request, road_id):
    try:
        intersection = Intersection.objects.get(id=road_id)
        intersection.delete()
    except Intersection.DoesNotExist:
        pass

    return HttpResponseRedirect(reverse("index"))

def update_road(request, road_id):
    try:
        intersection = Intersection.objects.select_related("road_type_config", "pedestrian_config").get(id=road_id)
    except Intersection.DoesNotExist:
        return HttpResponseRedirect(reverse("index"))

    if request.method == "POST":
        road_name = request.POST.get("road_name")
        intersection_type = request.POST.get("intersection_type")
        road_type = request.POST.get("road_type")
        vertical_road_mode = request.POST.get("vertical_road_type")
        horizontal_road_mode = request.POST.get("horizontal_road_type")
        vertical_direction = request.POST.get("vertical_direction")
        horizontal_direction = request.POST.get("horizontal_direction")
        north = request.POST.get("pedestrian_lane_north")
        south = request.POST.get("pedestrian_lane_south")
        east = request.POST.get("pedestrian_lane_east")
        west = request.POST.get("pedestrian_lane_west")

        intersection.name = road_name
        intersection.intersection_type = intersection_type
        intersection.save()

        road_type_config, _ = RoadType.objects.get_or_create(intersection=intersection)
        road_type_config.road_type = road_type
        road_type_config.vertical_road_mode = vertical_road_mode
        road_type_config.horizontal_road_mode = horizontal_road_mode
        road_type_config.vertical_direction = vertical_direction
        road_type_config.horizontal_direction = horizontal_direction
        road_type_config.save()

        pedestrian_config, _ = Pedestrian.objects.get_or_create(intersection=intersection)
        pedestrian_config.north = True if north else False
        pedestrian_config.south = True if south else False
        pedestrian_config.east = True if east else False
        pedestrian_config.west = True if west else False
        pedestrian_config.save()

        return HttpResponseRedirect(reverse("index"))

    road_type_config = getattr(intersection, "road_type_config", None)
    pedestrian_config = getattr(intersection, "pedestrian_config", None)

    return render(request, "admin/update.html", {
        "intersection": intersection,
        "road_type_config": road_type_config,
        "pedestrian_config": pedestrian_config,
        "initial_form": {
            "road_type": road_type_config.road_type if road_type_config else "",
            "vertical_road_mode": road_type_config.vertical_road_mode if road_type_config else "",
            "horizontal_road_mode": road_type_config.horizontal_road_mode if road_type_config else "",
            "vertical_direction": road_type_config.vertical_direction if road_type_config else "",
            "horizontal_direction": road_type_config.horizontal_direction if road_type_config else "",
            "ped_north": "true" if pedestrian_config and pedestrian_config.north else "false",
            "ped_south": "true" if pedestrian_config and pedestrian_config.south else "false",
            "ped_east": "true" if pedestrian_config and pedestrian_config.east else "false",
            "ped_west": "true" if pedestrian_config and pedestrian_config.west else "false",
        },
    })