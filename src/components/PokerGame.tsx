import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, Player, PokerStage, EvaluatedHand } from '../types';
import { createDeck, evaluate7CardHand } from '../utils/pokerEvaluator';
import { CardComponent } from './Card';
import { Chip } from './Chip';
import { sounds } from '../utils/sound';
import { RotateCcw, AlertCircle, ArrowRight, Trophy, SlidersHorizontal, Flame } from 'lucide-react';

interface PokerGameProps {
  balance: number;
  onUpdateBalance: (newBalance: number) => void;
  onRecordHand: (won: boolean, netEarnings: number) => void;
}

const SMALL_BLIND = 10;
const BIG_BLIND = 20;

// Dynamic stack helper: calculates opponent stacks commensurate with player balance
const calculateBotStartingChips = (playerBalance: number, botIndex: number): number => {
  const multiplier = botIndex === 1 ? 1.15 : 1.05;
  const calculated = Math.round(playerBalance * multiplier);
  return Math.max(1000, calculated);
};

export const PokerGame: React.FC<PokerGameProps> = ({
  balance,
  onUpdateBalance,
  onRecordHand,
}) => {
  const [communityPool, setCommunityPool] = useState<Card[]>([]);
  const [communityCards, setCommunityCards] = useState<Card[]>([]);
  const [pot, setPot] = useState<number>(0);
  const [currentBet, setCurrentBet] = useState<number>(BIG_BLIND);
  const [pokerStage, setPokerStage] = useState<PokerStage>('preflop');
  const [message, setMessage] = useState<string>('Select your stake and deal');
  const [handWinner, setHandWinner] = useState<string | null>(null);
  const [winnerEval, setWinnerEval] = useState<EvaluatedHand | null>(null);

  const [players, setPlayers] = useState<Player[]>([
    { id: 'user', name: 'YOU', chips: balance, cards: [], currentBet: 0, folded: false, isAI: false },
    { id: 'ai1', name: 'BOT 1', chips: calculateBotStartingChips(balance, 1), cards: [], currentBet: 0, folded: false, isAI: true },
    { id: 'ai2', name: 'BOT 2', chips: calculateBotStartingChips(balance, 2), cards: [], currentBet: 0, folded: false, isAI: true },
  ]);

  const [activePlayerIndex, setActivePlayerIndex] = useState<number>(0);
  const [isHandInProgress, setIsHandInProgress] = useState<boolean>(false);

  // Chip betting state (25, 50, 100, custom / all-in)
  const [selectedChipType, setSelectedChipType] = useState<'25' | '50' | '100' | 'custom'>('25');
  const [customChipAmount, setCustomChipAmount] = useState<number>(200);
  const [isAdjustingCustom, setIsAdjustingCustom] = useState<boolean>(false);

  const user = players[0];
  const availableChips = isHandInProgress ? user.chips : balance;
  const effectiveCustomBet = Math.max(1, Math.min(customChipAmount, Math.max(1, availableChips)));
  const isCustomAllIn = availableChips > 0 && effectiveCustomBet >= availableChips;

  const getSelectedAmount = () => {
    if (selectedChipType === '25') return 25;
    if (selectedChipType === '50') return 50;
    if (selectedChipType === '100') return 100;
    return effectiveCustomBet;
  };

  const activeStakeAmount = getSelectedAmount();
  const isAllInSelected = selectedChipType === 'custom' && isCustomAllIn;

  // Sync user chips and dynamic bot chip stacks based on player balance when not in hand
  useEffect(() => {
    if (!isHandInProgress) {
      setPlayers((prev) => [
        { ...prev[0], chips: balance },
        { ...prev[1], chips: Math.max(prev[1]?.chips || 0, calculateBotStartingChips(balance, 1)) },
        { ...prev[2], chips: Math.max(prev[2]?.chips || 0, calculateBotStartingChips(balance, 2)) },
      ]);
    }
  }, [balance, isHandInProgress]);

  // Start new Poker hand
  const startNewHand = () => {
    if (balance < BIG_BLIND) {
      setMessage('Insufficient balance! Top up in Bank.');
      return;
    }

    sounds.playCardDeal();

    const newDeck = createDeck();
    let deckIdx = 0;

    // Deal 2 cards to each player & ensure bots have dynamic stacks matching balance
    const updatedPlayers = players.map((player, idx) => {
      const c1 = newDeck[deckIdx++];
      const c2 = newDeck[deckIdx++];
      const currentStack = player.isAI
        ? Math.max(player.chips, calculateBotStartingChips(balance, idx))
        : balance;

      return {
        ...player,
        chips: currentStack,
        cards: [c1, c2],
        currentBet: 0,
        folded: false,
        lastAction: undefined,
      };
    });

    // 5 community cards pre-dealt into communityPool
    const pool = [
      newDeck[deckIdx++],
      newDeck[deckIdx++],
      newDeck[deckIdx++],
      newDeck[deckIdx++],
      newDeck[deckIdx++],
    ];

    // Blinds
    const initialBlind = Math.min(SMALL_BLIND, balance);
    let newBalance = balance - initialBlind;
    updatedPlayers[0].chips = newBalance;
    updatedPlayers[0].currentBet = initialBlind;

    const bot1Blind = Math.min(BIG_BLIND, updatedPlayers[1].chips);
    updatedPlayers[1].chips -= bot1Blind;
    updatedPlayers[1].currentBet = bot1Blind;

    onUpdateBalance(newBalance);

    setCommunityPool(pool);
    setCommunityCards([]);
    setPlayers(updatedPlayers);
    setPot(initialBlind + bot1Blind);
    setCurrentBet(BIG_BLIND);
    setPokerStage('preflop');
    setHandWinner(null);
    setWinnerEval(null);
    setIsHandInProgress(true);
    setActivePlayerIndex(0);
    setMessage('Pre-Flop: Place your bet or check');
  };

  // Helper to advance stage
  const advanceStage = (pool: Card[], currentStage: PokerStage) => {
    let nextStage: PokerStage = 'flop';
    let newCommunity: Card[] = [];

    if (currentStage === 'preflop') {
      nextStage = 'flop';
      sounds.playCardDeal();
      newCommunity = pool.slice(0, 3);
      setMessage('Flop: First 3 community cards dealt');
    } else if (currentStage === 'flop') {
      nextStage = 'turn';
      sounds.playCardDeal();
      newCommunity = pool.slice(0, 4);
      setMessage('Turn: 4th community card dealt');
    } else if (currentStage === 'turn') {
      nextStage = 'river';
      sounds.playCardDeal();
      newCommunity = pool.slice(0, 5);
      setMessage('River: Final 5th community card dealt');
    } else if (currentStage === 'river') {
      handleShowdown(pool);
      return;
    }

    setPokerStage(nextStage);
    setCommunityCards(newCommunity);

    // Reset round bets for all active players
    setPlayers((prev) =>
      prev.map((p) => ({ ...p, currentBet: 0, lastAction: undefined }))
    );
    setCurrentBet(0);
    setActivePlayerIndex(0);
  };

  // AI Turn simulator with intelligent hand evaluation and high-stakes wager matching
  const processAITurns = (
    currentPlayers: Player[],
    currentPotVal: number,
    targetBet: number,
    stage: PokerStage,
    pool: Card[]
  ) => {
    let tempPlayers = [...currentPlayers];
    let tempPot = currentPotVal;
    let tempBet = targetBet;

    for (let i = 1; i < tempPlayers.length; i++) {
      const ai = tempPlayers[i];
      if (ai.folded || ai.chips <= 0) continue;

      const callAmt = tempBet - ai.currentBet;
      if (callAmt > 0) {
        const actualCall = Math.min(callAmt, ai.chips);

        // Determine AI hand strength
        let isStrongHand = false;
        let isModerateHand = false;

        const currentCommunity = pool.slice(
          0,
          stage === 'flop' ? 3 : stage === 'turn' ? 4 : stage === 'river' ? 5 : 0
        );

        if (currentCommunity.length >= 3 && ai.cards.length === 2) {
          const evalResult = evaluate7CardHand([...ai.cards, ...currentCommunity]);
          if (evalResult.score >= 1000000) {
            // One pair or better
            isStrongHand = true;
          } else {
            const maxVal = Math.max(ai.cards[0].value, ai.cards[1].value);
            if (maxVal >= 11) isModerateHand = true;
          }
        } else if (ai.cards.length === 2) {
          // Pre-flop evaluation: pocket pair, high cards, suited or connected cards
          const [c1, c2] = ai.cards;
          const isPair = c1.value === c2.value;
          const maxVal = Math.max(c1.value, c2.value);
          const isSuited = c1.suit === c2.suit;
          const isConnected = Math.abs(c1.value - c2.value) <= 2;

          if (isPair || maxVal >= 12 || (maxVal >= 10 && (isSuited || isConnected))) {
            isStrongHand = true;
          } else if (maxVal >= 9) {
            isModerateHand = true;
          }
        }

        // Relative wager proportion vs total bot bankroll
        const totalStack = ai.chips + ai.currentBet;
        const betRatio = totalStack > 0 ? callAmt / totalStack : 1;

        // Opponents match high stakes easily; they only fold on massive bets (>85% stack) with very weak cards
        let shouldFold = false;
        if (betRatio > 0.85 && !isStrongHand && !isModerateHand) {
          shouldFold = Math.random() < 0.2;
        } else if (betRatio > 0.95 && !isStrongHand) {
          shouldFold = Math.random() < 0.15;
        }

        if (shouldFold) {
          ai.folded = true;
          ai.lastAction = 'FOLD';
        } else {
          ai.chips -= actualCall;
          ai.currentBet += actualCall;
          tempPot += actualCall;
          const isAllIn = ai.chips === 0;
          ai.lastAction = isAllIn ? 'ALL IN' : `CALL $${actualCall.toLocaleString()}`;
        }
      } else {
        ai.lastAction = 'CHECK';
      }
    }

    setPlayers(tempPlayers);
    setPot(tempPot);
    setCurrentBet(tempBet);

    const activePlayers = tempPlayers.filter((p) => !p.folded);
    if (activePlayers.length === 1) {
      handleSingleWinner(activePlayers[0]);
      return;
    }

    advanceStage(pool, stage);
  };

  const resolveHandAfterUserFold = (
    currentPlayers: Player[],
    currentPotVal: number,
    targetBet: number,
    pool: Card[]
  ) => {
    let tempPlayers = [...currentPlayers];
    let tempPot = currentPotVal;
    let tempBet = targetBet;

    for (let i = 1; i < tempPlayers.length; i++) {
      const ai = tempPlayers[i];
      if (ai.folded || ai.chips <= 0) continue;

      const callAmt = tempBet - ai.currentBet;
      if (callAmt > 0) {
        const actualCall = Math.min(callAmt, ai.chips);
        ai.chips -= actualCall;
        ai.currentBet += actualCall;
        tempPot += actualCall;
        ai.lastAction = ai.chips === 0 ? 'ALL IN' : `CALL $${actualCall.toLocaleString()}`;
      } else {
        ai.lastAction = 'CHECK';
      }
    }

    const activePlayers = tempPlayers.filter((p) => !p.folded);
    const finalCommunity = pool.slice(0, 5);

    setCommunityCards(finalCommunity);
    setPokerStage('showdown');
    setIsHandInProgress(false);
    setPot(tempPot);
    setPlayers(tempPlayers);

    if (activePlayers.length === 1) {
      const winner = activePlayers[0];
      setHandWinner(winner.name);
      sounds.playLossTone();
      onRecordHand(false, -BIG_BLIND);
      setMessage(`You folded. ${winner.name} wins $${tempPot.toLocaleString()}!`);
      return;
    }

    let bestScore = -1;
    let winningPlayer: Player | null = null;
    let winningEval: EvaluatedHand | null = null;

    activePlayers.forEach((player) => {
      const allSeven = [...player.cards, ...finalCommunity];
      const evaluated = evaluate7CardHand(allSeven);
      if (evaluated.score > bestScore) {
        bestScore = evaluated.score;
        winningPlayer = player;
        winningEval = evaluated;
      }
    });

    if (winningPlayer) {
      const winner = winningPlayer as Player;
      setHandWinner(winner.name);
      setWinnerEval(winningEval);
      sounds.playLossTone();
      onRecordHand(false, -BIG_BLIND);
      setMessage(`You folded. ${winner.name} wins $${tempPot.toLocaleString()} with ${winningEval?.description}`);
    }
  };

  // User Actions
  const handleUserFold = () => {
    sounds.playChipClick();
    const updated = [...players];
    updated[0].folded = true;
    updated[0].lastAction = 'FOLD';
    setPlayers(updated);

    const active = updated.filter((p) => !p.folded);
    if (active.length === 1) {
      handleSingleWinner(active[0]);
    } else {
      resolveHandAfterUserFold(updated, pot, currentBet, communityPool);
    }
  };

  const handleUserCheckCall = () => {
    sounds.playChipClick();
    const updated = [...players];
    const userPlayer = updated[0];
    const callAmount = currentBet - userPlayer.currentBet;

    let potAddition = 0;
    if (callAmount > 0) {
      const actualCall = Math.min(callAmount, userPlayer.chips);
      userPlayer.chips -= actualCall;
      userPlayer.currentBet += actualCall;
      const newBalance = balance - actualCall;
      onUpdateBalance(newBalance);
      potAddition = actualCall;
      setPot((prev) => prev + actualCall);
      userPlayer.lastAction = userPlayer.chips === 0 ? 'ALL IN' : `CALL $${actualCall.toLocaleString()}`;
    } else {
      userPlayer.lastAction = 'CHECK';
    }

    setPlayers(updated);
    processAITurns(updated, pot + potAddition, currentBet, pokerStage, communityPool);
  };

  const handleUserRaise = (raiseByAmount: number) => {
    sounds.playChipClick();
    const updated = [...players];
    const userPlayer = updated[0];

    const actualRaise = Math.min(raiseByAmount, userPlayer.chips);
    if (actualRaise <= 0) return;

    userPlayer.chips -= actualRaise;
    const targetTotalBet = currentBet + actualRaise;
    userPlayer.currentBet += actualRaise;
    const newBalance = balance - actualRaise;
    onUpdateBalance(newBalance);

    const newPot = pot + actualRaise;
    setPot(newPot);
    setCurrentBet(targetTotalBet);
    userPlayer.lastAction = (isCustomAllIn && selectedChipType === 'custom') || userPlayer.chips === 0 ? 'ALL IN' : `RAISE $${actualRaise.toLocaleString()}`;

    setPlayers(updated);
    processAITurns(updated, newPot, targetTotalBet, pokerStage, communityPool);
  };

  const handleSingleWinner = (winner: Player) => {
    setHandWinner(winner.name);
    setIsHandInProgress(false);

    if (winner.id === 'user') {
      sounds.playWinChime();
      const newBal = balance + pot;
      onUpdateBalance(newBal);
      onRecordHand(true, pot);
      setMessage(`All opponents folded! You win the $${pot.toLocaleString()} pot!`);
    } else {
      sounds.playLossTone();
      onRecordHand(false, -BIG_BLIND);
      setMessage(`You folded. ${winner.name} wins $${pot.toLocaleString()}!`);
      // Update bot chip stack with pot winnings
      setPlayers((prev) =>
        prev.map((p) => (p.id === winner.id ? { ...p, chips: p.chips + pot } : p))
      );
    }
  };

  const handleShowdown = (pool: Card[]) => {
    setPokerStage('showdown');
    setIsHandInProgress(false);
    const finalCommunity = pool.slice(0, 5);
    setCommunityCards(finalCommunity);

    const activePlayers = players.filter((p) => !p.folded);

    let bestScore = -1;
    let winningPlayer: Player | null = null;
    let winningEval: EvaluatedHand | null = null;

    activePlayers.forEach((player) => {
      const allSeven = [...player.cards, ...finalCommunity];
      const evaluated = evaluate7CardHand(allSeven);
      if (evaluated.score > bestScore) {
        bestScore = evaluated.score;
        winningPlayer = player;
        winningEval = evaluated;
      }
    });

    if (winningPlayer) {
      const winner = winningPlayer as Player;
      setHandWinner(winner.name);
      setWinnerEval(winningEval);

      if (winner.id === 'user') {
        sounds.playWinChime();
        const newBal = balance + pot;
        onUpdateBalance(newBal);
        onRecordHand(true, pot);
        setMessage(`WINNER! ${winner.name} wins $${pot.toLocaleString()} with ${winningEval?.description}`);
      } else {
        sounds.playLossTone();
        onRecordHand(false, -BIG_BLIND);
        setMessage(`${winner.name} wins $${pot.toLocaleString()} with ${winningEval?.description}`);
        // Update bot chip stack with pot winnings
        setPlayers((prev) =>
          prev.map((p) => (p.id === winner.id ? { ...p, chips: p.chips + pot } : p))
        );
      }
    }
  };

  const userCallAmt = Math.max(0, currentBet - user.currentBet);

  const getStageBadge = () => {
    switch (pokerStage) {
      case 'preflop':
        return 'ROUND 1/4: PRE-FLOP BETS';
      case 'flop':
        return 'ROUND 2/4: FLOP BETS (3 CARDS)';
      case 'turn':
        return 'ROUND 3/4: TURN BETS (4 CARDS)';
      case 'river':
        return 'ROUND 4/4: RIVER BETS (FINAL 5 CARDS)';
      case 'showdown':
        return 'SHOWDOWN: HANDS REVEALED';
    }
  };

  return (
    <div id="poker-game-container" className="w-full min-h-full flex flex-col justify-between p-3 sm:p-4 pb-12 text-white font-sans max-w-md mx-auto select-none overflow-y-auto">
      {/* Table Top: Community Cards & Pot */}
      <div className="flex flex-col items-center gap-2.5 bg-zinc-950 border border-zinc-800 rounded-3xl p-3.5 sm:p-4 shadow-xl relative shrink-0">
        {/* Pot & Round Stage Header */}
        <div className="flex items-center justify-between w-full">
          <span className="text-[10px] font-mono font-bold bg-zinc-900 border border-zinc-700 text-zinc-300 px-2.5 py-1 rounded-full uppercase tracking-wider">
            {getStageBadge()}
          </span>

          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-full shadow-inner">
            <span className="text-[10px] text-zinc-400 font-mono uppercase">POT</span>
            <span className="font-mono font-extrabold text-base text-white">${pot.toLocaleString()}</span>
          </div>
        </div>

        {/* Community Cards Display */}
        <div className="w-full overflow-x-auto py-1">
          <div className="flex items-center justify-center gap-2 min-w-max mx-auto px-1 py-1 min-h-[80px]">
            {Array.from({ length: 5 }).map((_, idx) => {
              const card = communityCards[idx];
              return (
                <CardComponent
                  key={idx}
                  card={card}
                  faceDown={!card}
                  size="responsive"
                  className={!card ? 'opacity-40' : ''}
                />
              );
            })}
          </div>
        </div>

        {/* Stage & Status Message */}
        <div className="text-center font-mono text-xs text-zinc-300 bg-zinc-900/80 px-3 py-1 rounded-full border border-zinc-800 max-w-full truncate">
          {message}
        </div>
      </div>

      {/* Opponents (Bots) Row */}
      <div className="grid grid-cols-2 gap-3 my-3">
        {players.slice(1).map((bot) => (
          <div
            key={bot.id}
            className={`bg-zinc-900 border rounded-2xl p-2.5 flex flex-col items-center justify-center gap-1.5 transition-all ${
              bot.folded
                ? 'border-zinc-800 opacity-40'
                : handWinner === bot.name
                ? 'border-white bg-zinc-800'
                : 'border-zinc-800'
            }`}
          >
            <div className="flex items-center justify-between w-full text-[11px] font-mono font-bold text-zinc-400 px-1">
              <span>{bot.name}</span>
              <span className="text-white">${bot.chips.toLocaleString()}</span>
            </div>

            {/* Cards */}
            <div className="flex items-center gap-1">
              {bot.cards.map((c, i) => (
                <CardComponent
                  key={i}
                  card={pokerStage === 'showdown' ? c : undefined}
                  faceDown={pokerStage !== 'showdown' && !bot.folded}
                  size="sm"
                />
              ))}
            </div>

            {/* Action pill */}
            {bot.lastAction && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black border border-zinc-700 text-zinc-300">
                {bot.lastAction}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* User Hand & Actions Area */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-4 flex flex-col gap-3 shadow-2xl">
        {/* User Status Bar */}
        <div className="flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white bg-white text-black px-2 py-0.5 rounded-full text-[10px]">
              YOU
            </span>
            <span className="text-zinc-400">${user.chips.toLocaleString()}</span>
          </div>

          {pokerStage === 'showdown' && winnerEval && handWinner === 'YOU' && (
            <span className="text-white font-bold flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" /> {winnerEval.rank}
            </span>
          )}
        </div>

        {/* User Cards */}
        <div className="w-full overflow-x-auto py-1">
          <div className="flex items-center justify-center gap-3 min-w-max mx-auto px-1 py-1 min-h-[80px]">
            {user.cards.length > 0 ? (
              user.cards.map((c, i) => (
                <CardComponent key={i} card={c} size="responsive" />
              ))
            ) : (
              <div className="flex items-center gap-3 text-zinc-600 font-mono text-xs py-4">
                <span>Deal a new hand to play</span>
              </div>
            )}
          </div>
        </div>

        {/* POKER CHIP BET SELECTOR (25, 50, 100, and Adjustable 4th Chip) */}
        <div className="flex flex-col gap-2 pt-1 border-t border-zinc-800">
          <div className="flex items-center justify-between font-mono text-[11px] text-zinc-400">
            <span className="uppercase font-bold tracking-wider">Bet / Raise Amount</span>
            <span className="font-extrabold text-white">
              {isAllInSelected ? (
                <span className="text-red-400 flex items-center gap-1">
                  <Flame className="w-3 h-3 fill-current" /> ALL IN (${availableChips.toLocaleString()})
                </span>
              ) : (
                `$${activeStakeAmount.toLocaleString()}`
              )}
            </span>
          </div>

          {/* 4 Chips Row: 25, 50, 100, and Custom/All-in */}
          <div className="flex items-center justify-around bg-black p-2 rounded-2xl border border-zinc-800 gap-1.5">
            {/* $25 Chip */}
            <Chip
              value={25}
              size="md"
              selected={selectedChipType === '25'}
              onClick={() => {
                sounds.playChipClick();
                setSelectedChipType('25');
                setIsAdjustingCustom(false);
              }}
            />

            {/* $50 Chip */}
            <Chip
              value={50}
              size="md"
              selected={selectedChipType === '50'}
              onClick={() => {
                sounds.playChipClick();
                setSelectedChipType('50');
                setIsAdjustingCustom(false);
              }}
            />

            {/* $100 Chip */}
            <Chip
              value={100}
              size="md"
              selected={selectedChipType === '100'}
              onClick={() => {
                sounds.playChipClick();
                setSelectedChipType('100');
                setIsAdjustingCustom(false);
              }}
            />

            {/* 4th ADJUSTABLE / ALL-IN CHIP */}
            <Chip
              value={effectiveCustomBet}
              size="md"
              selected={selectedChipType === 'custom'}
              customLabel={isCustomAllIn ? 'ALL IN' : `$${effectiveCustomBet}`}
              onClick={() => {
                sounds.playChipClick();
                setSelectedChipType('custom');
                setIsAdjustingCustom(!isAdjustingCustom);
              }}
            />
          </div>

          {/* Custom Slider / Preset Adjuster */}
          {(selectedChipType === 'custom' || isAdjustingCustom) && (
            <div className="bg-black/90 border border-zinc-800 rounded-2xl p-2.5 flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-zinc-400 flex items-center gap-1">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-white" />
                  Adjust Wager:
                </span>
                <span className="font-extrabold text-white">
                  {isCustomAllIn ? (
                    <span className="text-red-400 font-bold">ALL IN (${availableChips.toLocaleString()})</span>
                  ) : (
                    `$${effectiveCustomBet.toLocaleString()}`
                  )}
                </span>
              </div>

              {/* Slider */}
              <input
                id="poker-custom-chip-slider"
                type="range"
                min="1"
                max={Math.max(1, availableChips)}
                value={effectiveCustomBet}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setCustomChipAmount(val);
                  setSelectedChipType('custom');
                }}
                className="w-full accent-white cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
              />

              {/* Percentage Quick-Pick Buttons */}
              <div className="grid grid-cols-4 gap-1 font-mono text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playChipClick();
                    setCustomChipAmount(Math.max(1, Math.floor(availableChips * 0.25)));
                    setSelectedChipType('custom');
                  }}
                  className="py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-500 text-zinc-300"
                >
                  25%
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playChipClick();
                    setCustomChipAmount(Math.max(1, Math.floor(availableChips * 0.5)));
                    setSelectedChipType('custom');
                  }}
                  className="py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-500 text-zinc-300"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playChipClick();
                    setCustomChipAmount(Math.max(1, Math.floor(availableChips * 0.75)));
                    setSelectedChipType('custom');
                  }}
                  className="py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-500 text-zinc-300"
                >
                  75%
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playChipClick();
                    setCustomChipAmount(availableChips);
                    setSelectedChipType('custom');
                  }}
                  className="py-1 rounded-lg bg-red-950/70 border border-red-700 hover:border-red-500 text-red-300 font-extrabold uppercase"
                >
                  ALL IN
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Controls / Action Buttons */}
        {!isHandInProgress ? (
          <button
            id="poker-deal-hand-btn"
            onClick={startNewHand}
            disabled={balance < BIG_BLIND}
            className="w-full py-3.5 bg-white text-black font-mono font-bold text-sm rounded-2xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 active:scale-[0.98]"
          >
            <span>DEAL POKER HAND</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            {/* Action Buttons Row */}
            <div className="grid grid-cols-3 gap-2">
              <button
                id="poker-fold-btn"
                onClick={handleUserFold}
                className="py-2.5 bg-zinc-950 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 font-mono font-bold text-xs rounded-xl transition-all active:scale-95"
              >
                FOLD
              </button>

              <button
                id="poker-check-call-btn"
                onClick={handleUserCheckCall}
                className="py-2.5 bg-zinc-950 border border-zinc-500 text-white hover:bg-zinc-800 font-mono font-bold text-xs rounded-xl flex flex-col items-center justify-center transition-all active:scale-95"
              >
                <span>{userCallAmt === 0 ? 'CHECK' : 'CALL'}</span>
                {userCallAmt > 0 && <span className="text-[10px] text-zinc-400">${userCallAmt.toLocaleString()}</span>}
              </button>

              <button
                id="poker-raise-btn"
                onClick={() => handleUserRaise(activeStakeAmount)}
                disabled={user.chips < 1}
                className="py-2.5 bg-white text-black hover:bg-zinc-200 font-mono font-bold text-xs rounded-xl disabled:opacity-40 flex flex-col items-center justify-center transition-all active:scale-95 shadow-md"
              >
                <span>{isAllInSelected ? 'ALL IN' : 'RAISE'}</span>
                <span className="text-[10px] font-extrabold">
                  {isAllInSelected ? `$${availableChips.toLocaleString()}` : `$${activeStakeAmount.toLocaleString()}`}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
