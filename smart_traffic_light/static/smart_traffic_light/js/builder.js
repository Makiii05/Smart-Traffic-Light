document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");
    const canvas = document.getElementById("myCanvas");

    if (!form || !canvas) {
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

    const pedestrianCheckboxes = Array.from(pedestrianLaneOptions.querySelectorAll('input[type="checkbox"]'));
    const pedestrianLaneBySide = {
        north: form.querySelector('input[name="pedestrian_lane_north"]'),
        south: form.querySelector('input[name="pedestrian_lane_south"]'),
        east: form.querySelector('input[name="pedestrian_lane_east"]'),
        west: form.querySelector('input[name="pedestrian_lane_west"]'),
    };

    const ctx = canvas.getContext("2d");
    let w = 0;
    let h = 0;

    function resizeCanvasToDisplaySize() {
        const { clientWidth, clientHeight } = canvas;
        if (clientWidth === 0 || clientHeight === 0) {
            return;
        }

        const dpr = window.devicePixelRatio || 1;
        const displayWidth = Math.floor(clientWidth * dpr);
        const displayHeight = Math.floor(clientHeight * dpr);

        if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
            canvas.width = displayWidth;
            canvas.height = displayHeight;
        }

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        w = clientWidth;
        h = clientHeight;
    }

    const ROAD_HALF = 50;

    const selectFields = [
        intersectionType,
        roadType,
        verticalRoadType,
        horizontalRoadType,
        verticalDirection,
        horizontalDirection,
    ];

    const editMode = form.dataset.editMode === "true";

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

    function getArrowLayout() {
        const cx = w / 2;
        const cy = h / 2;
        const margin = 10;

        const crosswalkOffsetX = Math.max(12, w * 0.05) + 10;
        const crosswalkOffsetY = Math.max(12, h * 0.05) + 10;

        const availableLenX = Math.max(10, cx - ROAD_HALF - margin - crosswalkOffsetX);
        const availableLenY = Math.max(10, cy - ROAD_HALF - margin - crosswalkOffsetY);
        const arrowLength = Math.min(100, availableLenX, availableLenY);
        const arrowWidth = 20;

        const vLaneLeftX = cx - ROAD_HALF - arrowWidth * 1.5;
        const vLaneRightX = cx + ROAD_HALF + arrowWidth * 0.5;

        const hLaneTopY = cy - ROAD_HALF - arrowWidth * 1.5;
        const hLaneBottomY = cy + ROAD_HALF + arrowWidth * 0.5;

        const vNorthY = cy - ROAD_HALF - crosswalkOffsetY - arrowLength * 1.2;
        const vSouthY = cy + ROAD_HALF + crosswalkOffsetY * 1.2;

        const hWestX = cx - ROAD_HALF - crosswalkOffsetX - arrowLength * 1.2;
        const hEastX = cx + ROAD_HALF + crosswalkOffsetX * 1.2;

        return {
            cx,
            cy,
            arrowLength,
            arrowWidth,
            vLaneLeftX,
            vLaneRightX,
            hLaneTopY,
            hLaneBottomY,
            vNorthY,
            vSouthY,
            hWestX,
            hEastX,
        };
    }

    function drawCrossRoadBase() {
        ctx.fillStyle = "#555";
        ctx.fillRect(w / 2 - ROAD_HALF, 0, ROAD_HALF * 2, h);
        ctx.fillRect(0, h / 2 - ROAD_HALF, w, ROAD_HALF * 2);
    }

    function drawLaneMarkings() {
        ctx.fillStyle = "#FFFFFF";
        for (let i = 0; i < 5; i++) {
            ctx.fillRect(w / 2 - 5, h * 0.1 * i * 2.25, 10, h * 0.1);
            ctx.fillRect(w * 0.1 * i * 2.25, h / 2 - 5, w * 0.1, 10);
        }
    }

    function drawPedestrianLane(side) {
        ctx.fillStyle = "#FFFFFF";

        if (side === "north") {
            for (let i = 0; i < 10; i++) {
                ctx.fillRect(w / 2 - ROAD_HALF + 10 * i, h / 2 - h * 0.05 - ROAD_HALF, 5, h * 0.05);
            }
            return;
        }

        if (side === "south") {
            for (let i = 0; i < 10; i++) {
                ctx.fillRect(w / 2 - (ROAD_HALF - 5) + 10 * i, h / 2 + ROAD_HALF, 5, h * 0.05);
            }
            return;
        }

        if (side === "east") {
            for (let i = 0; i < 10; i++) {
                ctx.fillRect(w / 2 - w * 0.05 - ROAD_HALF, h / 2 + (ROAD_HALF - 5) - 10 * i, w * 0.05, 5);
            }
            return;
        }

        if (side === "west") {
            for (let i = 0; i < 10; i++) {
                ctx.fillRect(w / 2 + ROAD_HALF, h / 2 - ROAD_HALF + 10 * i, w * 0.05, 5);
            }
        }
    }

    function drawCheckedPedestrianLanes() {
        if (pedestrianLaneBySide.north?.checked) {
            drawPedestrianLane("north");
        }
        if (pedestrianLaneBySide.south?.checked) {
            drawPedestrianLane("south");
        }
        if (pedestrianLaneBySide.east?.checked) {
            drawPedestrianLane("east");
        }
        if (pedestrianLaneBySide.west?.checked) {
            drawPedestrianLane("west");
        }
    }

    function getVerticalArrowDirection() {
        if (verticalDirection.value === "north_to_south") {
            return "south";
        }
        if (verticalDirection.value === "south_to_north") {
            return "north";
        }
        return "";
    }

    function getHorizontalArrowDirection() {
        if (horizontalDirection.value === "east_to_west") {
            return "west";
        }
        if (horizontalDirection.value === "west_to_east") {
            return "east";
        }
        return "";
    }

    function drawTwoWayVerticalArrows() {
        const layout = getArrowLayout();
        ctx.fillStyle = "#555fff";
        drawArrow(ctx, layout.vLaneRightX, layout.vNorthY, "north", layout.arrowLength, layout.arrowWidth);
        drawArrow(ctx, layout.vLaneLeftX, layout.vNorthY, "south", layout.arrowLength, layout.arrowWidth);
        drawArrow(ctx, layout.vLaneRightX, layout.vSouthY, "north", layout.arrowLength, layout.arrowWidth);
        drawArrow(ctx, layout.vLaneLeftX, layout.vSouthY, "south", layout.arrowLength, layout.arrowWidth);
    }

    function drawTwoWayHorizontalArrows() {
        const layout = getArrowLayout();
        ctx.fillStyle = "#555fff";
        drawArrow(ctx, layout.hEastX, layout.hLaneBottomY, "east", layout.arrowLength, layout.arrowWidth);
        drawArrow(ctx, layout.hEastX, layout.hLaneTopY, "west", layout.arrowLength, layout.arrowWidth);
        drawArrow(ctx, layout.hWestX, layout.hLaneTopY, "west", layout.arrowLength, layout.arrowWidth);
        drawArrow(ctx, layout.hWestX, layout.hLaneBottomY, "east", layout.arrowLength, layout.arrowWidth);
    }

    function drawTwoWayArrows() {
        drawTwoWayVerticalArrows();
        drawTwoWayHorizontalArrows();
    }

    function drawVerticalOneWayArrows(direction) {
        const layout = getArrowLayout();
        ctx.fillStyle = "#555fff";
        drawArrow(ctx, layout.vLaneLeftX, layout.vNorthY, direction, layout.arrowLength, layout.arrowWidth);
        drawArrow(ctx, layout.vLaneRightX, layout.vNorthY, direction, layout.arrowLength, layout.arrowWidth);
        drawArrow(ctx, layout.vLaneLeftX, layout.vSouthY, direction, layout.arrowLength, layout.arrowWidth);
        drawArrow(ctx, layout.vLaneRightX, layout.vSouthY, direction, layout.arrowLength, layout.arrowWidth);
    }

    function drawHorizontalOneWayArrows(direction) {
        const layout = getArrowLayout();
        ctx.fillStyle = "#555fff";
        drawArrow(ctx, layout.hEastX, layout.hLaneTopY, direction, layout.arrowLength, layout.arrowWidth);
        drawArrow(ctx, layout.hEastX, layout.hLaneBottomY, direction, layout.arrowLength, layout.arrowWidth);
        drawArrow(ctx, layout.hWestX, layout.hLaneTopY, direction, layout.arrowLength, layout.arrowWidth);
        drawArrow(ctx, layout.hWestX, layout.hLaneBottomY, direction, layout.arrowLength, layout.arrowWidth);
    }

    function drawMixArrows() {
        const verticalType = verticalRoadType.value;
        const horizontalType = horizontalRoadType.value;

        if (verticalType === "two_way") {
            drawTwoWayVerticalArrows();
        } else if (verticalType === "one_way") {
            const direction = getVerticalArrowDirection();
            if (direction) {
                drawVerticalOneWayArrows(direction);
            }
        }

        if (horizontalType === "two_way") {
            drawTwoWayHorizontalArrows();
        } else if (horizontalType === "one_way") {
            const direction = getHorizontalArrowDirection();
            if (direction) {
                drawHorizontalOneWayArrows(direction);
            }
        }
    }

    function drawCenter() {
        ctx.fillStyle = "#555";
        ctx.fillRect(w / 2 - ROAD_HALF, h / 2 - ROAD_HALF, ROAD_HALF * 2, ROAD_HALF * 2);
    }

    function updateVisual() {
        resizeCanvasToDisplaySize();
        if (w === 0 || h === 0) {
            return;
        }

        ctx.clearRect(0, 0, w, h);

        if (intersectionType.value !== "cross_intersection") {
            return;
        }

        drawCrossRoadBase();
        drawLaneMarkings();
        drawCheckedPedestrianLanes();

        const roadTypeValue = roadType.value;

        if (roadTypeValue === "two_way") {
            drawTwoWayArrows();
        } else if (roadTypeValue === "one_way") {
            if (verticalDirection.value !== "" && horizontalDirection.value !== "") {
                const verticalArrowDir = getVerticalArrowDirection();
                const horizontalArrowDir = getHorizontalArrowDirection();
                if (verticalArrowDir && horizontalArrowDir) {
                    drawVerticalOneWayArrows(verticalArrowDir);
                    drawHorizontalOneWayArrows(horizontalArrowDir);
                }
            }
        } else if (roadTypeValue === "mix") {
            if (verticalRoadType.value !== "" && horizontalRoadType.value !== "") {
                drawMixArrows();
            }
        }

        drawCenter();
    }

    function drawArrow(ctx2d, x, y, direction, length = 100, width = 20) {
        const headSize = 20;
        ctx2d.beginPath();

        if (direction === "north") {
            ctx2d.moveTo(x, y + length);
            ctx2d.lineTo(x + width, y + length);
            ctx2d.lineTo(x + width, y + headSize);
            ctx2d.lineTo(x + width * 1.5, y + headSize);
            ctx2d.lineTo(x + width / 2, y);
            ctx2d.lineTo(x - width * 0.5, y + headSize);
            ctx2d.lineTo(x, y + headSize);
        } else if (direction === "south") {
            ctx2d.moveTo(x, y);
            ctx2d.lineTo(x + width, y);
            ctx2d.lineTo(x + width, y + length - headSize);
            ctx2d.lineTo(x + width * 1.5, y + length - headSize);
            ctx2d.lineTo(x + width / 2, y + length);
            ctx2d.lineTo(x - width * 0.5, y + length - headSize);
            ctx2d.lineTo(x, y + length - headSize);
        } else if (direction === "east") {
            ctx2d.moveTo(x, y);
            ctx2d.lineTo(x, y + width);
            ctx2d.lineTo(x + length - headSize, y + width);
            ctx2d.lineTo(x + length - headSize, y + width * 1.5);
            ctx2d.lineTo(x + length, y + width / 2);
            ctx2d.lineTo(x + length - headSize, y - width * 0.5);
            ctx2d.lineTo(x + length - headSize, y);
        } else if (direction === "west") {
            ctx2d.moveTo(x + length, y);
            ctx2d.lineTo(x + length, y + width);
            ctx2d.lineTo(x + headSize, y + width);
            ctx2d.lineTo(x + headSize, y + width * 1.5);
            ctx2d.lineTo(x, y + width / 2);
            ctx2d.lineTo(x + headSize, y - width * 0.5);
            ctx2d.lineTo(x + headSize, y);
        }

        ctx2d.closePath();
        ctx2d.fill();
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

        const roadTypeValue = roadType.value;

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
        checkbox.addEventListener("change", () => {
            updateVisual();
        });
    });

    window.addEventListener("resize", () => {
        updateVisual();
    });

    form.addEventListener("reset", () => {
        window.setTimeout(() => {
            updateForm("reset");
        }, 0);
    });

    hideAllConditionalFields();
    saveButton.disabled = true;
    updateForm(editMode ? "init" : "");
});
