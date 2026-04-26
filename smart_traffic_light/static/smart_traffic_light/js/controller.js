document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form[data-controller-times-api-url]");
    const canvas = document.getElementById("myCanvas");
    const dataElement = document.getElementById("controller-data");
    const cameraCards = Array.from(document.querySelectorAll("[data-camera-card]"));
    const cameraSelects = Array.from(document.querySelectorAll(".cameraSelect"));
    const startButton = document.getElementById("start_button");
    const minTimerInput = document.getElementById("min_timer");
    const maxTimerInput = document.getElementById("max_timer");
    const timerPerVehicleInput = document.getElementById("timer_per_vehicle");
    const timerInputs = Array.from(document.querySelectorAll("[data-timer-input]"));
    const timerLoadingIndicators = Array.from(document.querySelectorAll("[data-timer-loading]"));
    const controllerTimesApiUrl = form?.dataset.controllerTimesApiUrl;
    const roiPickerApiUrl = form?.dataset.roiPickerApiUrl;
    const controllerRoiApiUrl = form?.dataset.controllerRoiApiUrl;
    const startPreviewApiUrl = form?.dataset.startPreviewApiUrl;

    if (!canvas || !dataElement || typeof window.createTrafficIntersectionRenderer !== "function") {
        return;
    }

    const controllerData = JSON.parse(dataElement.textContent || "{}");
    const initialControllerRoi = controllerData.controller_roi || {};
    const renderer = window.createTrafficIntersectionRenderer(canvas);
    let timerRequestCount = 0;
    let startRequestCount = 0;
    const cameraCardRequestCounts = new WeakMap();
    const roiButtonRequestCounts = new WeakMap();

    function getRoiButtonBaseLabel(roiButton) {
        const hasRoi = Boolean(readRoiPointsFromButton(roiButton));
        return hasRoi ? "Reset Roi" : "Set ROI";
    }

    function setTimerControlsLoading(isLoading) {
        timerInputs.forEach((input) => {
            input.disabled = isLoading;
            input.classList.toggle("animate-pulse", isLoading);
        });

        timerLoadingIndicators.forEach((indicator) => {
            indicator.classList.toggle("hidden", !isLoading);
        });
    }

    function beginTimerRequest() {
        timerRequestCount += 1;
        setTimerControlsLoading(true);
    }

    function endTimerRequest() {
        timerRequestCount = Math.max(0, timerRequestCount - 1);
        if (timerRequestCount === 0) {
            setTimerControlsLoading(false);
        }
    }

    function setStartButtonLoading(isLoading) {
        if (!startButton) {
            return;
        }

        if (isLoading) {
            startButton.disabled = true;
            startButton.innerHTML = '<span class="loading loading-spinner loading-xs"></span> Opening preview...';
            return;
        }

        startButton.textContent = "Start";
    }

    function beginStartRequest() {
        startRequestCount += 1;
        setStartButtonLoading(true);
    }

    function endStartRequest() {
        startRequestCount = Math.max(0, startRequestCount - 1);
        if (startRequestCount === 0) {
            setStartButtonLoading(false);
        }
    }

    function beginCameraCardRequest(card) {
        const nextCount = (cameraCardRequestCounts.get(card) || 0) + 1;
        cameraCardRequestCounts.set(card, nextCount);

        const select = getCameraSelect(card);
        const loadingIndicator = getCameraLoadingIndicator(card);
        if (select) {
            select.disabled = true;
            select.classList.add("animate-pulse");
        }
        if (loadingIndicator) {
            loadingIndicator.classList.remove("hidden");
        }
    }

    function endCameraCardRequest(card) {
        const nextCount = Math.max(0, (cameraCardRequestCounts.get(card) || 0) - 1);
        cameraCardRequestCounts.set(card, nextCount);
        if (nextCount > 0) {
            return;
        }

        const select = getCameraSelect(card);
        const loadingIndicator = getCameraLoadingIndicator(card);
        if (select) {
            const isVisible = !card.classList.contains("hidden");
            select.disabled = !isVisible;
            select.classList.remove("animate-pulse");
        }
        if (loadingIndicator) {
            loadingIndicator.classList.add("hidden");
        }
    }

    function beginRoiButtonRequest(roiButton, loadingText) {
        const currentCount = roiButtonRequestCounts.get(roiButton) || 0;
        if (currentCount === 0) {
            roiButton.innerHTML = `<span class="loading loading-spinner loading-xs"></span> ${loadingText}`;
            roiButton.disabled = true;
        }

        roiButtonRequestCounts.set(roiButton, currentCount + 1);
    }

    function endRoiButtonRequest(card, roiButton) {
        const nextCount = Math.max(0, (roiButtonRequestCounts.get(roiButton) || 0) - 1);
        roiButtonRequestCounts.set(roiButton, nextCount);

        if (nextCount > 0) {
            return;
        }

        roiButton.textContent = getRoiButtonBaseLabel(roiButton);
        const select = getCameraSelect(card);
        const isVisible = !card.classList.contains("hidden");
        roiButton.disabled = !(isVisible && select && select.value);
    }

    function normalizeRoadType(value) {
        if (value === "mixed") {
            return "mix";
        }
        return value || "";
    }

    function isDirectionNA(direction) {
        const normalized = String(direction || "").toLowerCase();
        return normalized === "" || normalized === "auto" || normalized === "n/a" || normalized === "na";
    }

    function getVerticalOneWaySide(direction) {
        if (direction === "north_to_south") {
            return "north";
        }
        if (direction === "south_to_north") {
            return "south";
        }
        return "";
    }

    function getHorizontalOneWaySide(direction) {
        if (direction === "east_to_west") {
            return "east";
        }
        if (direction === "west_to_east") {
            return "west";
        }
        return "";
    }

    function addVerticalSides(setRef, mode, direction) {
        if (mode === "two_way" || isDirectionNA(direction)) {
            setRef.add("north");
            setRef.add("south");
            return;
        }

        const side = getVerticalOneWaySide(direction);
        if (side) {
            setRef.add(side);
        }
    }

    function addHorizontalSides(setRef, mode, direction) {
        if (mode === "two_way" || isDirectionNA(direction)) {
            setRef.add("east");
            setRef.add("west");
            return;
        }

        const side = getHorizontalOneWaySide(direction);
        if (side) {
            setRef.add(side);
        }
    }

    function getVisibleCameraSides() {
        const visibleSides = new Set();
        const roadType = normalizeRoadType(controllerData.road_type);
        const verticalRoadMode = controllerData.vertical_road_mode || "";
        const horizontalRoadMode = controllerData.horizontal_road_mode || "";
        const verticalDirection = controllerData.vertical_direction || "";
        const horizontalDirection = controllerData.horizontal_direction || "";

        if (roadType === "two_way") {
            visibleSides.add("north");
            visibleSides.add("south");
            visibleSides.add("east");
            visibleSides.add("west");
            return visibleSides;
        }

        if (roadType === "one_way") {
            const verticalSide = getVerticalOneWaySide(verticalDirection);
            const horizontalSide = getHorizontalOneWaySide(horizontalDirection);

            if (verticalSide) {
                visibleSides.add(verticalSide);
            }
            if (horizontalSide) {
                visibleSides.add(horizontalSide);
            }
            return visibleSides;
        }

        if (roadType === "mix") {
            addVerticalSides(visibleSides, verticalRoadMode, verticalDirection);
            addHorizontalSides(visibleSides, horizontalRoadMode, horizontalDirection);
            return visibleSides;
        }

        return visibleSides;
    }

    function getRoiButton(card) {
        return card.querySelector("[data-roi-button]");
    }

    function getCameraSelect(card) {
        return card.querySelector(".cameraSelect");
    }

    function getCameraLoadingIndicator(card) {
        return card.querySelector("[data-camera-loading]");
    }

    function getVisibleCameraCards() {
        return cameraCards.filter((card) => !card.classList.contains("hidden"));
    }

    function getSavedCameraValue(side) {
        const cameraValue = initialControllerRoi[`${side}_camera`];

        if (typeof cameraValue === "string") {
            return cameraValue.trim();
        }

        if (cameraValue === 0 || cameraValue) {
            return String(cameraValue);
        }

        return "";
    }

    function formatCameraIdForLabel(cameraId) {
        if (!cameraId) {
            return "";
        }

        if (cameraId.length <= 18) {
            return cameraId;
        }

        return `${cameraId.slice(0, 8)}...${cameraId.slice(-6)}`;
    }

    function getSideDisplayLabel(side) {
        const normalizedSide = String(side || "").toLowerCase();
        if (!normalizedSide) {
            return "Camera";
        }

        return `${normalizedSide.charAt(0).toUpperCase()}${normalizedSide.slice(1)} Direction`;
    }

    function getSavedRoiValue(side) {
        const roiValue = initialControllerRoi[`${side}_roi`];

        if (Array.isArray(roiValue) && roiValue.length === 4) {
            return JSON.stringify(roiValue);
        }

        return "";
    }

    function parseRoiValue(value) {
        if (!value) {
            return null;
        }

        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed) && parsed.length === 4) {
                return parsed;
            }
        } catch (error) {
            return null;
        }

        return null;
    }

    function readRoiPointsFromButton(roiButton) {
        const roiValue = String(roiButton?.dataset.roiValue || "").trim();
        return parseRoiValue(roiValue);
    }

    function setRoiButtonLabel(roiButton) {
        if ((roiButtonRequestCounts.get(roiButton) || 0) > 0) {
            return;
        }

        roiButton.textContent = getRoiButtonBaseLabel(roiButton);
    }

    function getSelectedCameraIndex(select) {
        const selectedOption = select?.selectedOptions?.[0];
        if (!selectedOption) {
            return null;
        }

        const rawCameraIndex = selectedOption.dataset.cameraIndex;
        const parsedCameraIndex = Number(rawCameraIndex);
        if (!Number.isFinite(parsedCameraIndex)) {
            return null;
        }

        return parsedCameraIndex;
    }

    function buildStartPreviewPayload() {
        const visibleCards = getVisibleCameraCards();
        const payload = [];

        for (const card of visibleCards) {
            const side = String(card?.dataset.side || "").toLowerCase();
            const select = getCameraSelect(card);
            const roiButton = getRoiButton(card);
            const cameraIndex = getSelectedCameraIndex(select);
            const roiPoints = readRoiPointsFromButton(roiButton);

            if (!side || !select || !select.value || cameraIndex === null || !roiPoints) {
                return null;
            }

            payload.push({
                side,
                label: getSideDisplayLabel(side),
                camera_index: cameraIndex,
            });
        }

        return payload;
    }

    function updateStartButtonState() {
        if (!startButton) {
            return;
        }

        if (startRequestCount > 0) {
            startButton.disabled = true;
            return;
        }

        const visibleCards = getVisibleCameraCards();

        if (visibleCards.length === 0) {
            startButton.disabled = true;
            return;
        }

        const allReady = visibleCards.every((card) => {
            const select = getCameraSelect(card);
            const roiButton = getRoiButton(card);
            const cameraIndex = getSelectedCameraIndex(select);

            const hasCamera = Boolean(select && select.value);
            const hasRoi = Boolean(roiButton && readRoiPointsFromButton(roiButton));
            const hasCameraIndex = cameraIndex !== null;

            return hasCamera && hasRoi && hasCameraIndex;
        });

        startButton.disabled = !allReady;
    }

    function updateCameraCardButtons() {
        cameraCards.forEach((card) => {
            const select = getCameraSelect(card);
            const roiButton = getRoiButton(card);
            const isVisible = !card.classList.contains("hidden");
            const hasCardRequest = (cameraCardRequestCounts.get(card) || 0) > 0;

            if (!roiButton) {
                return;
            }

            const hasButtonRequest = (roiButtonRequestCounts.get(roiButton) || 0) > 0;

            if (!isVisible) {
                roiButton.disabled = true;
                if (!hasButtonRequest) {
                    roiButton.textContent = "Set ROI";
                }
                return;
            }

            if (hasButtonRequest) {
                return;
            }

            if (hasCardRequest) {
                roiButton.disabled = true;
                setRoiButtonLabel(roiButton);
                return;
            }

            roiButton.disabled = !(select && select.value);
            setRoiButtonLabel(roiButton);
        });

        updateStartButtonState();
    }

    function syncCameraDropdownOptions() {
        const visibleCards = getVisibleCameraCards();
        const selectedBySide = new Map();

        visibleCards.forEach((card) => {
            const side = card.dataset.side || "";
            const select = getCameraSelect(card);

            if (!side || !select || !select.value) {
                return;
            }

            selectedBySide.set(side, select.value);
        });

        visibleCards.forEach((card) => {
            const side = card.dataset.side || "";
            const select = getCameraSelect(card);

            if (!side || !select) {
                return;
            }

            Array.from(select.options).forEach((option) => {
                if (!option.value) {
                    option.disabled = false;
                    return;
                }

                const inUseByOtherSide = Array.from(selectedBySide.entries()).some(
                    ([otherSide, selectedValue]) => otherSide !== side && selectedValue === option.value
                );

                option.disabled = inUseByOtherSide;
            });
        });
    }

    function applyCameraVisibility() {
        const visibleSides = getVisibleCameraSides();

        cameraCards.forEach((card) => {
            const side = card.dataset.side;
            const shouldShow = visibleSides.has(side);
            card.classList.toggle("hidden", !shouldShow);

            const select = card.querySelector(".cameraSelect");
            if (select) {
                select.disabled = !shouldShow;
            }
        });

        updateCameraCardButtons();
        syncCameraDropdownOptions();
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

    async function loadCameras() {
        if (cameraSelects.length === 0) {
            return;
        }

        if (!navigator.mediaDevices || typeof navigator.mediaDevices.enumerateDevices !== "function") {
            return;
        }

        cameraCards.forEach((card) => {
            beginCameraCardRequest(card);
        });

        cameraSelects.forEach((select) => {
            select.innerHTML = "";

            const loadingOption = document.createElement("option");
            loadingOption.value = "";
            loadingOption.text = "Fetching cameras...";
            loadingOption.selected = true;
            select.appendChild(loadingOption);
        });

        try {
            await navigator.mediaDevices.getUserMedia({ video: true });

            const devices = await navigator.mediaDevices.enumerateDevices();
            const cameras = devices.filter((device) => device.kind === "videoinput");

            cameraSelects.forEach((select) => {
                select.innerHTML = "";

                const placeholder = document.createElement("option");
                placeholder.value = "";
                placeholder.text = "Select Camera";
                placeholder.selected = true;
                select.appendChild(placeholder);

                cameras.forEach((camera, index) => {
                    const option = document.createElement("option");
                    const cameraId = camera.deviceId || `camera-${index}`;
                    option.value = cameraId;
                    option.dataset.cameraId = cameraId;
                    option.dataset.cameraIndex = String(index);
                    option.text = camera.label || `Camera ${index + 1}`;
                    select.appendChild(option);
                });

                const card = select.closest("[data-camera-card]");
                const side = card?.dataset.side || "";
                const savedCameraValue = side ? getSavedCameraValue(side) : "";

                if (savedCameraValue) {
                    const savedExists = Array.from(select.options).some((option) => option.value === savedCameraValue);

                    if (!savedExists) {
                        const savedOption = document.createElement("option");
                        savedOption.value = savedCameraValue;
                        savedOption.dataset.cameraId = savedCameraValue;
                        savedOption.text = `Saved Camera (${formatCameraIdForLabel(savedCameraValue)})`;

                        select.appendChild(savedOption);
                    }

                    select.value = savedCameraValue;
                }

                select.addEventListener("change", () => {
                    const card = select.closest("[data-camera-card]");
                    const roiButton = card ? getRoiButton(card) : null;

                    if (roiButton) {
                        // Camera change invalidates previous ROI.
                        roiButton.dataset.roiValue = "";
                        setRoiButtonLabel(roiButton);
                    }

                    updateCameraCardButtons();
                    syncCameraDropdownOptions();

                    if (card) {
                        persistControllerRoi(card);
                    }
                });
            });
        } catch (error) {
            console.error("Error accessing cameras:", error);

            cameraSelects.forEach((select) => {
                select.innerHTML = "";

                const errorOption = document.createElement("option");
                errorOption.value = "";
                errorOption.text = "Camera unavailable";
                errorOption.selected = true;
                select.appendChild(errorOption);
            });
        } finally {
            cameraCards.forEach((card) => {
                endCameraCardRequest(card);
            });

            updateCameraCardButtons();
            syncCameraDropdownOptions();
        }
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

        beginTimerRequest();
        try {
            await window.smartTrafficApi.updateControllerTimes(controllerTimesApiUrl, {
                min_time: Number(minTimerInput.value),
                max_time: Number(maxTimerInput.value),
                time_per_vehicle: Number(timerPerVehicleInput.value),
            });
        } catch (error) {
            console.error(error);
        } finally {
            endTimerRequest();
        }
    }

    async function persistControllerRoi(card) {
        if (!controllerRoiApiUrl || !window.smartTrafficApi?.updateControllerRoi) {
            return;
        }

        const side = String(card?.dataset.side || "").toLowerCase();
        const roiButton = getRoiButton(card);
        const cameraSelect = getCameraSelect(card);

        if (!side || !roiButton) {
            return;
        }

        let cameraId = null;
        if (cameraSelect && cameraSelect.value !== "") {
            cameraId = String(cameraSelect.value);
        }

        beginCameraCardRequest(card);
        try {
            await window.smartTrafficApi.updateControllerRoi(controllerRoiApiUrl, {
                side,
                camera_id: cameraId,
                roi_points: readRoiPointsFromButton(roiButton),
            });
        } catch (error) {
            console.error(error);
        } finally {
            endCameraCardRequest(card);
            updateCameraCardButtons();
            syncCameraDropdownOptions();
        }
    }

    async function onSetRoi(card, roiButton) {
        const cameraSelect = getCameraSelect(card);

        if (!roiPickerApiUrl || !cameraSelect || !cameraSelect.value || !window.smartTrafficApi?.selectRoi) {
            return;
        }

        if (readRoiPointsFromButton(roiButton)) {
            beginRoiButtonRequest(roiButton, "Saving...");
            try {
                roiButton.dataset.roiValue = "";
                updateStartButtonState();
                await persistControllerRoi(card);
            } finally {
                endRoiButtonRequest(card, roiButton);
                updateStartButtonState();
            }
            return;
        }

        const cameraIndex = getSelectedCameraIndex(cameraSelect);
        if (cameraIndex === null) {
            return;
        }

        beginRoiButtonRequest(roiButton, "Fetching ROI...");

        try {
            const result = await window.smartTrafficApi.selectRoi(roiPickerApiUrl, {
                camera_index: cameraIndex,
            });

            if (Array.isArray(result.roi_points) && result.roi_points.length === 4) {
                roiButton.dataset.roiValue = JSON.stringify(result.roi_points);
            } else {
                roiButton.dataset.roiValue = "";
            }

            setRoiButtonLabel(roiButton);
            await persistControllerRoi(card);
        } catch (error) {
            console.error(error);
            roiButton.dataset.roiValue = "";
            setRoiButtonLabel(roiButton);
            await persistControllerRoi(card);
        } finally {
            endRoiButtonRequest(card, roiButton);

            updateStartButtonState();
        }
    }

    async function onStartButtonClick(event) {
        if (event) {
            event.preventDefault();
        }

        if (!startPreviewApiUrl || !window.smartTrafficApi?.startControllerPreview || !startButton) {
            return;
        }

        const cameras = buildStartPreviewPayload();
        if (!cameras || cameras.length === 0) {
            updateStartButtonState();
            return;
        }

        beginStartRequest();
        try {
            await window.smartTrafficApi.startControllerPreview(startPreviewApiUrl, {
                cameras,
            });
        } catch (error) {
            console.error(error);
        } finally {
            endStartRequest();
            updateStartButtonState();
        }
    }

    drawVisual();
    window.addEventListener("resize", drawVisual);

    [minTimerInput, maxTimerInput, timerPerVehicleInput]
        .filter(Boolean)
        .forEach((input) => {
            input.addEventListener("change", onControllerTimesChange);
        });

    if (form) {
        form.addEventListener("submit", onStartButtonClick);
    }

    if (startButton) {
        startButton.addEventListener("click", onStartButtonClick);
    }

    cameraCards.forEach((card) => {
        const roiButton = getRoiButton(card);
        if (!roiButton) {
            return;
        }

        const side = card.dataset.side || "";
        roiButton.dataset.roiValue = side ? getSavedRoiValue(side) : "";
        setRoiButtonLabel(roiButton);

        roiButton.addEventListener("click", () => {
            onSetRoi(card, roiButton);
        });

        const observer = new MutationObserver(() => {
            updateStartButtonState();
        });

        observer.observe(roiButton, {
            attributes: true,
            attributeFilter: ["data-roi-value"],
        });
    });

    applyCameraVisibility();
    loadCameras();
});
