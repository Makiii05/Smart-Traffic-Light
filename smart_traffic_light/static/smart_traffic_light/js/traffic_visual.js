(function () {
    function normalizeRoadType(value) {
        if (value === "mixed") {
            return "mix";
        }
        return value || "";
    }

    function getVerticalArrowDirection(direction) {
        if (direction === "north_to_south") {
            return "south";
        }
        if (direction === "south_to_north") {
            return "north";
        }
        return "";
    }

    function getHorizontalArrowDirection(direction) {
        if (direction === "east_to_west") {
            return "west";
        }
        if (direction === "west_to_east") {
            return "east";
        }
        return "";
    }

    function createTrafficIntersectionRenderer(canvas) {
        const ctx = canvas.getContext("2d");

        if (!ctx) {
            return {
                render() {},
            };
        }

        const palette = {
            background: "#e7edf3",
            asphalt: "#51565f",
            laneMark: "#f8fafc",
            arrow: "#2563eb",
        };

        let width = 0;
        let height = 0;

        function resizeCanvasToDisplaySize() {
            const { clientWidth, clientHeight } = canvas;

            if (clientWidth === 0 || clientHeight === 0) {
                return false;
            }

            const dpr = window.devicePixelRatio || 1;
            const displayWidth = Math.floor(clientWidth * dpr);
            const displayHeight = Math.floor(clientHeight * dpr);

            if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
                canvas.width = displayWidth;
                canvas.height = displayHeight;
            }

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            width = clientWidth;
            height = clientHeight;
            return true;
        }

        function drawBackground() {
            ctx.fillStyle = palette.background;
            ctx.fillRect(0, 0, width, height);

            ctx.save();
            ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
            ctx.lineWidth = 1;

            for (let x = 0; x <= width; x += 40) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
                ctx.stroke();
            }

            for (let y = 0; y <= height; y += 40) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.stroke();
            }

            ctx.restore();
        }

        function drawRoadSegment(x1, y1, x2, y2, thickness) {
            ctx.save();
            ctx.strokeStyle = palette.asphalt;
            ctx.lineWidth = thickness;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.restore();
        }

        function drawDashedGuide(x1, y1, x2, y2, dashWidth) {
            ctx.save();
            ctx.strokeStyle = palette.laneMark;
            ctx.lineWidth = dashWidth;
            ctx.setLineDash([22, 16]);
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.restore();
        }

        function drawArrow(x, y, direction, length, arrowWidth) {
            const headSize = Math.min(20, Math.max(14, length * 0.24));
            ctx.save();
            ctx.fillStyle = palette.arrow;
            ctx.beginPath();

            if (direction === "north") {
                ctx.moveTo(x, y + length);
                ctx.lineTo(x + arrowWidth, y + length);
                ctx.lineTo(x + arrowWidth, y + headSize);
                ctx.lineTo(x + arrowWidth * 1.5, y + headSize);
                ctx.lineTo(x + arrowWidth / 2, y);
                ctx.lineTo(x - arrowWidth * 0.5, y + headSize);
                ctx.lineTo(x, y + headSize);
            } else if (direction === "south") {
                ctx.moveTo(x, y);
                ctx.lineTo(x + arrowWidth, y);
                ctx.lineTo(x + arrowWidth, y + length - headSize);
                ctx.lineTo(x + arrowWidth * 1.5, y + length - headSize);
                ctx.lineTo(x + arrowWidth / 2, y + length);
                ctx.lineTo(x - arrowWidth * 0.5, y + length - headSize);
                ctx.lineTo(x, y + length - headSize);
            } else if (direction === "east") {
                ctx.moveTo(x, y);
                ctx.lineTo(x, y + arrowWidth);
                ctx.lineTo(x + length - headSize, y + arrowWidth);
                ctx.lineTo(x + length - headSize, y + arrowWidth * 1.5);
                ctx.lineTo(x + length, y + arrowWidth / 2);
                ctx.lineTo(x + length - headSize, y - arrowWidth * 0.5);
                ctx.lineTo(x + length - headSize, y);
            } else if (direction === "west") {
                ctx.moveTo(x + length, y);
                ctx.lineTo(x + length, y + arrowWidth);
                ctx.lineTo(x + headSize, y + arrowWidth);
                ctx.lineTo(x + headSize, y + arrowWidth * 1.5);
                ctx.lineTo(x, y + arrowWidth / 2);
                ctx.lineTo(x + headSize, y - arrowWidth * 0.5);
                ctx.lineTo(x + headSize, y);
            }

            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        function getArrowLayout(roadHalf) {
            const cx = width / 2;
            const cy = height / 2;
            const margin = 12;

            const crosswalkOffsetX = Math.max(14, width * 0.045) + 10;
            const crosswalkOffsetY = Math.max(14, height * 0.045) + 10;

            const availableLenX = Math.max(24, cx - roadHalf - margin - crosswalkOffsetX);
            const availableLenY = Math.max(24, cy - roadHalf - margin - crosswalkOffsetY);
            const arrowLength = Math.min(100, availableLenX, availableLenY);
            const arrowWidth = Math.max(14, Math.min(22, roadHalf * 0.28));

            const vLaneLeftX = cx - roadHalf - arrowWidth * 1.45;
            const vLaneRightX = cx + roadHalf + arrowWidth * 0.45;

            const hLaneTopY = cy - roadHalf - arrowWidth * 1.45;
            const hLaneBottomY = cy + roadHalf + arrowWidth * 0.45;

            const vNorthY = cy - roadHalf - crosswalkOffsetY - arrowLength * 1.1;
            const vSouthY = cy + roadHalf + crosswalkOffsetY;

            const hWestX = cx - roadHalf - crosswalkOffsetX - arrowLength * 1.1;
            const hEastX = cx + roadHalf + crosswalkOffsetX;

            return {
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

        function drawTwoWayVerticalArrows(layout) {
            drawArrow(layout.vLaneRightX, layout.vNorthY, "north", layout.arrowLength, layout.arrowWidth);
            drawArrow(layout.vLaneLeftX, layout.vNorthY, "south", layout.arrowLength, layout.arrowWidth);
            drawArrow(layout.vLaneRightX, layout.vSouthY, "north", layout.arrowLength, layout.arrowWidth);
            drawArrow(layout.vLaneLeftX, layout.vSouthY, "south", layout.arrowLength, layout.arrowWidth);
        }

        function drawTwoWayHorizontalArrows(layout) {
            drawArrow(layout.hEastX, layout.hLaneBottomY, "east", layout.arrowLength, layout.arrowWidth);
            drawArrow(layout.hEastX, layout.hLaneTopY, "west", layout.arrowLength, layout.arrowWidth);
            drawArrow(layout.hWestX, layout.hLaneTopY, "west", layout.arrowLength, layout.arrowWidth);
            drawArrow(layout.hWestX, layout.hLaneBottomY, "east", layout.arrowLength, layout.arrowWidth);
        }

        function drawVerticalOneWayArrows(layout, direction) {
            drawArrow(layout.vLaneLeftX, layout.vNorthY, direction, layout.arrowLength, layout.arrowWidth);
            drawArrow(layout.vLaneRightX, layout.vNorthY, direction, layout.arrowLength, layout.arrowWidth);
            drawArrow(layout.vLaneLeftX, layout.vSouthY, direction, layout.arrowLength, layout.arrowWidth);
            drawArrow(layout.vLaneRightX, layout.vSouthY, direction, layout.arrowLength, layout.arrowWidth);
        }

        function drawHorizontalOneWayArrows(layout, direction) {
            drawArrow(layout.hEastX, layout.hLaneTopY, direction, layout.arrowLength, layout.arrowWidth);
            drawArrow(layout.hEastX, layout.hLaneBottomY, direction, layout.arrowLength, layout.arrowWidth);
            drawArrow(layout.hWestX, layout.hLaneTopY, direction, layout.arrowLength, layout.arrowWidth);
            drawArrow(layout.hWestX, layout.hLaneBottomY, direction, layout.arrowLength, layout.arrowWidth);
        }

        function drawCrossRoadBase(roadHalf) {
            const cx = width / 2;
            const cy = height / 2;
            ctx.fillStyle = palette.asphalt;
            ctx.fillRect(cx - roadHalf, 0, roadHalf * 2, height);
            ctx.fillRect(0, cy - roadHalf, width, roadHalf * 2);
            drawDashedGuide(cx, 0, cx, height, 4);
            drawDashedGuide(0, cy, width, cy, 4);
        }

        function drawTRoadBase(roadHalf) {
            const cx = width / 2;
            const cy = height / 2;
            ctx.fillStyle = palette.asphalt;
            ctx.fillRect(cx - roadHalf, 0, roadHalf * 2, cy + roadHalf);
            ctx.fillRect(0, cy - roadHalf, width, roadHalf * 2);
            drawDashedGuide(cx, 0, cx, cy, 4);
            drawDashedGuide(0, cy, width, cy, 4);
        }

        function drawYRoadBase(roadHalf) {
            const cx = width / 2;
            const cy = height / 2;
            const thickness = roadHalf * 1.6;
            drawRoadSegment(cx, cy, cx, 0, thickness);
            drawRoadSegment(cx, cy, width * 0.9, height, thickness);
            drawRoadSegment(cx, cy, width * 0.1, height, thickness);
            drawDashedGuide(cx, cy, cx, 0, 4);
            drawDashedGuide(cx, cy, width * 0.9, height, 4);
            drawDashedGuide(cx, cy, width * 0.1, height, 4);
        }

        function drawXRoadBase(roadHalf) {
            const thickness = roadHalf * 1.55;
            drawRoadSegment(0, 0, width, height, thickness);
            drawRoadSegment(width, 0, 0, height, thickness);
            drawDashedGuide(0, 0, width, height, 4);
            drawDashedGuide(width, 0, 0, height, 4);
        }

        function drawPedestrianCrossing(side, roadHalf) {
            const cx = width / 2;
            const cy = height / 2;
            const stripeWidth = Math.max(4, Math.min(8, roadHalf * 0.11));
            const stripeLength = Math.max(16, Math.min(26, roadHalf * 0.55));
            const stripeGap = Math.max(5, stripeWidth);
            const stripeCount = 8;
            const totalWidth = stripeCount * stripeWidth + (stripeCount - 1) * stripeGap;
            const startOffset = -totalWidth / 2;

            ctx.save();
            ctx.fillStyle = palette.laneMark;

            for (let index = 0; index < stripeCount; index += 1) {
                const laneOffset = startOffset + index * (stripeWidth + stripeGap);

                if (side === "north") {
                    ctx.fillRect(cx + laneOffset, cy - roadHalf - stripeLength, stripeWidth, stripeLength);
                } else if (side === "south") {
                    ctx.fillRect(cx + laneOffset, cy + roadHalf, stripeWidth, stripeLength);
                } else if (side === "east") {
                    ctx.fillRect(cx + roadHalf, cy + laneOffset, stripeLength, stripeWidth);
                } else if (side === "west") {
                    ctx.fillRect(cx - roadHalf - stripeLength, cy + laneOffset, stripeLength, stripeWidth);
                }
            }

            ctx.restore();
        }

        function drawPedestrianLanes(pedestrian, roadHalf) {
            if (pedestrian.north) {
                drawPedestrianCrossing("north", roadHalf);
            }
            if (pedestrian.south) {
                drawPedestrianCrossing("south", roadHalf);
            }
            if (pedestrian.east) {
                drawPedestrianCrossing("east", roadHalf);
            }
            if (pedestrian.west) {
                drawPedestrianCrossing("west", roadHalf);
            }
        }

        function drawRoadTypeArrows(intersectionType, roadType, verticalRoadMode, horizontalRoadMode, verticalDirection, horizontalDirection, roadHalf) {
            if (intersectionType !== "cross_intersection") {
                return;
            }

            const layout = getArrowLayout(roadHalf);
            const verticalArrowDirection = getVerticalArrowDirection(verticalDirection);
            const horizontalArrowDirection = getHorizontalArrowDirection(horizontalDirection);

            if (roadType === "two_way") {
                drawTwoWayVerticalArrows(layout);
                drawTwoWayHorizontalArrows(layout);
                return;
            }

            if (roadType === "one_way") {
                if (verticalArrowDirection && horizontalArrowDirection) {
                    drawVerticalOneWayArrows(layout, verticalArrowDirection);
                    drawHorizontalOneWayArrows(layout, horizontalArrowDirection);
                }
                return;
            }

            if (roadType === "mix") {
                if (verticalRoadMode === "two_way") {
                    drawTwoWayVerticalArrows(layout);
                } else if (verticalRoadMode === "one_way" && verticalArrowDirection) {
                    drawVerticalOneWayArrows(layout, verticalArrowDirection);
                }

                if (horizontalRoadMode === "two_way") {
                    drawTwoWayHorizontalArrows(layout);
                } else if (horizontalRoadMode === "one_way" && horizontalArrowDirection) {
                    drawHorizontalOneWayArrows(layout, horizontalArrowDirection);
                }
            }
        }

        function drawCenterIsland(roadHalf) {
            const cx = width / 2;
            const cy = height / 2;

            ctx.save();
            ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
            ctx.beginPath();
            ctx.arc(cx, cy, Math.max(12, roadHalf * 0.22), 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        function render(config = {}) {
            if (!resizeCanvasToDisplaySize()) {
                return;
            }

            drawBackground();

            const intersectionType = config.intersectionType || "";
            if (!intersectionType) {
                return;
            }

            const roadType = normalizeRoadType(config.roadType);
            const roadHalf = Math.max(40, Math.min(width, height) * 0.12);

            if (intersectionType === "cross_intersection") {
                drawCrossRoadBase(roadHalf);
            } else if (intersectionType === "t_intersection") {
                drawTRoadBase(roadHalf);
            } else if (intersectionType === "y_intersection") {
                drawYRoadBase(roadHalf);
            } else if (intersectionType === "x_intersection") {
                drawXRoadBase(roadHalf);
            } else {
                return;
            }

            drawPedestrianLanes(config.pedestrian || {}, roadHalf);
            drawRoadTypeArrows(
                intersectionType,
                roadType,
                config.verticalRoadMode || "",
                config.horizontalRoadMode || "",
                config.verticalDirection || "",
                config.horizontalDirection || "",
                roadHalf
            );
            drawCenterIsland(roadHalf);
        }

        return {
            render,
        };
    }

    window.createTrafficIntersectionRenderer = createTrafficIntersectionRenderer;
})();
