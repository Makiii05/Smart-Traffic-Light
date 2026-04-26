import json

from django.shortcuts import render
from django.http import HttpResponseRedirect, JsonResponse
from django.urls import reverse
from .models import Intersection, RoadType, Pedestrian, ControllerTimes, ControllerRoi

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
    controller_times, _ = ControllerTimes.objects.get_or_create(
        intersection=intersection,
        defaults={
            "min_time": 0,
            "max_time": 0,
            "time_per_vehicle": 0.0,
        },
    )
    controller_roi, _ = ControllerRoi.objects.get_or_create(intersection=intersection)
    road_type_config = getattr(intersection, "road_type_config", None)
    pedestrian_config = getattr(intersection, "pedestrian_config", None)

    controller_data = {
        "id": intersection.id,
        "name": intersection.name,
        "intersection_type": intersection.intersection_type,
        "intersection_type_display": intersection.get_intersection_type_display(),
        "road_type": road_type_config.road_type if road_type_config else "",
        "road_type_display": road_type_config.get_road_type_display() if road_type_config else "",
        "vertical_road_mode": road_type_config.vertical_road_mode if road_type_config else "",
        "horizontal_road_mode": road_type_config.horizontal_road_mode if road_type_config else "",
        "vertical_direction": road_type_config.vertical_direction if road_type_config else "",
        "horizontal_direction": road_type_config.horizontal_direction if road_type_config else "",
        "pedestrian": {
            "north": bool(pedestrian_config and pedestrian_config.north),
            "south": bool(pedestrian_config and pedestrian_config.south),
            "east": bool(pedestrian_config and pedestrian_config.east),
            "west": bool(pedestrian_config and pedestrian_config.west),
        },
        "controller_times": {
            "min_time": controller_times.min_time,
            "max_time": controller_times.max_time,
            "time_per_vehicle": controller_times.time_per_vehicle,
        },
        "controller_roi": {
            "north_roi": controller_roi.north_roi,
            "south_roi": controller_roi.south_roi,
            "east_roi": controller_roi.east_roi,
            "west_roi": controller_roi.west_roi,
            "north_camera": controller_roi.north_camera,
            "south_camera": controller_roi.south_camera,
            "east_camera": controller_roi.east_camera,
            "west_camera": controller_roi.west_camera,
        },
    }
    
    return render(request, "admin/controller.html", {
        "intersection": intersection,
        "controller_data": controller_data,
        "controller_times_api_url": reverse("update_controller_times_api", args=[intersection.id]),
        "roi_picker_api_url": reverse("select_roi_api", args=[intersection.id]),
        "controller_roi_api_url": reverse("update_controller_roi_api", args=[intersection.id]),
        "start_preview_api_url": reverse("start_controller_preview_api", args=[intersection.id]),
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
        ControllerTimes.objects.create(
            intersection=intersection,
            min_time=0,
            max_time=0,
            time_per_vehicle=0.0
        )
        ControllerRoi.objects.create(intersection=intersection)
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


def update_controller_times_api(request, road_id):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        intersection = Intersection.objects.get(id=road_id)
    except Intersection.DoesNotExist:
        return JsonResponse({"error": "Intersection not found"}, status=404)

    try:
        payload = json.loads(request.body.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({"error": "Invalid JSON payload"}, status=400)

    try:
        min_time = int(payload.get("min_time", 0))
        max_time = int(payload.get("max_time", 0))
        time_per_vehicle = float(payload.get("time_per_vehicle", 0))
    except (TypeError, ValueError):
        return JsonResponse({"error": "Timer values must be numeric"}, status=400)

    controller_times, _ = ControllerTimes.objects.get_or_create(
        intersection=intersection,
        defaults={
            "min_time": 0,
            "max_time": 0,
            "time_per_vehicle": 0.0,
        },
    )

    controller_times.min_time = min_time
    controller_times.max_time = max_time
    controller_times.time_per_vehicle = time_per_vehicle
    controller_times.save()

    return JsonResponse(
        {
            "ok": True,
            "controller_times": {
                "min_time": controller_times.min_time,
                "max_time": controller_times.max_time,
                "time_per_vehicle": controller_times.time_per_vehicle,
            },
        }
    )


def update_controller_roi_api(request, road_id):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        intersection = Intersection.objects.get(id=road_id)
    except Intersection.DoesNotExist:
        return JsonResponse({"error": "Intersection not found"}, status=404)

    try:
        payload = json.loads(request.body.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({"error": "Invalid JSON payload"}, status=400)

    side = str(payload.get("side", "")).strip().lower()
    valid_sides = {"north", "south", "east", "west"}
    if side not in valid_sides:
        return JsonResponse({"error": "Invalid side"}, status=400)

    raw_camera_id = payload.get("camera_id")
    if raw_camera_id in ("", None):
        camera_id = None
    else:
        camera_id = str(raw_camera_id).strip()
        if camera_id == "":
            camera_id = None

    roi_points = payload.get("roi_points")
    if roi_points in ("", None):
        roi_points = None
    else:
        if not isinstance(roi_points, list) or len(roi_points) != 4:
            return JsonResponse({"error": "ROI points must contain exactly 4 points"}, status=400)

        normalized_points = []
        for point in roi_points:
            if not isinstance(point, (list, tuple)) or len(point) != 2:
                return JsonResponse({"error": "Each ROI point must be [x, y]"}, status=400)

            try:
                normalized_points.append([int(point[0]), int(point[1])])
            except (TypeError, ValueError):
                return JsonResponse({"error": "ROI point coordinates must be numeric"}, status=400)

        roi_points = normalized_points

    controller_roi, _ = ControllerRoi.objects.get_or_create(intersection=intersection)

    roi_field = f"{side}_roi"
    camera_field = f"{side}_camera"

    setattr(controller_roi, roi_field, roi_points)
    setattr(controller_roi, camera_field, camera_id)
    controller_roi.save(update_fields=[roi_field, camera_field, "updated_at"])

    return JsonResponse(
        {
            "ok": True,
            "side": side,
            "controller_roi": {
                "camera_id": getattr(controller_roi, camera_field),
                "roi_points": getattr(controller_roi, roi_field),
            },
        }
    )


def start_controller_preview_api(request, road_id):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        intersection = Intersection.objects.get(id=road_id)
    except Intersection.DoesNotExist:
        return JsonResponse({"error": "Intersection not found"}, status=404)

    try:
        payload = json.loads(request.body.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({"error": "Invalid JSON payload"}, status=400)

    raw_cameras = payload.get("cameras")
    if not isinstance(raw_cameras, list) or not (1 <= len(raw_cameras) <= 4):
        return JsonResponse({"error": "Cameras payload must contain 1 to 4 camera entries"}, status=400)

    valid_sides = {"north", "south", "east", "west"}
    normalized_cameras = []
    seen_sides = set()

    for item in raw_cameras:
        if not isinstance(item, dict):
            return JsonResponse({"error": "Each camera entry must be an object"}, status=400)

        side = str(item.get("side", "")).strip().lower()
        if side not in valid_sides:
            return JsonResponse({"error": "Camera side must be north, south, east, or west"}, status=400)

        if side in seen_sides:
            return JsonResponse({"error": "Duplicate camera side is not allowed"}, status=400)
        seen_sides.add(side)

        try:
            camera_index = int(item.get("camera_index"))
        except (TypeError, ValueError):
            return JsonResponse({"error": "Camera index must be numeric"}, status=400)

        label = str(item.get("label") or side.title()).strip() or side.title()
        normalized_cameras.append(
            {
                "side": side,
                "label": label,
                "camera_index": camera_index,
            }
        )

    try:
        import cv2
        import numpy as np
    except ImportError:
        return JsonResponse({"error": "OpenCV dependencies are not installed"}, status=500)

    if len(normalized_cameras) == 1:
        grid_rows, grid_cols = 1, 1
    elif len(normalized_cameras) == 2:
        grid_rows, grid_cols = 1, 2
    else:
        grid_rows, grid_cols = 2, 2

    tile_width = 640
    tile_height = 360
    window_name = f"Controller Preview - {intersection.name}"
    captures = []

    try:
        for camera in normalized_cameras:
            camera_index = camera["camera_index"]
            cap = cv2.VideoCapture(camera_index, cv2.CAP_DSHOW)
            if not cap.isOpened():
                cap = cv2.VideoCapture(camera_index)

            if not cap.isOpened():
                return JsonResponse({"error": f"Unable to open camera index {camera_index}"}, status=400)

            captures.append(cap)

        cv2.namedWindow(window_name)

        while True:
            tiles = []

            for camera, cap in zip(normalized_cameras, captures):
                ok, frame = cap.read()

                if ok:
                    tile = cv2.resize(frame, (tile_width, tile_height))
                else:
                    tile = np.zeros((tile_height, tile_width, 3), dtype=np.uint8)
                    cv2.putText(
                        tile,
                        "Camera feed unavailable",
                        (24, tile_height // 2),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.8,
                        (0, 0, 255),
                        2,
                    )

                cv2.rectangle(tile, (0, 0), (tile_width - 1, tile_height - 1), (255, 255, 255), 2)
                cv2.putText(
                    tile,
                    camera["label"],
                    (16, 32),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.9,
                    (255, 255, 255),
                    2,
                )
                cv2.putText(
                    tile,
                    f"Cam {camera['camera_index']}",
                    (16, 64),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.75,
                    (255, 255, 255),
                    2,
                )
                tiles.append(tile)

            total_tiles = grid_rows * grid_cols
            while len(tiles) < total_tiles:
                placeholder = np.zeros((tile_height, tile_width, 3), dtype=np.uint8)
                cv2.putText(
                    placeholder,
                    "Unused",
                    (tile_width // 2 - 70, tile_height // 2),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1.0,
                    (150, 150, 150),
                    2,
                )
                tiles.append(placeholder)

            row_frames = []
            for row_index in range(grid_rows):
                row_tiles = tiles[row_index * grid_cols:(row_index + 1) * grid_cols]
                row_frames.append(np.hstack(row_tiles))

            preview_frame = np.vstack(row_frames)
            cv2.putText(
                preview_frame,
                "Press Q or ESC to close preview",
                (20, preview_frame.shape[0] - 20),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (255, 255, 255),
                2,
            )

            cv2.imshow(window_name, preview_frame)

            key = cv2.waitKey(1) & 0xFF
            if key in (ord("q"), 27):
                break

            if cv2.getWindowProperty(window_name, cv2.WND_PROP_VISIBLE) < 1:
                break
    finally:
        for cap in captures:
            cap.release()

        try:
            cv2.destroyWindow(window_name)
        except Exception:
            pass

    return JsonResponse({"ok": True, "camera_count": len(normalized_cameras)})


def select_roi_api(request, road_id):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        Intersection.objects.get(id=road_id)
    except Intersection.DoesNotExist:
        return JsonResponse({"error": "Intersection not found"}, status=404)

    try:
        payload = json.loads(request.body.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({"error": "Invalid JSON payload"}, status=400)

    try:
        camera_index = int(payload.get("camera_index", 0))
    except (TypeError, ValueError):
        return JsonResponse({"error": "Invalid camera index"}, status=400)

    try:
        import cv2
    except ImportError:
        return JsonResponse({"error": "OpenCV is not installed"}, status=500)

    window_name = f"ROI Picker - Camera {camera_index}"
    points = []
    read_failed = False

    def on_mouse(event, x, y, flags, param):
        if event == cv2.EVENT_LBUTTONDOWN and len(points) < 4:
            points.append([int(x), int(y)])

    cap = cv2.VideoCapture(camera_index, cv2.CAP_DSHOW)
    if not cap.isOpened():
        cap = cv2.VideoCapture(camera_index)

    if not cap.isOpened():
        return JsonResponse({"error": "Unable to open selected camera"}, status=400)

    try:
        cv2.namedWindow(window_name)
        cv2.setMouseCallback(window_name, on_mouse)

        while True:
            ok, frame = cap.read()
            if not ok:
                read_failed = True
                break

            preview = frame.copy()

            for index, point in enumerate(points):
                cv2.circle(preview, tuple(point), 6, (0, 255, 0), -1)
                cv2.putText(
                    preview,
                    str(index + 1),
                    (point[0] + 8, point[1] - 8),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    (0, 255, 0),
                    2,
                )

            if len(points) > 1:
                for idx in range(len(points) - 1):
                    cv2.line(preview, tuple(points[idx]), tuple(points[idx + 1]), (0, 255, 255), 2)

            cv2.putText(
                preview,
                "Click 4 ROI points. Press Q or ESC to cancel.",
                (10, 28),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (255, 255, 255),
                2,
            )
            cv2.imshow(window_name, preview)

            if len(points) == 4:
                break

            key = cv2.waitKey(1) & 0xFF
            if key == ord("q") or key == 27:
                break

            if cv2.getWindowProperty(window_name, cv2.WND_PROP_VISIBLE) < 1:
                break
    finally:
        cap.release()
        try:
            cv2.destroyWindow(window_name)
        except cv2.error:
            pass

    if read_failed:
        return JsonResponse({"error": "Failed to read frames from camera"}, status=400)

    if len(points) != 4:
        return JsonResponse({"error": "ROI selection cancelled or incomplete"}, status=400)

    return JsonResponse({"ok": True, "roi_points": points})