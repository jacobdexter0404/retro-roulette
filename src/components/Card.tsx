import React from 'react';
import { motion } from 'motion/react';
import { Card as CardType } from '../types';
import { formatCardValue } from '../utils/pokerEvaluator';

interface CardProps {
  card?: CardType;
  faceDown?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'responsive';
  className?: string;
  onClick?: () => void;
}

export const CardComponent: React.FC<CardProps> = ({
  card,
  faceDown = false,
  size = 'md',
  className = '',
  onClick,
}) => {
  const getSuitSymbol = (suit: CardType['suit']) => {
    switch (suit) {
      case 'spades':
        return '♠';
      case 'hearts':
        return '♥';
      case 'diamonds':
        return '♦';
      case 'clubs':
        return '♣';
    }
  };

  const isRed = card?.suit === 'hearts' || card?.suit === 'diamonds';

  // Size dimensions
  const dimensions = {
    xs: 'w-7 h-10 text-[8px]',
    sm: 'w-10 h-14 text-xs',
    md: 'w-14 h-20 text-sm',
    lg: 'w-20 h-28 text-base',
    responsive: 'w-12 h-18 sm:w-16 sm:h-24 text-xs sm:text-sm',
  }[size];

  const suitIconSizes = {
    xs: 'text-[10px]',
    sm: 'text-sm',
    md: 'text-xl',
    lg: 'text-3xl',
    responsive: 'text-lg sm:text-2xl',
  }[size];

  if (faceDown || !card) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={onClick}
        className={`shrink-0 ${dimensions} rounded-lg bg-zinc-900 border border-zinc-700 flex flex-col items-center justify-center p-1 relative overflow-hidden shadow-md select-none cursor-pointer ${className}`}
      >
        {/* Minimalist geometric back pattern */}
        <div className="absolute inset-1 rounded border border-zinc-800 bg-[radial-gradient(#3f3f46_1px,transparent_1px)] [background-size:6px_6px] flex items-center justify-center">
          <div className="w-4 h-4 rounded-full border border-zinc-600 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full"></div>
          </div>
        </div>
      </motion.div>
    );
  }

  const valueStr = formatCardValue(card.value);
  const suitSymbol = getSuitSymbol(card.suit);

  return (
    <motion.div
      initial={{ scale: 0.85, y: -6, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      exit={{ scale: 0.85, opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      onClick={onClick}
      className={`shrink-0 ${dimensions} rounded-lg bg-white border border-zinc-300 text-zinc-950 flex flex-col justify-between p-1 sm:p-1.5 relative shadow-lg select-none font-mono ${className}`}
    >
      {/* Top Left Rank & Suit */}
      <div className="flex flex-col items-start leading-none font-bold">
        <span className="text-[11px] sm:text-sm tracking-tighter">{valueStr}</span>
        <span className={`text-[9px] sm:text-[11px] ${isRed ? 'text-red-600' : 'text-zinc-950'}`}>
          {suitSymbol}
        </span>
      </div>

      {/* Center Suit */}
      <div className={`absolute inset-0 flex items-center justify-center ${suitIconSizes} ${isRed ? 'text-red-600' : 'text-zinc-950'} opacity-90`}>
        {suitSymbol}
      </div>

      {/* Bottom Right Rank & Suit (Inverted) */}
      <div className="flex flex-col items-end leading-none font-bold rotate-180">
        <span className="text-[11px] sm:text-sm tracking-tighter">{valueStr}</span>
        <span className={`text-[9px] sm:text-[11px] ${isRed ? 'text-red-600' : 'text-zinc-950'}`}>
          {suitSymbol}
        </span>
      </div>
    </motion.div>
  );
};
