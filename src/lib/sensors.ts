import { useCallback, useRef, useState } from 'react';
import { Accelerometer, Gyroscope } from 'expo-sensors';
import { MIN_LIVENESS_MOVEMENT } from './scoring';

const SAMPLE_INTERVAL_MS = 16; // ~60Hz, the highest frequency that stays stable across Expo-supported devices
const TRACE_UPDATE_INTERVAL_MS = 90;
// Must cover a full run (RUN_DURATION_SECONDS in PlayScreen / TRACE_UPDATE_INTERVAL_MS,
// ~222 ticks for a 20s run) plus a small safety margin. Sized this way, the
// live trace fills the width by the end of a run instead of scrolling a
// short recent window the whole time, which is what made it look like a
// different, sparser thing than the Results screen's full-run trace.
export const TRACE_LENGTH = 230;

// Accelerometer reports in g, gyroscope in rad/s, so these scale both into one
// comparable movement range. Placeholder values, still need on-device
// calibration before the scoring curve in scoring.ts will feel fair.
const GRAVITY_EMA = 0.92;
const NOISE_EMA = 0.7;
const LINEAR_WEIGHT = 40;
const ROTATIONAL_WEIGHT = 25;

// A phone lying flat on a table reads gravity almost entirely on its
// screen-perpendicular axis (z), regardless of device, since that's just
// physics. But orientation alone can't tell "resting on a table" apart from
// "genuinely held flat" (e.g. lying on your back, phone held above your
// face) - those produce the same gravity vector. So this ratio is only half
// the check; see isFlat below, which also requires suspiciously low movement
// (a table has none, a hand always has physiological tremor) before it
// reports true. Threshold is roughly sin(tilt from vertical), so this alone
// still needs ~76° of tilt before it can even be a candidate.
const FLATNESS_THRESHOLD = 0.97;

// MIN_LIVENESS_MOVEMENT is calibrated against whole-run RMS, not an
// instantaneous sample - comparing a single smoothed tick against it means
// any genuinely still moment (the entire point of the game) can dip below
// it by chance and falsely cancel a real hold. Instead, roll magnitude^2
// through a much slower EMA to approximate RMS over the last ~1.6s
// (window ~= 1 / (1 - LIVENESS_EMA) ticks at 60Hz), the same statistic the
// floor was actually calibrated against.
const LIVENESS_EMA = 0.99;
// Stricter than the post-run floor on purpose: this live check is only an
// early-exit nicety so a doomed run doesn't waste the player's time. The
// post-run isTooStillToBeHandheld check (scoring.ts) is the real
// enforcement and already uses the correctly-calibrated full-run RMS, so
// the live check can afford to be conservative and let a few props through
// to be caught there instead of risking a false cancel on a real hold.
const LIVE_STILLNESS_THRESHOLD = MIN_LIVENESS_MOVEMENT / 2;
// Rolling RMS starts at 0 and needs time to fill with real samples: without
// this grace window, someone genuinely holding the phone flat from the
// first instant would read as "still" simply because the average hasn't
// caught up yet, not because they're actually still.
const FLAT_CHECK_GRACE_MS = 1500;

