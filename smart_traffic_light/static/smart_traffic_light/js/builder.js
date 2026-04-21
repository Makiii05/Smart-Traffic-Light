document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");
    const canvas = document.getElementById("myCanvas");

    if (!form || !canvas || typeof window.createTrafficIntersectionRenderer !== "function") {
        return;
    }

    const saveButton = form.querySelector('button[type="submit"]');
    const roadName = document.getElementById("road_name");
    const intersectionType = document.getElementById("intersection_type");
    const roadType = document.getElementById("road_type");
    const verticalRoadType = document.getElementById("vertical_road_type");
    const horizontalRoadType = document.getElementById("horizontal_road_type");
    const verticalDirection = document.getElementById("vertical_direction");
    const horizontalDirection = document.getElementById("horizontal_direction");
    const pedestrianLaneOptions = document.getElementById("pedestrian_lane_options");

    if (!saveButton || !roadName || !intersectionType || !roadType || !verticalRoadType || !horizontalRoadType || !verticalDirection || !horizontalDirection || !pedestrianLaneOptions) {
        return;
    }

    const renderer = window.createTrafficIntersectionRenderer(canvas);
    const pedestrianCheckboxes = Array.from(pedestrianLaneOptions.querySelectorAll('input[type="checkbox"]'));
    const pedestrianLaneBySide = {
        north: form.querySelector('input[name="pedestrian_lane_north"]'),
        south: form.querySelector('input[name="pedestrian_lane_south"]'),
        east: form.querySelector('input[name="pedestrian_lane_east"]'),
        west: form.querySelector('input[name="pedestrian_lane_west"]'),
    };

    const selectFields = [
        intersectionType,
        roadType,
        verticalRoadType,
        horizontalRoadType,
        verticalDirection,
        horizontalDirection,
    ];

    const editMode = form.dataset.editMode === "true";

    function normalizeRoadType(value) {
        if (value === "mixed") {
            return "mix";
        }
        return value;
    }

    function resetSelect(select) {
        select.value = "";
        select.selectedIndex = 0;
    }

    function setSelectVisible(select, visible) {
        select.classList.toggle("hidden", !visible);
        select.disabled = !visible;
        select.required = visible;

        if (!visible && !editMode) {
            resetSelect(select);
        }
    }

    function setPedestrianVisible(visible) {
        pedestrianLaneOptions.classList.toggle("hidden", !visible);

        pedestrianCheckboxes.forEach((checkbox) => {
            checkbox.disabled = !visible;

            if (editMode && checkbox.dataset.ped === "True") {
                checkbox.checked = true;
            }

            if (!visible) {
                checkbox.checked = false;
            }
        });
    }

    function hideAllConditionalFields() {
        selectFields.forEach((select) => setSelectVisible(select, false));
        setPedestrianVisible(false);
    }

    function updateVisual() {
        renderer.render({
            intersectionType: intersectionType.value,
            roadType: normalizeRoadType(roadType.value),
            verticalRoadMode: verticalRoadType.value,
            horizontalRoadMode: horizontalRoadType.value,
            verticalDirection: verticalDirection.value,
            horizontalDirection: horizontalDirection.value,
            pedestrian: {
                north: Boolean(pedestrianLaneBySide.north?.checked),
                south: Boolean(pedestrianLaneBySide.south?.checked),
                east: Boolean(pedestrianLaneBySide.east?.checked),
                west: Boolean(pedestrianLaneBySide.west?.checked),
            },
        });
    }

    function updateForm(triggeredField = "") {
        if (!roadName.value.trim()) {
            hideAllConditionalFields();
            updateVisual();
            saveButton.disabled = true;
            return;
        }

        setSelectVisible(intersectionType, true);

        if (editMode && !intersectionType.value) {
            setSelectVisible(intersectionType, false);
            updateVisual();
            saveButton.disabled = !form.checkValidity();
            return;
        }

        if (intersectionType.value !== "cross_intersection") {
            setSelectVisible(roadType, false);
            setSelectVisible(verticalRoadType, false);
            setSelectVisible(horizontalRoadType, false);
            setSelectVisible(verticalDirection, false);
            setSelectVisible(horizontalDirection, false);
            setPedestrianVisible(false);
            updateVisual();
            saveButton.disabled = !form.checkValidity();
            return;
        }

        setSelectVisible(roadType, true);

        if (editMode && !roadType.value) {
            setSelectVisible(roadType, false);
            setSelectVisible(verticalRoadType, false);
            setSelectVisible(horizontalRoadType, false);
            setSelectVisible(verticalDirection, false);
            setSelectVisible(horizontalDirection, false);
            setPedestrianVisible(false);
            updateVisual();
            saveButton.disabled = !form.checkValidity();
            return;
        }

        const roadTypeValue = normalizeRoadType(roadType.value);

        if (roadTypeValue === "two_way") {
            setSelectVisible(verticalRoadType, false);
            setSelectVisible(horizontalRoadType, false);
            setSelectVisible(verticalDirection, false);
            setSelectVisible(horizontalDirection, false);
            setPedestrianVisible(true);
            updateVisual();
            saveButton.disabled = !form.checkValidity();
            return;
        }

        if (roadTypeValue === "one_way") {
            setSelectVisible(verticalRoadType, false);
            setSelectVisible(horizontalRoadType, false);
            setSelectVisible(verticalDirection, true);
            setSelectVisible(horizontalDirection, true);

            if (editMode && !verticalDirection.value) {
                setSelectVisible(verticalDirection, false);
            }
            if (editMode && !horizontalDirection.value) {
                setSelectVisible(horizontalDirection, false);
            }

            setPedestrianVisible(verticalDirection.value !== "" && horizontalDirection.value !== "");
            updateVisual();
            saveButton.disabled = !form.checkValidity();
            return;
        }

        if (roadTypeValue === "mix") {
            setSelectVisible(verticalRoadType, true);
            setSelectVisible(horizontalRoadType, true);

            if (editMode && !verticalRoadType.value) {
                setSelectVisible(verticalRoadType, false);
            }
            if (editMode && !horizontalRoadType.value) {
                setSelectVisible(horizontalRoadType, false);
            }

            if (triggeredField === "vertical_road_type" && verticalRoadType.value === "one_way") {
                horizontalRoadType.value = "two_way";
            } else if (triggeredField === "horizontal_road_type" && horizontalRoadType.value === "one_way") {
                verticalRoadType.value = "two_way";
            } else if (verticalRoadType.value === "one_way" && horizontalRoadType.value !== "two_way") {
                horizontalRoadType.value = "two_way";
            } else if (horizontalRoadType.value === "one_way" && verticalRoadType.value !== "two_way") {
                verticalRoadType.value = "two_way";
            }

            const verticalOneWay = verticalRoadType.value === "one_way";
            const horizontalOneWay = horizontalRoadType.value === "one_way";

            setSelectVisible(verticalDirection, verticalOneWay);
            setSelectVisible(horizontalDirection, horizontalOneWay);

            const pedestrianVisible = (verticalOneWay && verticalDirection.value !== "") || (horizontalOneWay && horizontalDirection.value !== "");
            setPedestrianVisible(pedestrianVisible);
            updateVisual();
            saveButton.disabled = !form.checkValidity();
            return;
        }

        setSelectVisible(verticalRoadType, false);
        setSelectVisible(horizontalRoadType, false);
        setSelectVisible(verticalDirection, false);
        setSelectVisible(horizontalDirection, false);
        setPedestrianVisible(false);
        updateVisual();
        saveButton.disabled = !form.checkValidity();
    }

    roadName.addEventListener("input", () => updateForm("road_name"));
    intersectionType.addEventListener("change", () => updateForm("intersection_type"));
    roadType.addEventListener("change", () => updateForm("road_type"));
    verticalRoadType.addEventListener("change", () => updateForm("vertical_road_type"));
    horizontalRoadType.addEventListener("change", () => updateForm("horizontal_road_type"));
    verticalDirection.addEventListener("change", () => updateForm("vertical_direction"));
    horizontalDirection.addEventListener("change", () => updateForm("horizontal_direction"));

    pedestrianCheckboxes.forEach((checkbox) => {
        checkbox.addEventListener("change", updateVisual);
    });

    window.addEventListener("resize", updateVisual);

    form.addEventListener("reset", () => {
        window.setTimeout(() => {
            updateForm("reset");
        }, 0);
    });

    hideAllConditionalFields();
    saveButton.disabled = true;
    updateForm(editMode ? "init" : "");
});
