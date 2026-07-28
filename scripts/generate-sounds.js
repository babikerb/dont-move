// One-off generator for placeholder countdown/GO tones (PCM16 WAV, no external assets needed).
// Run with: node scripts/generate-sounds.js
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;

function writeWav(filePath, samples) {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i++) {
    buffer.writeInt16LE(samples[i], 44 + i * 2);
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buffer);
}

function tone({ freq, durationMs, attackMs = 5, releaseMs = 40, amplitude = 0.5 }) {
  const totalSamples = Math.floor((durationMs / 1000) * SAMPLE_RATE);
  const attackSamples = Math.floor((attackMs / 1000) * SAMPLE_RATE);
  const releaseSamples = Math.floor((releaseMs / 1000) * SAMPLE_RATE);
  const samples = new Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    let envelope = 1;
    if (i < attackSamples) envelope = i / attackSamples;
    else if (i > totalSamples - releaseSamples) envelope = (totalSamples - i) / releaseSamples;

    const value = Math.sin((2 * Math.PI * freq * i) / SAMPLE_RATE) * envelope * amplitude;
    samples[i] = Math.max(-32767, Math.min(32767, Math.round(value * 32767)));
  }

  return samples;
}

const outDir = path.join(__dirname, '..', 'assets', 'sounds');

writeWav(path.join(outDir, 'tick.wav'), tone({ freq: 880, durationMs: 90, releaseMs: 30, amplitude: 0.4 }));
writeWav(path.join(outDir, 'go.wav'), tone({ freq: 1320, durationMs: 260, releaseMs: 120, amplitude: 0.5 }));
writeWav(path.join(outDir, 'pb.wav'), tone({ freq: 990, durationMs: 420, releaseMs: 200, amplitude: 0.5 }));
writeWav(path.join(outDir, 'click.wav'), tone({ freq: 600, durationMs: 40, releaseMs: 15, amplitude: 0.3 }));

console.log('Generated placeholder sounds in', outDir);
