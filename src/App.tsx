import React, { useState, useEffect } from 'react';
import { GameMode, GameStats } from './types';
import { MobileFrame } from './components/MobileFrame';
import { HeaderNav } from './components/HeaderNav';
import { BottomTabs } from './components/BottomTabs';
import { BankModal } from './components/BankModal';
import { SettingsModal } from './components/SettingsModal';
import { PokerGame } from './components/PokerGame';
import { BlackjackGame } from './components/BlackjackGame';
import { RouletteGame } from './components/RouletteGame';
import { BankView } from './components/BankView';
import { StatsView } from './components/StatsView';
import { sounds } from './utils/sound';
import {
  getLocalUsername,
  setLocalUsername,
  getLocalAvatar,
  setLocalAvatar,
  syncPlayerToLeaderboard
} from './lib/firebase';

const STORAGE_KEY_BALANCE = 'offshoot_casino_balance_v1';
const STORAGE_KEY_STATS = 'offshoot_casino_stats_v1';
const STORAGE_KEY_DAILY_BONUS = 'offshoot_casino_daily_bonus_v1';

const INITIAL_STATS: GameStats = {
  pokerHandsPlayed: 0,
  pokerHandsWon: 0,
  pokerTotalEarnings: 0,
  bjHandsPlayed: 0,
  bjHandsWon: 0,
  bjTotalEarnings: 0,
  rouletteSpins: 0,
  rouletteWins: 0,
  rouletteTotalEarnings: 0,
  biggestWin: 0,
  playerName: 'HighRoller',
};

