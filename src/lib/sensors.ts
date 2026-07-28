import { useCallback, useRef, useState } from 'react';
import { Accelerometer, Gyroscope } from 'expo-sensors';

const SAMPLE_INTERVAL_MS = 16; // ~60Hz, the highest frequency that stays stable across Expo-supported devices
const TRACE_UPDATE_INTERVAL_MS = 90;
export const TRACE_LENGTH = 140;

// Accelerometer reports in g, gyroscope in rad/s, so these scale both into one
// comparable movement range. Placeholder values, still need on-device
// calibration before the scoring curve in scoring.ts will feel fair.
const GRAVITY_EMA = 0.92;
const NOISE_EMA = 0.7;
const LINEAR_WEIGHT = 40;
const ROTATIONAL_WEIGHT = 25;

export function useMovementSession() {
  const [trace, setTrace] = useState<number[]>([]);

  const framesRef = useRef<number[]>([]);
  const gravityRef = useRef({ x: 0, y: 0, z: 0 });
  const gravityInitializedRef = useRef(false);
  const latestGyroRef = useRef({ x: 0, y: 0, z: 0 });
  const smoothedRef = useRef(0);
  const lastTraceUpdateRef = useRef(0);
  const accelSubRef = useRef<{ remove: () => void } | null>(null);
  const gyroSubRef = useRef<{ remove: () => void } | null>(null);

  const reset = useCallback(() => {
    framesRef.current = [];
    gravityRef.current = { x: 0, y: 0, z: 0 };
    gravityInitializedRef.current = false;
    latestGyroRef.current = { x: 0, y: 0, z: 0 };
    smoothedRef.current = 0;
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

      const linearX = a.x - gravity.x;
      const linearY = a.y - gravity.y;
      const linearZ = a.z - gravity.z;
      const linearMag = Math.sqrt(linearX ** 2 + linearY ** 2 + linearZ ** 2);

      const g = latestGyroRef.current;
      const rotationalMag = Math.sqrt(g.x ** 2 + g.y ** 2 + g.z ** 2);

      const rawMagnitude = linearMag * LINEAR_WEIGHT + rotationalMag * ROTATIONAL_WEIGHT;
      smoothedRef.current = smoothedRef.current * NOISE_EMA + rawMagnitude * (1 - NOISE_EMA);
      const magnitude = smoothedRef.current;

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

  return { trace, start, stop, reset, getFrames };
}
