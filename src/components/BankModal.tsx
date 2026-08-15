import React from 'react';
import { motion } from 'motion/react';
import { X, RefreshCw, Trophy, Coins, RotateCcw } from 'lucide-react';
import { GameStats } from '../types';
import { sounds } from '../utils/sound';

interface BankModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  stats: GameStats;
  lastDailyBonusTime: number;
  onClaimDailyBonus: () => void;
  onResetStats: () => void;
}

export const BankModal: React.FC<BankModalProps> = ({
  isOpen,
  onClose,
  balance,
  stats,
  lastDailyBonusTime,
  onClaimDailyBonus,
  onResetStats,
}) => {
  if (!isOpen) return null;

  const isBonusAvailable = Date.now() - lastDailyBonusTime >= 24 * 60 * 60 * 1000;
  const msRemaining = Math.max(0, 24 * 60 * 60 * 1000 - (Date.now() - lastDailyBonusTime));
  const hoursLeft = Math.floor(msRemaining / (1000 * 60 * 60));
  const minsLeft = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-sm bg-black border border-zinc-700 rounded-2xl p-5 text-white flex flex-col gap-5 shadow-2xl relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-white" />
            <h2 className="text-lg font-mono font-bold uppercase tracking-wider">CHIP BANK & STATS</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Balance */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center gap-1 text-center">
          <span className="text-xs text-zinc-400 font-mono uppercase tracking-widest">Available Balance</span>
          <span className="text-3xl font-mono font-extrabold tracking-tight text-white">
            ${balance.toLocaleString()}
          </span>
        </div>

        {/* Daily Bonus Section */}
        <div className="flex flex-col gap-2">
          <span className="text-xs text-zinc-400 font-mono uppercase tracking-wider">Daily Bonus</span>
          {isBonusAvailable ? (
            <button
              onClick={onClaimDailyBonus}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4" />
                <span>CLAIM $100 DAILY BONUS</span>
              </div>
              <span className="text-[10px] bg-emerald-800 text-emerald-100 px-2 py-0.5 rounded uppercase font-extrabold">READY</span>
            </button>
          ) : (
            <div className="w-full py-3 px-4 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between font-mono text-xs">
              <span className="text-zinc-400">Daily Bonus Claimed</span>
              <span className="text-zinc-500 text-[11px] font-bold">
                Next in {hoursLeft}h {minsLeft}m
              </span>
            </div>
          )}
        </div>

        {/* Stats Summary */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-mono uppercase tracking-wider flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" /> Performance Stats
            </span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex flex-col gap-2 font-mono text-xs">
            <div className="flex justify-between items-center text-zinc-300">
              <span>Poker Win Rate:</span>
              <span className="font-bold text-white">
                {stats.pokerHandsPlayed > 0
                  ? `${Math.round((stats.pokerHandsWon / stats.pokerHandsPlayed) * 100)}% (${stats.pokerHandsWon}/${stats.pokerHandsPlayed})`
                  : '0% (0 played)'}
              </span>
            </div>
            <div className="flex justify-between items-center text-zinc-300">
              <span>Blackjack Win Rate:</span>
              <span className="font-bold text-white">
                {stats.bjHandsPlayed > 0
                  ? `${Math.round((stats.bjHandsWon / stats.bjHandsPlayed) * 100)}% (${stats.bjHandsWon}/${stats.bjHandsPlayed})`
                  : '0% (0 played)'}
              </span>
            </div>
            <div className="flex justify-between items-center text-zinc-300">
              <span>Roulette Wins:</span>
              <span className="font-bold text-white">
                {stats.rouletteSpins > 0
                  ? `${stats.rouletteWins} / ${stats.rouletteSpins} spins`
                  : '0 spins'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
          <button
            onClick={onResetStats}
            className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 font-mono"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Stats
          </button>
          <button
            onClick={onClose}
            className="py-2 px-5 bg-white text-black font-mono font-bold text-xs rounded-xl hover:bg-zinc-200"
          >
            DONE
          </button>
        </div>
      </motion.div>
    </div>
  );
};