export default function App() {
  const [balance, setBalance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BALANCE);
      return saved !== null ? parseInt(saved, 10) : 1000;
    } catch {
      return 1000;
    }
  });

  const [lastDailyBonusTime, setLastDailyBonusTime] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DAILY_BONUS);
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [username, setUsername] = useState<string>(() => getLocalUsername());
  const [avatar, setAvatar] = useState<string>(() => getLocalAvatar());

  const [stats, setStats] = useState<GameStats>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STATS);
      return saved ? { ...INITIAL_STATS, ...JSON.parse(saved) } : INITIAL_STATS;
    } catch {
      return INITIAL_STATS;
    }
  });

  const [activeMode, setActiveMode] = useState<GameMode>('poker');
  const [isBankOpen, setIsBankOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BALANCE, balance.toString());
    } catch {
      // Ignore
    }
  }, [balance]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
    } catch {
      // Ignore
    }
  }, [stats]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DAILY_BONUS, lastDailyBonusTime.toString());
    } catch {
      // Ignore
    }
  }, [lastDailyBonusTime]);

  // Sync to real-time Firestore Leaderboard whenever player stats or identity change
  useEffect(() => {
    const totalEarnings = stats.pokerTotalEarnings + stats.bjTotalEarnings + stats.rouletteTotalEarnings;
    const totalWins = stats.pokerHandsWon + stats.bjHandsWon + stats.rouletteWins;
    syncPlayerToLeaderboard({
      username: username || 'HighRoller',
      avatar: avatar || '👑',
      balance,
      biggestWin: stats.biggestWin || 0,
      totalWins,
      netProfit: totalEarnings,
    });
  }, [balance, stats, username, avatar]);

  const handleUpdateBalance = (newBal: number) => {
    setBalance(Math.max(0, newBal));
  };

  const handleClaimDailyBonus = () => {
    const now = Date.now();
    if (now - lastDailyBonusTime < 24 * 60 * 60 * 1000) return;
    sounds.playWinChime();
    setBalance((prev) => prev + 100);
    setLastDailyBonusTime(now);
  };

  const handleResetStats = () => {
    setStats(INITIAL_STATS);
    setBalance(1000);
  };

  const handleSaveProfile = (newUsername: string, newAvatar: string) => {
    setUsername(newUsername);
    setAvatar(newAvatar);
    setLocalUsername(newUsername);
    setLocalAvatar(newAvatar);
    setStats((prev) => ({
      ...prev,
      playerName: newUsername,
    }));
  };

  // Record Poker hand outcome
  const handleRecordPokerHand = (won: boolean, netEarnings: number) => {
    setStats((prev) => ({
      ...prev,
      pokerHandsPlayed: prev.pokerHandsPlayed + 1,
      pokerHandsWon: prev.pokerHandsWon + (won ? 1 : 0),
      pokerTotalEarnings: prev.pokerTotalEarnings + netEarnings,
      biggestWin: won && netEarnings > 0 ? Math.max(prev.biggestWin || 0, netEarnings) : prev.biggestWin || 0,
    }));
  };

  // Record Blackjack hand outcome
  const handleRecordBlackjackHand = (won: boolean, netEarnings: number) => {
    setStats((prev) => ({
      ...prev,
      bjHandsPlayed: prev.bjHandsPlayed + 1,
      bjHandsWon: prev.bjHandsWon + (won ? 1 : 0),
      bjTotalEarnings: prev.bjTotalEarnings + netEarnings,
      biggestWin: won && netEarnings > 0 ? Math.max(prev.biggestWin || 0, netEarnings) : prev.biggestWin || 0,
    }));
  };

  // Record Roulette spin outcome
  const handleRecordRouletteSpin = (won: boolean, netEarnings: number) => {
    setStats((prev) => ({
      ...prev,
      rouletteSpins: prev.rouletteSpins + 1,
      rouletteWins: prev.rouletteWins + (won ? 1 : 0),
      rouletteTotalEarnings: prev.rouletteTotalEarnings + netEarnings,
      biggestWin: won && netEarnings > 0 ? Math.max(prev.biggestWin || 0, netEarnings) : prev.biggestWin || 0,
    }));
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    sounds.setMuted(next);
  };

  const gameTitles: Record<GameMode, string> = {
    poker: "Texas Hold'em",
    blackjack: 'Blackjack 21',
    roulette: 'European Roulette',
    bank: 'Casino Bank & Vault',
    stats: 'Live Leaderboard',
  };

  return (
    <MobileFrame>
      {/* Top Header Navigation */}
      <HeaderNav
        balance={balance}
        onOpenBank={() => setActiveMode('bank')}
        muted={muted}
        onToggleMute={toggleMute}
        onOpenSettings={() => setIsSettingsOpen(true)}
        activeGameTitle={gameTitles[activeMode]}
      />

      {/* Main Game Screen View */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col bg-black min-h-0">
        {activeMode === 'poker' && (
          <PokerGame
            balance={balance}
            onUpdateBalance={handleUpdateBalance}
            onRecordHand={handleRecordPokerHand}
          />
        )}

        {activeMode === 'blackjack' && (
          <BlackjackGame
            balance={balance}
            onUpdateBalance={handleUpdateBalance}
            onRecordHand={handleRecordBlackjackHand}
          />
        )}

        {activeMode === 'roulette' && (
          <RouletteGame
            balance={balance}
            onUpdateBalance={handleUpdateBalance}
            onRecordSpin={handleRecordRouletteSpin}
          />
        )}

        {activeMode === 'bank' && (
          <BankView
            balance={balance}
            stats={stats}
            lastDailyBonusTime={lastDailyBonusTime}
            onClaimDailyBonus={handleClaimDailyBonus}
            onAddChips={(amount) => setBalance((prev) => prev + amount)}
          />
        )}

        {activeMode === 'stats' && (
          <StatsView
            balance={balance}
            stats={stats}
            onResetStats={handleResetStats}
            username={username}
            avatar={avatar}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}
      </main>

      {/* Bottom Mobile Tab Bar */}
      <BottomTabs currentMode={activeMode} onChangeMode={setActiveMode} />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentUsername={username}
        currentAvatar={avatar}
        onSaveProfile={handleSaveProfile}
      />

      {/* Bank Modal */}
      <BankModal
        isOpen={isBankOpen}
        onClose={() => setIsBankOpen(false)}
        balance={balance}
        stats={stats}
        lastDailyBonusTime={lastDailyBonusTime}
        onClaimDailyBonus={handleClaimDailyBonus}
        onResetStats={handleResetStats}
      />
    </MobileFrame>
  );
}
