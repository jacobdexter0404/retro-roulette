import React from 'react';
import { Volume2, VolumeX, Plus, Coins, Settings } from 'lucide-react';
import { sounds } from '../utils/sound';

interface HeaderNavProps {
  balance: number;
  onOpenBank: () => void;
  muted: boolean;
  onToggleMute: () => void;
  onOpenSettings?: () => void;
  activeGameTitle: string;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  balance,
  onOpenBank,
  muted,
  onToggleMute,
  onOpenSettings,
  activeGameTitle,
}) => {
  return (
    <header className="w-full bg-black border-b border-zinc-800 px-4 py-3 flex items-center justify-between text-white select-none z-30">
      {/* Brand Title */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <div className="flex flex-col">
          <span className="font-extrabold tracking-widest text-sm uppercase text-white font-mono">
            RETRO ROULETTE
          </span>
          {activeGameTitle ? (
            <span
              id="header-active-game-title"
              className="text-[10px] text-zinc-400 tracking-wider font-mono uppercase"
            >
              {activeGameTitle}
            </span>
          ) : null}
        </div>
      </div>

      {/* Balance & Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Chip Balance Display */}
        <button
          id="header-balance-btn"
          onClick={onOpenBank}
          className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-700 hover:border-zinc-400 px-2.5 sm:px-3 py-1.5 rounded-full transition-all group"
        >
          <Coins className="w-4 h-4 text-zinc-300 group-hover:text-white" />
          <span className="font-mono font-bold text-xs sm:text-sm text-white tracking-tight">
            ${balance.toLocaleString()}
          </span>
          <span className="w-4 h-4 rounded-full bg-white text-black text-[11px] font-bold flex items-center justify-center ml-0.5">
            <Plus className="w-3 h-3 stroke-[3]" />
          </span>
        </button>

        {/* Mute Toggle */}
        <button
          id="header-sound-btn"
          onClick={() => {
            sounds.playChipClick();
            onToggleMute();
          }}
          className="p-2 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-500 text-zinc-300 hover:text-white transition-colors"
          title={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? <VolumeX className="w-4 h-4 text-zinc-500" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Settings Button */}
        {onOpenSettings && (
          <button
            id="header-settings-btn"
            onClick={() => {
              sounds.playChipClick();
              onOpenSettings();
            }}
            className="p-2 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-500 text-zinc-300 hover:text-white transition-colors"
            title="Player Profile & Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