export function useMovementSession() {
  const [trace, setTrace] = useState<number[]>([]);

  const framesRef = useRef<number[]>([]);
  const gravityRef = useRef({ x: 0, y: 0, z: 0 });
  const gravityInitializedRef = useRef(false);
  const isFlatRef = useRef(false);
  const latestGyroRef = useRef({ x: 0, y: 0, z: 0 });
  const smoothedRef = useRef(0);
  const rollingLivenessRef = useRef(0);
  const startedAtRef = useRef(0);
  const lastTraceUpdateRef = useRef(0);
  const accelSubRef = useRef<{ remove: () => void } | null>(null);
  const gyroSubRef = useRef<{ remove: () => void } | null>(null);

  const reset = useCallback(() => {
    framesRef.current = [];
    gravityRef.current = { x: 0, y: 0, z: 0 };
    gravityInitializedRef.current = false;
    isFlatRef.current = false;
    latestGyroRef.current = { x: 0, y: 0, z: 0 };
    smoothedRef.current = 0;
    rollingLivenessRef.current = 0;
    startedAtRef.current = Date.now();
    lastTraceUpdateRef.current = 0;
    setTrace([]);
  }, []);

  const start = useCallback(() => {
    reset();
    Accelerometer.setUpdateInterval(SAMPLE_INTERVAL_MS);
    Gyroscope.setUpdateInterval(SAMPLE_INTERVAL_MS);

    gyroSubRef.current = Gyroscope.addListener((g) => {
      latestGyroRef.current = g;
    });

    accelSubRef.current = Accelerometer.addListener((a) => {
      const gravity = gravityRef.current;

      // Snap to the first real reading instead of starting from {0,0,0}.
      // Otherwise gravity (about 1g) reads as a huge false "movement" spike
      // for the first few samples, before the EMA below has time to catch up.
      if (!gravityInitializedRef.current) {
        gravity.x = a.x;
        gravity.y = a.y;
        gravity.z = a.z;
        gravityInitializedRef.current = true;
      } else {
        gravity.x = gravity.x * GRAVITY_EMA + a.x * (1 - GRAVITY_EMA);
        gravity.y = gravity.y * GRAVITY_EMA + a.y * (1 - GRAVITY_EMA);
        gravity.z = gravity.z * GRAVITY_EMA + a.z * (1 - GRAVITY_EMA);
      }

      const gravityMagnitude = Math.sqrt(gravity.x ** 2 + gravity.y ** 2 + gravity.z ** 2) || 1;
      const flatOrientation = Math.abs(gravity.z) / gravityMagnitude > FLATNESS_THRESHOLD;

      const linearX = a.x - gravity.x;
      const linearY = a.y - gravity.y;
      const linearZ = a.z - gravity.z;
      const linearMag = Math.sqrt(linearX ** 2 + linearY ** 2 + linearZ ** 2);

      const g = latestGyroRef.current;
      const rotationalMag = Math.sqrt(g.x ** 2 + g.y ** 2 + g.z ** 2);

      const rawMagnitude = linearMag * LINEAR_WEIGHT + rotationalMag * ROTATIONAL_WEIGHT;
      smoothedRef.current = smoothedRef.current * NOISE_EMA + rawMagnitude * (1 - NOISE_EMA);
      const magnitude = smoothedRef.current;

      rollingLivenessRef.current =
        rollingLivenessRef.current * LIVENESS_EMA + magnitude * magnitude * (1 - LIVENESS_EMA);
      const rollingMovement = Math.sqrt(rollingLivenessRef.current);

      // Flat orientation alone also matches "genuinely held flat", so only
      // report true when it's paired with sustained low movement too - the
      // actual signature of resting on a surface rather than a hand.
      const pastGracePeriod = Date.now() - startedAtRef.current > FLAT_CHECK_GRACE_MS;
      isFlatRef.current = flatOrientation && pastGracePeriod && rollingMovement < LIVE_STILLNESS_THRESHOLD;

      framesRef.current.push(magnitude);

      const now = Date.now();
      if (now - lastTraceUpdateRef.current >= TRACE_UPDATE_INTERVAL_MS) {
        lastTraceUpdateRef.current = now;
        setTrace((prev) => {
          const next = prev.length >= TRACE_LENGTH ? prev.slice(1) : prev.slice();
          next.push(magnitude);
          return next;
        });
      }
    });
  }, [reset]);

  const stop = useCallback(() => {
    accelSubRef.current?.remove();
    gyroSubRef.current?.remove();
    accelSubRef.current = null;
    gyroSubRef.current = null;
  }, []);

  const getFrames = useCallback(() => framesRef.current, []);
  const isFlat = useCallback(() => isFlatRef.current, []);

  return { trace, start, stop, reset, getFrames, isFlat };
}
