import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Card, BlackjackHand } from '../types';
import { createDeck, evaluateBlackjackHand } from '../utils/pokerEvaluator';
import { CardComponent } from './Card';
import { Chip } from './Chip';
import { sounds } from '../utils/sound';
import { ArrowRight, RotateCcw, AlertCircle, ShieldAlert } from 'lucide-react';

interface BlackjackGameProps {
  balance: number;
  onUpdateBalance: (newBalance: number) => void;
  onRecordHand: (won: boolean, netEarnings: number) => void;
}

export const BlackjackGame: React.FC<BlackjackGameProps> = ({
  balance,
  onUpdateBalance,
  onRecordHand,
}) => {
  const [deck, setDeck] = useState<Card[]>([]);
  const [bet, setBet] = useState<number>(25);
  const [selectedChip, setSelectedChip] = useState<number>(25);

  const [playerHand, setPlayerHand] = useState<BlackjackHand>({
    cards: [],
    bet: 0,
    status: 'playing',
  });

  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [dealerHidden, setDealerHidden] = useState<boolean>(true);
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'dealerTurn' | 'ended'>('betting');
  const [message, setMessage] = useState<string>('Select chip bet and deal');

  // Deal initial Blackjack cards
  const startDeal = () => {
    if (balance < bet) {
      setMessage('Insufficient balance!');
      return;
    }

    sounds.playCardDeal();

    // Deduct bet from balance
    const newBal = balance - bet;
    onUpdateBalance(newBal);

    const newDeck = createDeck();
    const pCard1 = newDeck[0];
    const dCard1 = newDeck[1];
    const pCard2 = newDeck[2];
    const dCard2 = newDeck[3];
    const remDeck = newDeck.slice(4);

    const pCards = [pCard1, pCard2];
    const dCards = [dCard1, dCard2];

    setDeck(remDeck);
    setPlayerHand({ cards: pCards, bet, status: 'playing' });
    setDealerHand(dCards);
    setDealerHidden(true);

    const pVal = evaluateBlackjackHand(pCards);
    const dVal = evaluateBlackjackHand(dCards);

    // Natural Blackjack checks
    if (pVal.total === 21 || dVal.total === 21) {
      setDealerHidden(false);
      setGameState('ended');

      if (pVal.total === 21 && dVal.total === 21) {
        // Both dealt Natural 21 -> PUSH
        sounds.playChipClick();
        onUpdateBalance(newBal + bet); // Refund bet
        onRecordHand(false, 0);
        setMessage(`DRAW / PUSH! Both dealt Blackjack (21). $${bet} bet returned.`);
      } else if (pVal.total === 21) {
        // Player Natural 21 -> 3:2 payout
        sounds.playWinChime();
        const profit = Math.floor(bet * 1.5);
        onUpdateBalance(newBal + bet + profit);
        onRecordHand(true, profit);
        setMessage(`BLACKJACK! 3:2 Payout! You win $${profit}!`);
      } else {
        // Dealer Natural 21 -> Dealer wins
        sounds.playLossTone();
        onRecordHand(false, -bet);
        setMessage(`Dealer dealt Blackjack (21). Dealer wins.`);
      }
      return;
    }

    setGameState('playing');
    setMessage('Your turn: Hit, Stand, or Double Down');
  };

  // Hit
  const handleHit = () => {
    sounds.playCardDeal();

    const nextCard = deck[0];
    const remDeck = deck.slice(1);
    const updatedCards = [...playerHand.cards, nextCard];
    const val = evaluateBlackjackHand(updatedCards);

    setDeck(remDeck);

    if (val.total > 21) {
      sounds.playLossTone();
      setPlayerHand({ cards: updatedCards, bet, status: 'busted' });
      setDealerHidden(false);
      setGameState('ended');
      onRecordHand(false, -bet);
      setMessage(`BUST! Total: ${val.total}. Dealer wins.`);
    } else if (val.total === 21) {
      // Auto-stand when reaching 21
      setPlayerHand({ cards: updatedCards, bet, status: 'stood' });
      setDealerHidden(false);
      setGameState('dealerTurn');
      runDealerTurn(updatedCards, [...dealerHand], remDeck, bet);
    } else {
      setPlayerHand({ cards: updatedCards, bet, status: 'playing' });
    }
  };

  // Stand
  const handleStand = () => {
    sounds.playChipClick();
    setPlayerHand((prev) => ({ ...prev, status: 'stood' }));
    setDealerHidden(false);
    setGameState('dealerTurn');

    // Run dealer logic
    runDealerTurn(playerHand.cards, [...dealerHand], deck, bet);
  };

  // Double Down
  const handleDoubleDown = () => {
    if (balance < bet) {
      setMessage('Cannot double: insufficient funds!');
      return;
    }

    sounds.playCardDeal();

    // Deduct extra bet from balance
    const currentBet = bet * 2;
    const currentBal = balance - bet;
    onUpdateBalance(currentBal);

    const nextCard = deck[0];
    const remDeck = deck.slice(1);
    const updatedCards = [...playerHand.cards, nextCard];
    const val = evaluateBlackjackHand(updatedCards);

    setDeck(remDeck);

    if (val.total > 21) {
      sounds.playLossTone();
      setPlayerHand({ cards: updatedCards, bet: currentBet, status: 'busted' });
      setDealerHidden(false);
      setGameState('ended');
      onRecordHand(false, -currentBet);
      setMessage(`BUST on Double Down (${val.total})!`);
    } else {
      setPlayerHand({ cards: updatedCards, bet: currentBet, status: 'doubled' });
      setDealerHidden(false);
      setGameState('dealerTurn');
      runDealerTurn(updatedCards, [...dealerHand], remDeck, currentBet);
    }
  };

  // Dealer turn execution
  const runDealerTurn = (playerCards: Card[], currentDealerCards: Card[], currentDeck: Card[], activeBet: number = bet) => {
    let dCards = [...currentDealerCards];
    let remDeck = [...currentDeck];
    let dVal = evaluateBlackjackHand(dCards);

    while (dVal.total < 17 && remDeck.length > 0) {
      dCards.push(remDeck[0]);
      remDeck = remDeck.slice(1);
      dVal = evaluateBlackjackHand(dCards);
    }

    setDealerHand(dCards);
    setDeck(remDeck);
    setGameState('ended');

    const pVal = evaluateBlackjackHand(playerCards);

    if (dVal.total > 21) {
      sounds.playWinChime();
      onUpdateBalance(balance + activeBet * 2);
      onRecordHand(true, activeBet);
      setMessage(`Dealer Busted (${dVal.total})! You win $${activeBet}!`);
    } else if (pVal.total > dVal.total) {
      sounds.playWinChime();
      onUpdateBalance(balance + activeBet * 2);
      onRecordHand(true, activeBet);
      setMessage(`YOU WIN $${activeBet}! (${pVal.total} vs ${dVal.total})`);
    } else if (pVal.total < dVal.total) {
      sounds.playLossTone();
      onRecordHand(false, -activeBet);
      setMessage(`Dealer wins (${dVal.total} vs ${pVal.total}).`);
    } else {
      // PUSH / DRAW: Both have equal total
      sounds.playChipClick();
      onUpdateBalance(balance + activeBet); // Return active bet
      onRecordHand(false, 0); // 0 net earnings
      setMessage(`DRAW / PUSH (${pVal.total} vs ${dVal.total})! Bet of $${activeBet} returned.`);
    }
  };

  const pScore = evaluateBlackjackHand(playerHand.cards);
  const dScore = evaluateBlackjackHand(dealerHidden ? dealerHand.slice(0, 1) : dealerHand);

  return (
    <div className="w-full min-h-full flex flex-col justify-between p-3 sm:p-4 pb-12 text-white font-sans max-w-md mx-auto select-none overflow-y-auto">
      {/* Dealer Hand Area */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-4 flex flex-col items-center gap-3 shadow-xl relative">
        <div className="flex items-center justify-between w-full font-mono text-xs text-zinc-400 px-1">
          <span className="font-bold text-white uppercase tracking-wider">DEALER</span>
          <span className="bg-zinc-900 border border-zinc-700 px-2.5 py-0.5 rounded-full text-white font-bold">
            {dealerHand.length > 0 ? (dealerHidden ? `?` : dScore.total) : '0'}
          </span>
        </div>

        {/* Dealer Cards */}
        <div className="flex items-center justify-center gap-2 min-h-[90px] my-1">
          {dealerHand.length > 0 ? (
            dealerHand.map((c, i) => (
              <CardComponent key={i} card={c} faceDown={i === 1 && dealerHidden} size="md" />
            ))
          ) : (
            <div className="text-xs text-zinc-600 font-mono py-4">Waiting for deal</div>
          )}
        </div>

        {/* Message Banner */}
        <div className="text-center font-mono text-xs text-zinc-300 bg-zinc-900/80 px-3 py-1 rounded-full border border-zinc-800">
          {message}
        </div>
      </div>

      {/* Player Hand & Controls Area */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-4 flex flex-col gap-3 shadow-2xl my-3">
        {/* Player Status Bar */}
        <div className="flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold bg-white text-black px-2.5 py-0.5 rounded-full text-[10px]">
              YOU
            </span>
            <span className="text-zinc-400">Bet: ${playerHand.bet || bet}</span>
          </div>

          <span className="bg-black border border-zinc-700 px-2.5 py-0.5 rounded-full text-white font-bold">
            {playerHand.cards.length > 0 ? pScore.total : 0}
          </span>
        </div>

        {/* Player Cards */}
        <div className="flex items-center justify-center gap-2 min-h-[110px] my-2">
          {playerHand.cards.length > 0 ? (
            playerHand.cards.map((c, i) => <CardComponent key={i} card={c} size="lg" />)
          ) : (
            <div className="text-xs text-zinc-500 font-mono py-6">Select bet and tap Deal</div>
          )}
        </div>

        {/* Action Controls */}
        {gameState === 'betting' || gameState === 'ended' ? (
          <div className="flex flex-col gap-3">
            {/* Chip Selection Row */}
            <div className="flex items-center justify-around bg-black/60 p-2 rounded-2xl border border-zinc-800">
              {[10, 25, 50, 100, 500].map((val) => (
                <Chip
                  key={val}
                  value={val}
                  size="md"
                  selected={bet === val}
                  onClick={() => {
                    sounds.playChipClick();
                    setBet(val);
                  }}
                />
              ))}
            </div>

            <button
              onClick={startDeal}
              className="w-full py-3.5 bg-white text-black font-mono font-bold text-sm rounded-2xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <span>DEAL BLACKJACK (${bet})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              onClick={handleHit}
              disabled={gameState !== 'playing'}
              className="py-3 bg-zinc-950 border border-zinc-500 text-white font-mono font-bold text-xs rounded-xl hover:bg-zinc-800 disabled:opacity-40"
            >
              HIT
            </button>

            <button
              onClick={handleStand}
              disabled={gameState !== 'playing'}
              className="py-3 bg-white text-black font-mono font-bold text-xs rounded-xl hover:bg-zinc-200 disabled:opacity-40"
            >
              STAND
            </button>

            <button
              onClick={handleDoubleDown}
              disabled={gameState !== 'playing' || playerHand.cards.length !== 2 || balance < bet}
              className="py-3 bg-zinc-950 border border-zinc-700 text-zinc-300 font-mono font-bold text-xs rounded-xl hover:text-white disabled:opacity-30"
            >
              DOUBLE 2x
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
