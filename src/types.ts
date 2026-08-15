export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type CardValue = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14; // 11=J, 12=Q, 13=K, 14=Ace

export interface Card {
  suit: Suit;
  value: CardValue;
  id: string;
}

export type GameMode = 'poker' | 'blackjack' | 'roulette' | 'bank' | 'stats';

export interface Player {
  id: string;
  name: string;
  chips: number;
  cards: Card[];
  currentBet: number;
  folded: boolean;
  isAI: boolean;
  isCurrentTurn?: boolean;
  lastAction?: string;
}

export type PokerStage = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

export type HandRank =
  | 'High Card'
  | 'One Pair'
  | 'Two Pair'
  | 'Three of a Kind'
  | 'Straight'
  | 'Flush'
  | 'Full House'
  | 'Four of a Kind'
  | 'Straight Flush'
  | 'Royal Flush';

export interface EvaluatedHand {
  rank: HandRank;
  score: number;
  description: string;
  bestFiveCards: Card[];
}

export interface BlackjackHand {
  cards: Card[];
  bet: number;
  status: 'playing' | 'stood' | 'busted' | 'blackjack' | 'doubled';
}

export type RouletteBetType =
  | 'single'
  | 'red'
  | 'black'
  | 'even'
  | 'odd'
  | 'low' // 1-18
  | 'high' // 19-36
  | 'dozen1' // 1-12
  | 'dozen2' // 13-24
  | 'dozen3'; // 25-36

export interface RouletteBet {
  id: string;
  type: RouletteBetType;
  targetNumber?: number;
  amount: number;
}

export interface GameStats {
  pokerHandsPlayed: number;
  pokerHandsWon: number;
  pokerTotalEarnings: number;
  bjHandsPlayed: number;
  bjHandsWon: number;
  bjTotalEarnings: number;
  rouletteSpins: number;
  rouletteWins: number;
  rouletteTotalEarnings: number;
  biggestWin?: number;
  playerName?: string;
}
