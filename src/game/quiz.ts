/** Drawing quiz questions: a random subset of the bank, each with shuffled options. */
import type { OptionIndex, Question } from '../content/types.ts';

export interface DrawnQuestion {
  /** Index into the level's question bank. */
  bank: number;
  question: Question;
  /** order[k] = original option index shown in position k. */
  order: OptionIndex[];
}

type Rng = () => number;

function shuffle<T>(xs: T[], rng: Rng): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Picks `n` questions. When the bank is big enough, questions from the previous attempt are used
 * only after all the others, so a retry mostly shows new questions.
 */
export function drawQuiz(bank: Question[], n: number, previous: number[] = [], rng: Rng = Math.random): DrawnQuestion[] {
  const fresh = shuffle(bank.map((_, i) => i).filter((i) => !previous.includes(i)), rng);
  const reused = shuffle(previous.filter((i) => i < bank.length), rng);
  const picked = [...fresh, ...reused].slice(0, n).sort((a, b) => a - b);
  return picked.map((i) => ({ bank: i, question: bank[i], order: shuffle([0, 1, 2, 3] as OptionIndex[], rng) }));
}

export function isCorrect(d: DrawnQuestion, shownIndex: number): boolean {
  return d.order[shownIndex] === d.question.answer;
}
