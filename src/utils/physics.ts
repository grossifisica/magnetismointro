/**
 * Physics utilities for magnetic field calculations, induction lines, and dipole forces.
 */

export interface FieldVector {
  bx: number;
  by: number;
  magnitude: number;
  angleRad: number;
  angleDeg: number;
}

export interface PolePosition {
  x: number;
  y: number;
}

/**
 * Get North and South pole coordinates of a bar magnet.
 */
export function getMagnetPoles(
  cx: number,
  cy: number,
  length: number,
  angleDeg: number
): { north: PolePosition; south: PolePosition } {
  const rad = (angleDeg * Math.PI) / 180;
  const half = length / 2;
  // By convention, 0 deg means North is on the right (+x) and South is on the left (-x)
  return {
    north: {
      x: cx + half * Math.cos(rad),
      y: cy + half * Math.sin(rad),
    },
    south: {
      x: cx - half * Math.cos(rad),
      y: cy - half * Math.sin(rad),
    },
  };
}

/**
 * Calculate magnetic field B at point (px, py) from a single bar magnet.
 */
export function calculateMagnetField(
  px: number,
  py: number,
  cx: number,
  cy: number,
  length: number,
  angleDeg: number,
  strength: number = 80000
): { bx: number; by: number } {
  const { north, south } = getMagnetPoles(cx, cy, length, angleDeg);

  const eps = 16; // softening parameter to prevent infinity near pole centers

  // From North pole (+ magnetic charge)
  const rNx = px - north.x;
  const rNy = py - north.y;
  const dN2 = rNx * rNx + rNy * rNy + eps * eps;
  const dN3 = Math.pow(dN2, 1.5);

  // From South pole (- magnetic charge)
  const rSx = px - south.x;
  const rSy = py - south.y;
  const dS2 = rSx * rSx + rSy * rSy + eps * eps;
  const dS3 = Math.pow(dS2, 1.5);

  const bx = strength * (rNx / dN3 - rSx / dS3);
  const by = strength * (rNy / dN3 - rSy / dS3);

  return { bx, by };
}

/**
 * Calculate complete FieldVector (magnitude, angles) at point (px, py).
 */
export function getFieldVectorAt(
  px: number,
  py: number,
  cx: number,
  cy: number,
  length: number,
  angleDeg: number,
  strength: number = 80000
): FieldVector {
  const { bx, by } = calculateMagnetField(px, py, cx, cy, length, angleDeg, strength);
  const magnitude = Math.sqrt(bx * bx + by * by);
  const angleRad = Math.atan2(by, bx);
  const angleDegValue = (angleRad * 180) / Math.PI;

  return {
    bx,
    by,
    magnitude,
    angleRad,
    angleDeg: angleDegValue,
  };
}

/**
 * Generates magnetic induction lines (streamlines) originating from the North pole
 * and terminating near the South pole.
 */
