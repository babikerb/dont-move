const BAD_MESSAGES = [
  'Better luck next time.',
  'Everyone has an off run.',
  'Shake it off. Try again.',
  'That one happens. Try again.',
  'Not your best. Give it another go.',
];

const SOLID_MESSAGES = ['Solid run.', 'Nice and steady.', 'Good control.', 'Keep it up.'];

const GREAT_MESSAGES = ['Great hold.', 'Really steady.', 'Impressive stillness.'];

const EXCELLENT_MESSAGES = ['Outstanding.', 'Barely moved at all.', 'That is elite stillness.'];

function pickRandom(pool: string[]): string {
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getResultMessage(score: number): string {
  if (score < 82) return pickRandom(BAD_MESSAGES);
  if (score < 94) return pickRandom(SOLID_MESSAGES);
  if (score < 97) return pickRandom(GREAT_MESSAGES);
  return pickRandom(EXCELLENT_MESSAGES);
}
