import React from 'react';
import { motion } from 'motion/react';

interface ChipProps {
  value: number;
  selected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

export const Chip: React.FC<ChipProps> = ({
  value,
  selected = false,
  onClick,
  size = 'md',
  className = '',
  disabled = false,
}) => {
  const formatChipValue = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k`;
    return val.toString();
  };

  const sizeClasses = {
    sm: 'w-10 h-10 text-xs border-2',
    md: 'w-13 h-13 text-sm border-2',
    lg: 'w-16 h-16 text-base border-2',
  }[size];

  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.92 }}
      whileHover={disabled ? undefined : { scale: 1.05 }}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full flex items-center justify-center font-bold tracking-tight select-none transition-all ${sizeClasses} ${
        selected
          ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]'
          : 'bg-black text-white border-zinc-300 hover:border-white shadow-md'
      } ${disabled ? 'opacity-40 cursor-not-allowed border-zinc-700 text-zinc-500' : 'cursor-pointer'} ${className}`}
    >
      <div className="flex items-center justify-center rounded-full inset-0.5 border border-dashed border-current/20 w-full h-full">
        <span>{formatChipValue(value)}</span>
      </div>
    </motion.button>
  );
};