export function generateFieldLines(
  cx: number,
  cy: number,
  length: number,
  angleDeg: number,
  width: number,
  height: number,
  numLinesPerSide: number = 7,
  strength: number = 80000
): Array<Array<{ x: number; y: number }>> {
  const { north, south } = getMagnetPoles(cx, cy, length, angleDeg);
  const rad = (angleDeg * Math.PI) / 180;
  const lines: Array<Array<{ x: number; y: number }>> = [];

  const startRadius = 12;
  const targetRadius = 18;
  const stepSize = 3;
  const maxSteps = 550;
  const boundsMargin = 40;

  // Helper function: trace forward along +B originating from North
  const traceForwardFromNorth = (seedAngleN: number): { points: Array<{ x: number; y: number }>; reachedSouth: boolean } => {
    const startX = north.x + startRadius * Math.cos(seedAngleN);
    const startY = north.y + startRadius * Math.sin(seedAngleN);

    const points: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];
    let currX = startX;
    let currY = startY;
    let reachedSouth = false;

    for (let step = 0; step < maxSteps; step++) {
      // Check if we hit the South pole
      const dSx = currX - south.x;
      const dSy = currY - south.y;
      const distToSouth = Math.hypot(dSx, dSy);
      if (distToSouth < targetRadius && step > 6) {
        points.push({ x: south.x, y: south.y });
        reachedSouth = true;
        break;
      }

      // Check canvas bounds
      if (
        currX < -boundsMargin ||
        currX > width + boundsMargin ||
        currY < -boundsMargin ||
        currY > height + boundsMargin
      ) {
        break;
      }

      // Midpoint RK2 integration along +B
      const f1 = calculateMagnetField(currX, currY, cx, cy, length, angleDeg, strength);
      const mag1 = Math.hypot(f1.bx, f1.by);
      if (mag1 === 0) break;

      const ux1 = f1.bx / mag1;
      const uy1 = f1.by / mag1;

      const midX = currX + 0.5 * stepSize * ux1;
      const midY = currY + 0.5 * stepSize * uy1;

      const f2 = calculateMagnetField(midX, midY, cx, cy, length, angleDeg, strength);
      const mag2 = Math.hypot(f2.bx, f2.by);
      if (mag2 === 0) break;

      const ux2 = f2.bx / mag2;
      const uy2 = f2.by / mag2;

      currX += stepSize * ux2;
      currY += stepSize * uy2;

      points.push({ x: currX, y: currY });
    }

    return { points, reachedSouth };
  };

  // Helper function: trace backwards along -B originating from South
  // Reversed afterwards so the line flows from the canvas boundary into South (along +B)
  const traceBackwardFromSouth = (seedAngleS: number): Array<{ x: number; y: number }> => {
    const startX = south.x + startRadius * Math.cos(seedAngleS);
    const startY = south.y + startRadius * Math.sin(seedAngleS);

    const revPoints: Array<{ x: number; y: number }> = [{ x: south.x, y: south.y }, { x: startX, y: startY }];
    let currX = startX;
    let currY = startY;

    for (let step = 0; step < maxSteps; step++) {
      // Check if we hit the North pole
      const dNx = currX - north.x;
      const dNy = currY - north.y;
      if (Math.hypot(dNx, dNy) < targetRadius && step > 6) {
        revPoints.push({ x: north.x, y: north.y });
        break;
      }

      // Check canvas bounds
      if (
        currX < -boundsMargin ||
        currX > width + boundsMargin ||
        currY < -boundsMargin ||
        currY > height + boundsMargin
      ) {
        break;
      }

      // Midpoint RK2 integration along -B (backwards)
      const f1 = calculateMagnetField(currX, currY, cx, cy, length, angleDeg, strength);
      const mag1 = Math.hypot(f1.bx, f1.by);
      if (mag1 === 0) break;

      const ux1 = -f1.bx / mag1;
      const uy1 = -f1.by / mag1;

      const midX = currX + 0.5 * stepSize * ux1;
      const midY = currY + 0.5 * stepSize * uy1;

      const f2 = calculateMagnetField(midX, midY, cx, cy, length, angleDeg, strength);
      const mag2 = Math.hypot(f2.bx, f2.by);
      if (mag2 === 0) break;

      const ux2 = -f2.bx / mag2;
      const uy2 = -f2.by / mag2;

      currX += stepSize * ux2;
      currY += stepSize * uy2;

      revPoints.push({ x: currX, y: currY });
    }

    // Reverse so the line starts at boundary and terminates at South
    return revPoints.reverse();
  };

  // 1. Central Axial Lines (strictly collinear & symmetric)
  // Outgoing from North:
  const northAxial = traceForwardFromNorth(rad);
  if (northAxial.points.length > 5) {
    lines.push(northAxial.points);
  }
  // Incoming into South:
  const southAxial = traceBackwardFromSouth(rad + Math.PI);
  if (southAxial.length > 5) {
    lines.push(southAxial);
  }

  // 2. Symmetric Side Lines (exact 1-to-1 match between North emission and South reception)
  for (let i = 1; i <= numLinesPerSide; i++) {
    const angleOffset = (i / (numLinesPerSide + 0.5)) * Math.PI * 0.88;

    // Positive angle offset (e.g. top side)
    const seedAngleN_pos = rad + angleOffset;
    const seedAngleS_pos = rad + Math.PI - angleOffset;

    const resN_pos = traceForwardFromNorth(seedAngleN_pos);
    if (resN_pos.points.length > 5) {
      lines.push(resN_pos.points);
    }
    // If the forward line did not reach South within the canvas, add the exact mirror counterpart entering South
    if (!resN_pos.reachedSouth) {
      const lineS_pos = traceBackwardFromSouth(seedAngleS_pos);
      if (lineS_pos.length > 5) {
        lines.push(lineS_pos);
      }
    }

    // Negative angle offset (e.g. bottom side)
    const seedAngleN_neg = rad - angleOffset;
    const seedAngleS_neg = rad + Math.PI + angleOffset;

    const resN_neg = traceForwardFromNorth(seedAngleN_neg);
    if (resN_neg.points.length > 5) {
      lines.push(resN_neg.points);
    }
    // If the forward line did not reach South within the canvas, add the exact mirror counterpart entering South
    if (!resN_neg.reachedSouth) {
      const lineS_neg = traceBackwardFromSouth(seedAngleS_neg);
      if (lineS_neg.length > 5) {
        lines.push(lineS_neg);
      }
    }
  }

  return lines;
}

/**
 * Calculate interaction force between two horizontally aligned bar magnets.
 * Returns force in arbitrary didactic units (e.g. Newtons) where:
 * > 0 : Repulsion
 * < 0 : Attraction
 */
export function calculateTwoMagnetForce(
  mag1: { x: number; y: number; length: number; angleDeg: number },
  mag2: { x: number; y: number; length: number; angleDeg: number },
  k: number = 1800000
): { force: number; type: 'attraction' | 'repulsion' | 'neutral'; magnitudePercent: number } {
  const p1 = getMagnetPoles(mag1.x, mag1.y, mag1.length, mag1.angleDeg);
  const p2 = getMagnetPoles(mag2.x, mag2.y, mag2.length, mag2.angleDeg);

  const d = (a: PolePosition, b: PolePosition) => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.max(25, Math.sqrt(dx * dx + dy * dy));
  };

  // N1 with N2: repels (+)
  // N1 with S2: attracts (-)
  // S1 with N2: attracts (-)
  // S1 with S2: repels (+)
  const fN1N2 = k / Math.pow(d(p1.north, p2.north), 2);
  const fN1S2 = -k / Math.pow(d(p1.north, p2.south), 2);
  const fS1N2 = -k / Math.pow(d(p1.south, p2.north), 2);
  const fS1S2 = k / Math.pow(d(p1.south, p2.south), 2);

  const netForce = fN1N2 + fN1S2 + fS1N2 + fS1S2;
  const isRepulsion = netForce > 0;
  const isAttraction = netForce < 0;

  // Normalize magnitude to 0 - 100% scale for visual meters
  const absForce = Math.abs(netForce);
  const magnitudePercent = Math.min(100, Math.round((absForce / 25) * 100) / 10);

  return {
    force: netForce,
    type: isRepulsion ? 'repulsion' : isAttraction ? 'attraction' : 'neutral',
    magnitudePercent: Math.min(100, Math.max(5, Math.round(magnitudePercent))),
  };
}
