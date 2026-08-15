import React from 'react';
import { GameMode } from '../types';
import { Spade, Dices, CircleDot, Landmark, Trophy } from 'lucide-react';
import { sounds } from '../utils/sound';

interface BottomTabsProps {
  currentMode: GameMode;
  onChangeMode: (mode: GameMode) => void;
}

export const BottomTabs: React.FC<BottomTabsProps> = ({ currentMode, onChangeMode }) => {
  const tabs: { id: GameMode; label: string; icon: React.ReactNode }[] = [
    { id: 'poker', label: 'Poker', icon: <Spade className="w-4 h-4" /> },
    { id: 'blackjack', label: 'Blackjack', icon: <Dices className="w-4 h-4" /> },
    { id: 'roulette', label: 'Roulette', icon: <CircleDot className="w-4 h-4" /> },
    { id: 'bank', label: 'Bank', icon: <Landmark className="w-4 h-4" /> },
    { id: 'stats', label: 'Stats', icon: <Trophy className="w-4 h-4" /> },
  ];

  return (
    <nav className="w-full bg-black border-t border-zinc-800 px-1 py-2 flex items-center justify-around z-30 select-none">
      {tabs.map((tab) => {
        const isActive = currentMode === tab.id;
        return (
          <button
            key={tab.id}
            id={`nav-tab-${tab.id}`}
            onClick={() => {
              if (currentMode !== tab.id) {
                sounds.playChipClick();
                onChangeMode(tab.id);
              }
            }}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all flex-1 mx-0.5 ${
              isActive
                ? 'text-white bg-zinc-900 border border-zinc-700 font-bold shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300 font-medium border border-transparent'
            }`}
          >
            {tab.icon}
            <span className="text-[10px] font-mono tracking-tight uppercase truncate">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
