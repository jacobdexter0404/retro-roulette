import { Card, CardValue, EvaluatedHand, HandRank } from '../types';

export function createDeck(): Card[] {
  const suits: Card['suit'][] = ['spades', 'hearts', 'diamonds', 'clubs'];
  const deck: Card[] = [];

  for (const suit of suits) {
    for (let value = 2; value <= 14; value++) {
      deck.push({
        suit,
        value: value as CardValue,
        id: `${suit}-${value}-${Math.random().toString(36).substring(2, 7)}`,
      });
    }
  }

  // Shuffle deck using Fisher-Yates
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

export function formatCardValue(value: CardValue): string {
  switch (value) {
    case 11:
      return 'J';
    case 12:
      return 'Q';
    case 13:
      return 'K';
    case 14:
      return 'A';
    default:
      return value.toString();
  }
}

// Generate combinations of 5 cards from n cards
function getCombinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length === 0) return [];
  const head = arr[0];
  const tail = arr.slice(1);
  const withHead = getCombinations(tail, k - 1).map((c) => [head, ...c]);
  const withoutHead = getCombinations(tail, k);
  return [...withHead, ...withoutHead];
}

// Evaluate a 5-card combination
function evaluateFiveCardHand(cards: Card[]): EvaluatedHand {
  const sorted = [...cards].sort((a, b) => b.value - a.value);
  const values = sorted.map((c) => c.value);

  const isFlush = sorted.every((c) => c.suit === sorted[0].suit);

  // Check straight
  let isStraight = false;
  let straightHigh = 0;

  // Normal straight check
  if (
    values[0] - values[1] === 1 &&
    values[1] - values[2] === 1 &&
    values[2] - values[3] === 1 &&
    values[3] - values[4] === 1
  ) {
    isStraight = true;
    straightHigh = values[0];
  } else if (
    values[0] === 14 &&
    values[1] === 5 &&
    values[2] === 4 &&
    values[3] === 3 &&
    values[4] === 2
  ) {
    // Ace-low straight (A-2-3-4-5)
    isStraight = true;
    straightHigh = 5;
  }

  // Count frequencies
  const counts: { [val: number]: number } = {};
  values.forEach((v) => {
    counts[v] = (counts[v] || 0) + 1;
  });

  const countEntries = Object.entries(counts).map(([v, count]) => ({
    val: parseInt(v, 10),
    count,
  }));

  // Sort by count descending, then value descending
  countEntries.sort((a, b) => b.count - a.count || b.val - a.val);

  // Royal Flush & Straight Flush
  if (isFlush && isStraight) {
    if (straightHigh === 14) {
      return {
        rank: 'Royal Flush',
        score: 9000000 + straightHigh,
        description: 'Royal Flush',
        bestFiveCards: sorted,
      };
    }
    return {
      rank: 'Straight Flush',
      score: 8000000 + straightHigh,
      description: `Straight Flush, ${formatCardValue(straightHigh as CardValue)} High`,
      bestFiveCards: sorted,
    };
  }

  // Four of a kind
  if (countEntries[0].count === 4) {
    const kicker = countEntries[1].val;
    return {
      rank: 'Four of a Kind',
      score: 7000000 + countEntries[0].val * 15 + kicker,
      description: `Four of a Kind, ${formatCardValue(countEntries[0].val as CardValue)}s`,
      bestFiveCards: sorted,
    };
  }

  // Full House
  if (countEntries[0].count === 3 && countEntries[1].count === 2) {
    return {
      rank: 'Full House',
      score: 6000000 + countEntries[0].val * 15 + countEntries[1].val,
      description: `Full House, ${formatCardValue(countEntries[0].val as CardValue)}s full of ${formatCardValue(countEntries[1].val as CardValue)}s`,
      bestFiveCards: sorted,
    };
  }

  // Flush
  if (isFlush) {
    const score =
      5000000 +
      values[0] * 15 ** 4 +
      values[1] * 15 ** 3 +
      values[2] * 15 ** 2 +
      values[3] * 15 +
      values[4];
    return {
      rank: 'Flush',
      score,
      description: `Flush, ${formatCardValue(values[0] as CardValue)} High`,
      bestFiveCards: sorted,
    };
  }

  // Straight
  if (isStraight) {
    return {
      rank: 'Straight',
      score: 4000000 + straightHigh,
      description: `Straight, ${formatCardValue(straightHigh as CardValue)} High`,
      bestFiveCards: sorted,
    };
  }

  // Three of a kind
  if (countEntries[0].count === 3) {
    const tripVal = countEntries[0].val;
    const kickers = countEntries.slice(1).map((e) => e.val);
    const score = 3000000 + tripVal * 15 ** 2 + kickers[0] * 15 + kickers[1];
    return {
      rank: 'Three of a Kind',
      score,
      description: `Three of a Kind, ${formatCardValue(tripVal as CardValue)}s`,
      bestFiveCards: sorted,
    };
  }

  // Two Pair
  if (countEntries[0].count === 2 && countEntries[1].count === 2) {
    const pair1 = countEntries[0].val;
    const pair2 = countEntries[1].val;
    const kicker = countEntries[2].val;
    const score = 2000000 + pair1 * 15 ** 2 + pair2 * 15 + kicker;
    return {
      rank: 'Two Pair',
      score,
      description: `Two Pair, ${formatCardValue(pair1 as CardValue)}s and ${formatCardValue(pair2 as CardValue)}s`,
      bestFiveCards: sorted,
    };
  }

  // One Pair
  if (countEntries[0].count === 2) {
    const pairVal = countEntries[0].val;
    const kickers = countEntries.slice(1).map((e) => e.val);
    const score =
      1000000 +
      pairVal * 15 ** 3 +
      kickers[0] * 15 ** 2 +
      kickers[1] * 15 +
      kickers[2];
    return {
      rank: 'One Pair',
      score,
      description: `One Pair of ${formatCardValue(pairVal as CardValue)}s`,
      bestFiveCards: sorted,
    };
  }

  // High Card
  const score =
    values[0] * 15 ** 4 +
    values[1] * 15 ** 3 +
    values[2] * 15 ** 2 +
    values[3] * 15 +
    values[4];

  return {
    rank: 'High Card',
    score,
    description: `High Card, ${formatCardValue(values[0] as CardValue)}`,
    bestFiveCards: sorted,
  };
}

// Evaluate best 5-card hand out of up to 7 cards
export function evaluate7CardHand(cards: Card[]): EvaluatedHand {
  if (cards.length < 5) {
    return {
      rank: 'High Card',
      score: 0,
      description: 'Incomplete Hand',
      bestFiveCards: cards,
    };
  }

  const combos = getCombinations(cards, 5);
  let bestHand: EvaluatedHand | null = null;

  for (const combo of combos) {
    const evalResult = evaluateFiveCardHand(combo);
    if (!bestHand || evalResult.score > bestHand.score) {
      bestHand = evalResult;
    }
  }

  return (
    bestHand || {
      rank: 'High Card',
      score: 0,
      description: 'High Card',
      bestFiveCards: cards.slice(0, 5),
    }
  );
}

// Calculate Blackjack Hand Value
export function evaluateBlackjackHand(cards: Card[]): { total: number; isSoft: boolean } {
  let total = 0;
  let aces = 0;

  for (const card of cards) {
    if (card.value === 14) {
      aces++;
      total += 11;
    } else if (card.value >= 10) {
      total += 10;
    } else {
      total += card.value;
    }
  }

  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  return { total, isSoft: aces > 0 && total <= 21 };
}
