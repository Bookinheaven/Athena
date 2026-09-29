export const SNAP_GRID = 16;
export const WIDGET_GAP = 12;

export function rectsOverlap(r1, r2, gap = WIDGET_GAP) {
  return (
    r1.x < r2.x + r2.width + gap &&
    r1.x + r1.width + gap > r2.x &&
    r1.y < r2.y + r2.height + gap &&
    r1.y + r1.height + gap > r2.y
  );
}

export function isPositionFree(candidate, otherWidgets, containerWidth, gap = WIDGET_GAP) {
  if (candidate.x < SNAP_GRID) return false;
  if (candidate.x + candidate.width > containerWidth - SNAP_GRID) return false;
  if (candidate.y < SNAP_GRID) return false;

  for (const w of otherWidgets) {
    if (!w.visible) continue;
    if (rectsOverlap(candidate, w, gap)) {
      return false;
    }
  }
  return true;
}

export function snapToGrid(val, grid = SNAP_GRID) {
  return Math.round(val / grid) * grid;
}

export function findNearestFreePosition({
  targetX,
  targetY,
  width,
  height,
  otherWidgets,
  containerWidth,
  grid = SNAP_GRID,
  gap = WIDGET_GAP,
}) {
  const snappedX = snapToGrid(targetX, grid);
  const snappedY = snapToGrid(targetY, grid);
  const candidate = { x: snappedX, y: snappedY, width, height };

  if (isPositionFree(candidate, otherWidgets, containerWidth, gap)) {
    return { x: snappedX, y: snappedY };
  }

  const maxSearchDistance = Math.max(containerWidth, 1800);
  const maxSteps = Math.ceil(maxSearchDistance / grid);

  let bestPos = null;
  let bestDistSq = Infinity;

  for (let step = 1; step <= maxSteps; step++) {
    const d = step * grid;
    const testOffsets = [
      { dx: d, dy: 0 },
      { dx: -d, dy: 0 },
      { dx: 0, dy: d },
      { dx: 0, dy: -d },
      { dx: d, dy: d },
      { dx: -d, dy: d },
      { dx: d, dy: -d },
      { dx: -d, dy: -d },
    ];

    for (let s = 1; s < step; s++) {
      const intermediate = s * grid;
      testOffsets.push(
        { dx: d, dy: intermediate },
        { dx: d, dy: -intermediate },
        { dx: -d, dy: intermediate },
        { dx: -d, dy: -intermediate },
        { dx: intermediate, dy: d },
        { dx: -intermediate, dy: d },
        { dx: intermediate, dy: -d },
        { dx: -intermediate, dy: -d }
      );
    }

    for (const offset of testOffsets) {
      const candX = snappedX + offset.dx;
      const candY = snappedY + offset.dy;

      const cand = { x: candX, y: candY, width, height };
      if (isPositionFree(cand, otherWidgets, containerWidth, gap)) {
        const distSq = offset.dx * offset.dx + offset.dy * offset.dy;
        if (distSq < bestDistSq) {
          bestDistSq = distSq;
          bestPos = { x: candX, y: candY };
        }
      }
    }

    if (bestPos) {
      return bestPos;
    }
  }

  const maxY = otherWidgets
    .filter((w) => w.visible)
    .reduce((max, w) => Math.max(max, w.y + w.height), SNAP_GRID);
  return { x: SNAP_GRID, y: snapToGrid(maxY + gap + SNAP_GRID, grid) };
}

export function constrainResize({
  targetWidget,
  intendedWidth,
  intendedHeight,
  otherWidgets,
  containerWidth,
  minWidth = 280,
  minHeight = 120,
  grid = SNAP_GRID,
  gap = WIDGET_GAP,
}) {
  let boundedW = Math.max(
    minWidth,
    Math.min(containerWidth - targetWidget.x - SNAP_GRID, snapToGrid(intendedWidth, grid))
  );
  let boundedH = Math.max(minHeight, snapToGrid(intendedHeight, grid));

  for (const w of otherWidgets) {
    if (!w.visible || w.id === targetWidget.id) continue;

    const testRect = {
      x: targetWidget.x,
      y: targetWidget.y,
      width: boundedW,
      height: boundedH,
    };

    if (rectsOverlap(testRect, w, gap)) {
      if (w.x >= targetWidget.x + minWidth) {
        boundedW = Math.min(boundedW, Math.max(minWidth, snapToGrid(w.x - targetWidget.x - gap, grid)));
      }
      if (w.y >= targetWidget.y + minHeight) {
        boundedH = Math.min(boundedH, Math.max(minHeight, snapToGrid(w.y - targetWidget.y - gap, grid)));
      }
    }
  }

  return { width: boundedW, height: boundedH };
}
