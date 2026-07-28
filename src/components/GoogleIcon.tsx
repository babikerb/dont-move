import React from 'react';
import Svg, { Path } from 'react-native-svg';

// Google's standard multi-color "G" logomark, per their brand guidelines -
// used as-is rather than a generic icon, same principle as using Apple's
// official button component for the Apple button.
export function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Path
        fill="#4285F4"
        d="M19.6 10.23c0-.82-.07-1.42-.22-2.05H10v3.72h5.48c-.11.94-.71 2.35-2.04 3.3l3.16 2.45c1.89-1.75 2.98-4.32 2.98-7.42z"
      />
      <Path
        fill="#34A853"
        d="M10 20c2.7 0 4.96-.89 6.62-2.42l-3.16-2.45c-.87.59-2 .94-3.46.94-2.66 0-4.91-1.79-5.72-4.2H1.02v2.53C2.67 17.75 6.09 20 10 20z"
      />
      <Path
        fill="#FBBC05"
        d="M4.28 11.87c-.2-.59-.31-1.22-.31-1.87s.11-1.28.31-1.87V5.6H1.02A9.96 9.96 0 000 10c0 1.61.39 3.14 1.02 4.4l3.26-2.53z"
      />
      <Path
        fill="#EA4335"
        d="M10 3.96c1.47 0 2.79.5 3.83 1.49l2.87-2.87C14.95.99 12.7 0 10 0 6.09 0 2.67 2.25 1.02 5.6l3.26 2.53c.81-2.41 3.06-4.17 5.72-4.17z"
      />
    </Svg>
  );
}
