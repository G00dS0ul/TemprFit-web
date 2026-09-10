// Landmark indices from MediaPipe's Pose Landmarker (33-point model).
// https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker
export const LANDMARK = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
}

// Angle at point `b`, formed by rays b->a and b->c, in degrees (0-180).
// Landmarks are normalized (x, y in 0..1) — that's fine, angles are
// scale-invariant.
export function angleAt(a, b, c) {
  if (!a || !b || !c) return null
  const abx = a.x - b.x
  const aby = a.y - b.y
  const cbx = c.x - b.x
  const cby = c.y - b.y
  const dot = abx * cbx + aby * cby
  const magAB = Math.hypot(abx, aby)
  const magCB = Math.hypot(cbx, cby)
  if (magAB === 0 || magCB === 0) return null
  const cos = Math.min(1, Math.max(-1, dot / (magAB * magCB)))
  return (Math.acos(cos) * 180) / Math.PI
}

// Picks whichever side (left/right) has higher landmark visibility/presence
// for a given trio — the camera angle usually favors one side.
export function betterSide(landmarks, leftIdx, rightIdx) {
  const leftVis = (landmarks[leftIdx]?.visibility ?? 0)
  const rightVis = (landmarks[rightIdx]?.visibility ?? 0)
  return leftVis >= rightVis ? 'left' : 'right'
}

export function sideIndices(side) {
  return side === 'left'
    ? {
        shoulder: LANDMARK.LEFT_SHOULDER,
        elbow: LANDMARK.LEFT_ELBOW,
        wrist: LANDMARK.LEFT_WRIST,
        hip: LANDMARK.LEFT_HIP,
        knee: LANDMARK.LEFT_KNEE,
        ankle: LANDMARK.LEFT_ANKLE,
      }
    : {
        shoulder: LANDMARK.RIGHT_SHOULDER,
        elbow: LANDMARK.RIGHT_ELBOW,
        wrist: LANDMARK.RIGHT_WRIST,
        hip: LANDMARK.RIGHT_HIP,
        knee: LANDMARK.RIGHT_KNEE,
        ankle: LANDMARK.RIGHT_ANKLE,
      }
}

// Horizontal offset of the knee past the ankle, normalized against hip
// width so it's roughly scale-consistent across body sizes/camera distance.
export function kneeForwardOffset(landmarks, idx) {
  const knee = landmarks[idx.knee]
  const ankle = landmarks[idx.ankle]
  const lHip = landmarks[LANDMARK.LEFT_HIP]
  const rHip = landmarks[LANDMARK.RIGHT_HIP]
  if (!knee || !ankle || !lHip || !rHip) return null
  const hipWidth = Math.max(0.05, Math.abs(lHip.x - rHip.x))
  return (knee.x - ankle.x) / hipWidth
}
