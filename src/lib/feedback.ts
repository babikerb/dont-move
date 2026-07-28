import { hapticButton } from './haptics';
import { playSound } from './sound';

export function tapFeedback(): void {
  hapticButton();
  playSound('click');
}
