import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { RouletteBet, RouletteBetType } from '../types';
import { Chip } from './Chip';
import { sounds } from '../utils/sound';
import { RotateCcw, Play, History } from 'lucide-react';

interface RouletteGameProps {
  balance: number;
  onUpdateBalance: (newBalance: number) => void;
  onRecordSpin: (won: boolean, netEarnings: number) => void;
}

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const STORAGE_KEY_ROULETTE_HISTORY = 'retro_roulette_past_numbers_v1';

export const RouletteGame: React.FC<RouletteGameProps> = ({
  balance,
  onUpdateBalance,
  onRecordSpin,
}) => {
  const [selectedChipValue, setSelectedChipValue] = useState<number>(25);
  const [bets, setBets] = useState<RouletteBet[]>([]);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [message, setMessage] = useState<string>('Place your chips on the board');
  const [pastNumbers, setPastNumbers] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ROULETTE_HISTORY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(0, 10);
        }
      }
    } catch {
      // Ignore
    }
    return [17, 32, 0, 26, 7];
  });

  const totalBet = bets.reduce((acc, b) => acc + b.amount, 0);

  // Sync past numbers to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ROULETTE_HISTORY, JSON.stringify(pastNumbers));
    } catch {
      // Ignore
    }
  }, [pastNumbers]);

  // Add bet
  const handlePlaceBet = (type: RouletteBetType, targetNumber?: number) => {
    if (isSpinning) return;
    if (balance < selectedChipValue) {
      setMessage('Insufficient funds for this bet!');
      return;
    }

    sounds.playChipClick();
    onUpdateBalance(balance - selectedChipValue);

    const newBet: RouletteBet = {
      id: `${type}-${targetNumber ?? ''}-${Date.now()}-${Math.random()}`,
      type,
      targetNumber,
      amount: selectedChipValue,
    };

    setBets((prev) => [...prev, newBet]);
    setMessage(`Placed $${selectedChipValue} bet.`);
  };

  // Clear bets
  const handleClearBets = () => {
    if (isSpinning || bets.length === 0) return;
    sounds.playChipClick();
    onUpdateBalance(balance + totalBet);
    setBets([]);
    setMessage('Bets cleared.');
  };

  // Spin Roulette
  const handleSpin = () => {
    if (isSpinning) return;

    let activeBets = [...bets];
    let activeTotalBet = totalBet;

    // If no bets placed, auto-place default bet on RED with selected chip
    if (activeBets.length === 0) {
      if (balance < selectedChipValue) {
        setMessage('Insufficient funds! Refill in Bank.');
        return;
      }
      sounds.playChipClick();
      const autoBet: RouletteBet = {
        id: `red--${Date.now()}`,
        type: 'red',
        amount: selectedChipValue,
      };
      activeBets = [autoBet];
      activeTotalBet = selectedChipValue;
      setBets(activeBets);
      onUpdateBalance(balance - selectedChipValue);
    }

    setIsSpinning(true);
    setMessage('Spinning wheel...');

    const outcome = Math.floor(Math.random() * 37); // 0 to 36
    const additionalDegrees = 1440 + outcome * (360 / 37) + (Math.random() * 8 - 4);
    const newRotation = wheelRotation + additionalDegrees;

    setWheelRotation(newRotation);

    // Tick audio sound during spin
    let tickCount = 0;
    const interval = setInterval(() => {
      sounds.playRouletteTick(1 + tickCount * 0.05);
      tickCount++;
      if (tickCount >= 18) clearInterval(interval);
    }, 150);

    // Resolve after 3 seconds
    setTimeout(() => {
      setIsSpinning(false);
      setWinningNumber(outcome);

      // Append to past numbers list (newest first, max 10)
      setPastNumbers((prev) => [outcome, ...prev].slice(0, 10));

      // Evaluate payouts
      let totalPayout = 0;
      const isRed = RED_NUMBERS.includes(outcome);
      const isBlack = outcome !== 0 && !isRed;
      const isEven = outcome !== 0 && outcome % 2 === 0;
      const isOdd = outcome !== 0 && outcome % 2 !== 0;

      activeBets.forEach((b) => {
        if (b.type === 'single' && b.targetNumber === outcome) {
          totalPayout += b.amount * 36; // 35:1 + stake
        } else if (b.type === 'red' && isRed) {
          totalPayout += b.amount * 2;
        } else if (b.type === 'black' && isBlack) {
          totalPayout += b.amount * 2;
        } else if (b.type === 'even' && isEven) {
          totalPayout += b.amount * 2;
        } else if (b.type === 'odd' && isOdd) {
          totalPayout += b.amount * 2;
        } else if (b.type === 'low' && outcome >= 1 && outcome <= 18) {
          totalPayout += b.amount * 2;
        } else if (b.type === 'high' && outcome >= 19 && outcome <= 36) {
          totalPayout += b.amount * 2;
        } else if (b.type === 'dozen1' && outcome >= 1 && outcome <= 12) {
          totalPayout += b.amount * 3;
        } else if (b.type === 'dozen2' && outcome >= 13 && outcome <= 24) {
          totalPayout += b.amount * 3;
        } else if (b.type === 'dozen3' && outcome >= 25 && outcome <= 36) {
          totalPayout += b.amount * 3;
        }
      });

      const net = totalPayout - activeTotalBet;

      if (totalPayout > 0) {
        sounds.playWinChime();
        onUpdateBalance(balance + totalPayout);
        onRecordSpin(true, net);
        setMessage(`WINNER! Ball landed on ${outcome} (${isRed ? 'RED' : outcome === 0 ? 'ZERO' : 'BLACK'}). Won $${totalPayout}!`);
      } else {
        sounds.playLossTone();
        onRecordSpin(false, -activeTotalBet);
        setMessage(`Ball landed on ${outcome} (${isRed ? 'RED' : outcome === 0 ? 'ZERO' : 'BLACK'}). No win.`);
      }

      setBets([]);
    }, 3000);
  };

  const getNumberBetAmount = (num: number) => {
    return bets
      .filter((b) => b.type === 'single' && b.targetNumber === num)
      .reduce((sum, b) => sum + b.amount, 0);
  };

  const getTypeBetAmount = (type: RouletteBetType) => {
    return bets
      .filter((b) => b.type === type)
      .reduce((sum, b) => sum + b.amount, 0);
  };

  return (
    <div id="roulette-game-container" className="w-full min-h-full flex flex-col justify-between p-3 sm:p-4 pb-12 text-white font-sans max-w-md mx-auto select-none overflow-y-auto">
      {/* Roulette Wheel Display */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-4 flex flex-col items-center gap-3 shadow-xl relative">
        <div className="flex items-center justify-between w-full font-mono text-xs text-zinc-400 px-1">
          <span className="font-bold text-white uppercase tracking-wider">EUROPEAN ROULETTE</span>
          <span className="text-zinc-400">Total Bet: ${totalBet}</span>
        </div>

        {/* Past Winning Numbers Billboard */}
        <div id="roulette-past-numbers-bar" className="w-full bg-black/80 border border-zinc-800 rounded-2xl px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-[11px]">
            <History className="w-3.5 h-3.5 text-white" />
            <span className="font-bold uppercase tracking-wider text-[10px]">Past Numbers</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {pastNumbers.map((num, idx) => {
              const isZero = num === 0;
              const isRed = RED_NUMBERS.includes(num);
              return (
                <div
                  key={`${num}-${idx}`}
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-extrabold text-[11px] border transition-all ${
                    idx === 0 ? 'ring-2 ring-white scale-105 shadow-md' : 'opacity-85'
                  } ${
                    isZero
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                      : isRed
                      ? 'bg-red-950 border-red-600 text-red-400'
                      : 'bg-zinc-900 border-zinc-700 text-white'
                  }`}
                  title={`Result: ${num} (${isZero ? 'Zero' : isRed ? 'Red' : 'Black'})${idx === 0 ? ' (Latest)' : ''}`}
                >
                  {num}
                </div>
              );
            })}
          </div>
        </div>

        {/* Minimalist Spinning Dial */}
        <div className="relative w-36 h-36 my-1 flex items-center justify-center">
          <motion.div
            animate={{ rotate: wheelRotation }}
            transition={{ duration: 3, ease: [0.15, 0.85, 0.35, 1] }}
            className="w-full h-full rounded-full border-4 border-zinc-700 bg-zinc-900 flex items-center justify-center shadow-2xl relative overflow-hidden"
          >
            {/* Wheel Sector Markings */}
            <div className="absolute inset-2 rounded-full border border-zinc-800 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:8px_8px]"></div>
            <div className="w-12 h-12 rounded-full bg-black border-2 border-zinc-600 flex items-center justify-center z-10">
              <span className="font-mono font-extrabold text-base text-white">
                {winningNumber !== null ? winningNumber : (pastNumbers[0] ?? '36')}
              </span>
            </div>
          </motion.div>

          {/* Top Indicator Needle */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-4 bg-white clip-triangle z-20"></div>
        </div>

        {/* Message Banner */}
        <div className="text-center font-mono text-xs text-zinc-300 bg-zinc-900/80 px-3 py-1 rounded-full border border-zinc-800 max-w-full truncate">
          {message}
        </div>
      </div>

      {/* Betting Board Grid */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-3 flex flex-col gap-2 shadow-2xl my-3">
        {/* Chips Selector */}
        <div className="flex items-center justify-around bg-black p-2 rounded-2xl border border-zinc-800">
          {[5, 10, 25, 50, 100].map((val) => (
            <Chip
              key={val}
              value={val}
              size="sm"
              selected={selectedChipValue === val}
              onClick={() => {
                sounds.playChipClick();
                setSelectedChipValue(val);
              }}
            />
          ))}
        </div>

        {/* Outside Bets Row 1 */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <button
            onClick={() => handlePlaceBet('red')}
            className="py-2.5 bg-zinc-950 border border-red-800 hover:border-red-500 rounded-xl font-mono text-xs font-bold text-red-500 flex items-center justify-between px-3"
          >
            <span>RED (1:1)</span>
            {getTypeBetAmount('red') > 0 && (
              <span className="bg-white text-black px-1.5 py-0.5 rounded-full text-[10px]">
                ${getTypeBetAmount('red')}
              </span>
            )}
          </button>

          <button
            onClick={() => handlePlaceBet('black')}
            className="py-2.5 bg-zinc-950 border border-zinc-600 hover:border-white rounded-xl font-mono text-xs font-bold text-zinc-300 flex items-center justify-between px-3"
          >
            <span>BLACK (1:1)</span>
            {getTypeBetAmount('black') > 0 && (
              <span className="bg-white text-black px-1.5 py-0.5 rounded-full text-[10px]">
                ${getTypeBetAmount('black')}
              </span>
            )}
          </button>
        </div>

        {/* Outside Bets Row 2 */}
        <div className="grid grid-cols-4 gap-1.5 text-[10px] font-mono font-bold">
          <button
            onClick={() => handlePlaceBet('even')}
            className="py-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-500 rounded-lg text-zinc-300"
          >
            EVEN {getTypeBetAmount('even') > 0 && `$${getTypeBetAmount('even')}`}
          </button>
          <button
            onClick={() => handlePlaceBet('odd')}
            className="py-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-500 rounded-lg text-zinc-300"
          >
            ODD {getTypeBetAmount('odd') > 0 && `$${getTypeBetAmount('odd')}`}
          </button>
          <button
            onClick={() => handlePlaceBet('low')}
            className="py-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-500 rounded-lg text-zinc-300"
          >
            1-18 {getTypeBetAmount('low') > 0 && `$${getTypeBetAmount('low')}`}
          </button>
          <button
            onClick={() => handlePlaceBet('high')}
            className="py-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-500 rounded-lg text-zinc-300"
          >
            19-36 {getTypeBetAmount('high') > 0 && `$${getTypeBetAmount('high')}`}
          </button>
        </div>

        {/* Straight Numbers Grid (0 to 36) */}
        <div className="flex flex-col gap-1 mt-1">
          {/* Zero */}
          <button
            onClick={() => handlePlaceBet('single', 0)}
            className="py-1.5 bg-zinc-950 border border-zinc-700 hover:border-white rounded-lg font-mono text-xs font-extrabold text-white flex items-center justify-center gap-2"
          >
            <span>0</span>
            {getNumberBetAmount(0) > 0 && (
              <span className="bg-white text-black text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                ${getNumberBetAmount(0)}
              </span>
            )}
          </button>

          {/* Numbers 1-36 */}
          <div className="grid grid-cols-6 gap-1 max-h-36 overflow-y-auto pr-1">
            {Array.from({ length: 36 }).map((_, idx) => {
              const num = idx + 1;
              const isRed = RED_NUMBERS.includes(num);
              const amt = getNumberBetAmount(num);

              return (
                <button
                  key={num}
                  onClick={() => handlePlaceBet('single', num)}
                  className={`py-2 rounded-lg font-mono text-xs font-bold transition-all relative flex flex-col items-center justify-center ${
                    isRed
                      ? 'bg-zinc-950 border border-red-900 text-red-500 hover:border-red-500'
                      : 'bg-zinc-950 border border-zinc-800 text-white hover:border-white'
                  }`}
                >
                  <span>{num}</span>
                  {amt > 0 && (
                    <span className="text-[9px] bg-white text-black px-1 rounded font-mono font-extrabold">
                      ${amt}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleClearBets}
            disabled={isSpinning || bets.length === 0}
            className="py-3 bg-zinc-950 border border-zinc-700 text-zinc-300 font-mono font-bold text-xs rounded-xl hover:text-white disabled:opacity-40 flex items-center justify-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" /> CLEAR BETS
          </button>

          <button
            onClick={handleSpin}
            disabled={isSpinning}
            className="py-3 bg-white text-black font-mono font-bold text-xs rounded-xl hover:bg-zinc-200 disabled:opacity-40 flex items-center justify-center gap-1 shadow-lg cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> SPIN ROULETTE
          </button>
        </div>
      </div>
    </div>
  );
};
