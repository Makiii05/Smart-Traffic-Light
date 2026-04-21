document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form[data-controller-times-api-url]");
    const canvas = document.getElementById("myCanvas");
    const dataElement = document.getElementById("controller-data");
    const minTimerInput = document.getElementById("min_timer");
    const maxTimerInput = document.getElementById("max_timer");
    const timerPerVehicleInput = document.getElementById("timer_per_vehicle");
    const controllerTimesApiUrl = form?.dataset.controllerTimesApiUrl;

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

    async function onControllerTimesChange() {
        if (!controllerTimesApiUrl || !window.smartTrafficApi?.updateControllerTimes) {
            return;
        }

        if (!minTimerInput || !maxTimerInput || !timerPerVehicleInput) {
            return;
        }

        if (minTimerInput.value === "" || maxTimerInput.value === "" || timerPerVehicleInput.value === "") {
            return;
        }

        try {
            await window.smartTrafficApi.updateControllerTimes(controllerTimesApiUrl, {
                min_time: Number(minTimerInput.value),
                max_time: Number(maxTimerInput.value),
                time_per_vehicle: Number(timerPerVehicleInput.value),
            });
        } catch (error) {
            console.error(error);
        }
    }

    drawVisual();
    window.addEventListener("resize", drawVisual);

    [minTimerInput, maxTimerInput, timerPerVehicleInput]
        .filter(Boolean)
        .forEach((input) => {
            input.addEventListener("change", onControllerTimesChange);
        });
});
