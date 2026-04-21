document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("myCanvas");
    const dataElement = document.getElementById("controller-data");

    if (!canvas || !dataElement || typeof window.createTrafficIntersectionRenderer !== "function") {
        return;
    }

    const controllerData = JSON.parse(dataElement.textContent || "{}");
    const renderer = window.createTrafficIntersectionRenderer(canvas);

    function normalizeRoadType(value) {
        if (value === "mixed") {
            return "mix";
        }
        return value || "";
    }

    function drawVisual() {
        renderer.render({
            intersectionType: controllerData.intersection_type || "",
            roadType: normalizeRoadType(controllerData.road_type),
            verticalRoadMode: controllerData.vertical_road_mode || "",
            horizontalRoadMode: controllerData.horizontal_road_mode || "",
            verticalDirection: controllerData.vertical_direction || "",
            horizontalDirection: controllerData.horizontal_direction || "",
            pedestrian: {
                north: Boolean(controllerData.pedestrian?.north),
                south: Boolean(controllerData.pedestrian?.south),
                east: Boolean(controllerData.pedestrian?.east),
                west: Boolean(controllerData.pedestrian?.west),
            },
        });
    }

    drawVisual();
    window.addEventListener("resize", drawVisual);
});
