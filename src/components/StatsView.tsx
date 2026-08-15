import React, { useState, useMemo, useEffect } from 'react';
import { GameStats } from '../types';
import { Trophy, BarChart3, RotateCcw, Flame, Medal, Search, Crown, TrendingUp, Sparkles, Award, Globe, Users, RefreshCw } from 'lucide-react';
import { sounds } from '../utils/sound';
import { subscribeToRealLeaderboard, RealLeaderboardEntry, getLocalUserId, syncPlayerToLeaderboard } from '../lib/firebase';

interface StatsViewProps {
  balance: number;
  stats: GameStats;
  onResetStats: () => void;
  username: string;
  avatar: string;
  onOpenSettings: () => void;
}

export const StatsView: React.FC<StatsViewProps> = ({
  balance,
  stats,
  onResetStats,
  username,
  avatar,
  onOpenSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'stats'>('leaderboard');
  const [leaderboardCategory, setLeaderboardCategory] = useState<'balance' | 'biggestWin' | 'totalWins' | 'netProfit'>('balance');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [realPlayers, setRealPlayers] = useState<RealLeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const localUserId = getLocalUserId();

  // Career computations
  const totalEarnings = stats.pokerTotalEarnings + stats.bjTotalEarnings + stats.rouletteTotalEarnings;
  const totalHandsPlayed = stats.pokerHandsPlayed + stats.bjHandsPlayed + stats.rouletteSpins;
  const totalWins = stats.pokerHandsWon + stats.bjHandsWon + stats.rouletteWins;
  const overallWinRate = totalHandsPlayed > 0 ? ((totalWins / totalHandsPlayed) * 100).toFixed(1) : '0.0';
  const userBiggestWin = stats.biggestWin || 0;

  // Real-time Firestore subscription to global players
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToRealLeaderboard((players) => {
      setRealPlayers(players);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Compute merged leaderboard with current user
  const combinedLeaderboard = useMemo(() => {
    // Current user's live profile
    const currentUserEntry: RealLeaderboardEntry = {
      userId: localUserId,
      username: username || 'HighRoller',
      avatar: avatar || '👑',
      balance: Math.round(balance),
      biggestWin: Math.round(userBiggestWin),
      totalWins: Math.round(totalWins),
      netProfit: Math.round(totalEarnings),
      updatedAt: new Date().toISOString(),
    };

    // Filter out existing user entry in realPlayers if present and inject latest local entry
    const otherPlayers = realPlayers.filter((p) => p.userId !== localUserId);
    const list = [...otherPlayers, currentUserEntry];

    // Sort according to category
    list.sort((a, b) => {
      if (leaderboardCategory === 'balance') return b.balance - a.balance;
      if (leaderboardCategory === 'biggestWin') return b.biggestWin - a.biggestWin;
      if (leaderboardCategory === 'totalWins') return b.totalWins - a.totalWins;
      return b.netProfit - a.netProfit;
    });

    return list;
  }, [realPlayers, localUserId, username, avatar, balance, userBiggestWin, totalWins, totalEarnings, leaderboardCategory]);

  // Find user rank
  const userRankIndex = combinedLeaderboard.findIndex((entry) => entry.userId === localUserId);
  const userRank = userRankIndex !== -1 ? userRankIndex + 1 : 1;

  // Filtered list
  const filteredLeaderboard = useMemo(() => {
    if (!searchQuery.trim()) return combinedLeaderboard;
    return combinedLeaderboard.filter((entry) =>
      entry.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [combinedLeaderboard, searchQuery]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />;
    if (rank === 2) return <Medal className="w-4 h-4 text-zinc-300 fill-zinc-300" />;
    if (rank === 3) return <Medal className="w-4 h-4 text-amber-600 fill-amber-600" />;
    return <span className="font-mono text-xs font-bold text-zinc-500">#{rank}</span>;
  };

  const getScoreDisplay = (entry: RealLeaderboardEntry) => {
    if (leaderboardCategory === 'balance') return `$${entry.balance.toLocaleString()}`;
    if (leaderboardCategory === 'biggestWin') return `$${entry.biggestWin.toLocaleString()}`;
    if (leaderboardCategory === 'totalWins') return `${entry.totalWins} Wins`;
    return `${entry.netProfit >= 0 ? '+' : ''}$${entry.netProfit.toLocaleString()}`;
  };

  return (
    <div id="stats-leaderboard-view" className="w-full h-full flex flex-col justify-between p-4 text-white font-sans max-w-md mx-auto select-none overflow-y-auto">
      <div className="flex flex-col gap-4">
        {/* Top Header Segmented Switcher */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-2xl w-full">
            <button
              id="tab-btn-leaderboard"
              onClick={() => {
                sounds.playChipClick();
                setActiveTab('leaderboard');
              }}
              className={`flex-1 py-2 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'leaderboard'
                  ? 'bg-white text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>LIVE LEADERBOARD</span>
            </button>
            <button
              id="tab-btn-stats"
              onClick={() => {
                sounds.playChipClick();
                setActiveTab('stats');
              }}
              className={`flex-1 py-2 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'stats'
                  ? 'bg-white text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>CAREER STATS</span>
            </button>
          </div>
        </div>

        {/* VIEW 1: GLOBAL LIVE LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <div className="flex flex-col gap-3">
            {/* User Position Sticky Card */}
            <div id="user-leaderboard-rank-card" className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 border border-amber-500/40 rounded-3xl p-4 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl p-1 bg-black/60 rounded-xl border border-zinc-700/60">{avatar}</span>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-white font-mono">{username}</span>
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 font-mono px-1.5 py-0.2 rounded uppercase font-bold">
                        YOU
                      </span>
                    </div>
                    <button
                      onClick={onOpenSettings}
                      className="text-[10px] text-amber-400 hover:underline text-left font-mono"
                    >
                      Change Username / Icon →
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-black/60 border border-amber-500/30 px-3 py-1 rounded-full">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-mono text-xs font-extrabold text-amber-400">RANK #{userRank}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-zinc-700/60">
                <span className="text-zinc-400 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-emerald-400" /> Live Global Sync
                </span>
                <span className="font-bold text-white text-sm">
                  {getScoreDisplay(combinedLeaderboard[userRankIndex] || combinedLeaderboard[0])}
                </span>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'balance', label: 'High Rollers', icon: <Crown className="w-3 h-3" /> },
                { id: 'biggestWin', label: 'Top Wins', icon: <Sparkles className="w-3 h-3" /> },
                { id: 'totalWins', label: 'Most Wins', icon: <Flame className="w-3 h-3" /> },
                { id: 'netProfit', label: 'Net Profit', icon: <TrendingUp className="w-3 h-3" /> },
              ].map((cat) => (
                <button
                  key={cat.id}
                  id={`cat-filter-${cat.id}`}
                  onClick={() => {
                    sounds.playChipClick();
                    setLeaderboardCategory(cat.id as any);
                  }}
                  className={`py-1.5 px-3 rounded-xl font-mono text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                    leaderboardCategory === cat.id
                      ? 'bg-zinc-800 text-white border border-zinc-600 shadow-sm'
                      : 'bg-zinc-950 text-zinc-500 hover:text-zinc-300 border border-zinc-900'
                  }`}
                >
                  {cat.icon}
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Search Input & Live Counter */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  id="leaderboard-search-input"
                  type="text"
                  placeholder="Search real players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
                />
              </div>
              <div className="px-2.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center gap-1 text-[10px] font-mono text-zinc-400 whitespace-nowrap">
                <Users className="w-3 h-3 text-zinc-500" />
                <span>{combinedLeaderboard.length} Real</span>
              </div>
            </div>

            {/* Leaderboard Table List */}
            <div id="leaderboard-list" className="flex flex-col gap-1.5 pb-4 max-h-[380px] overflow-y-auto">
              {filteredLeaderboard.map((entry, index) => {
                const rank = index + 1;
                const isTop3 = rank <= 3;
                const isUser = entry.userId === localUserId;

                return (
                  <div
                    key={entry.userId}
                    className={`flex items-center justify-between p-3 rounded-2xl transition-all ${
                      isUser
                        ? 'bg-amber-950/30 border border-amber-500/50 shadow-md ring-1 ring-amber-500/20'
                        : isTop3
                        ? 'bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700'
                        : 'bg-zinc-950/70 border border-zinc-900 hover:border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 flex items-center justify-center">
                        {getRankBadge(rank)}
                      </div>
                      <span className="text-lg">{entry.avatar || '👤'}</span>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-mono font-bold ${isUser ? 'text-amber-300 font-extrabold' : 'text-white'}`}>
                            {entry.username}
                          </span>
                          {isUser && (
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 font-mono px-1.5 rounded uppercase font-bold">
                              YOU
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {entry.balance >= 10000 ? 'Whale VIP' : entry.balance >= 5000 ? 'High Roller' : 'Player'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <span className={`text-xs font-bold ${isUser ? 'text-amber-400 font-extrabold' : 'text-zinc-200'}`}>
                        {getScoreDisplay(entry)}
                      </span>
                    </div>
                  </div>
                );
              })}

              {filteredLeaderboard.length === 0 && (
                <div className="text-center py-8 text-xs font-mono text-zinc-500">
                  No players found matching "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: CAREER STATS */}
        {activeTab === 'stats' && (
          <div className="flex flex-col gap-4">
            {/* Overall Performance Card */}
            <div id="stats-summary-card" className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                  Career Net Profit
                </span>
                <span
                  className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
                    totalEarnings >= 0
                      ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/50'
                      : 'bg-red-950/50 text-red-400 border-red-800/50'
                  }`}
                >
                  {totalEarnings >= 0 ? '+' : ''}${totalEarnings.toLocaleString()}
                </span>
              </div>

              <div className="text-3xl font-extrabold font-mono text-white tracking-tight mb-4">
                {overallWinRate}%
                <span className="text-xs text-zinc-500 font-normal ml-2 tracking-normal font-sans">
                  Overall Win Rate ({totalWins}/{totalHandsPlayed})
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-zinc-800 font-mono text-xs text-zinc-400">
                <div>
                  <span className="text-zinc-500 text-[10px] block uppercase">Current Stack</span>
                  <span className="font-bold text-white text-sm">${balance.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] block uppercase">Best Single Win</span>
                  <span className="font-bold text-emerald-400 text-sm">${userBiggestWin.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Detailed Game Breakdown */}
            <div id="game-stats-breakdown" className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 flex flex-col gap-3">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
                Game Performance
              </span>

              {/* Texas Hold'em */}
              <div className="p-3 bg-black/60 border border-zinc-800 rounded-2xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
                    ♠️ Texas Hold'em
                  </span>
                  <span
                    className={`font-mono text-xs font-bold ${
                      stats.pokerTotalEarnings >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {stats.pokerTotalEarnings >= 0 ? '+' : ''}${stats.pokerTotalEarnings.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                  <span>Played: {stats.pokerHandsPlayed}</span>
                  <span>Won: {stats.pokerHandsWon}</span>
                  <span>
                    Win Rate:{' '}
                    {stats.pokerHandsPlayed > 0
                      ? ((stats.pokerHandsWon / stats.pokerHandsPlayed) * 100).toFixed(0)
                      : 0}
                    %
                  </span>
                </div>
              </div>

              {/* Blackjack 21 */}
              <div className="p-3 bg-black/60 border border-zinc-800 rounded-2xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
                    🎲 Blackjack 21
                  </span>
                  <span
                    className={`font-mono text-xs font-bold ${
                      stats.bjTotalEarnings >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {stats.bjTotalEarnings >= 0 ? '+' : ''}${stats.bjTotalEarnings.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                  <span>Played: {stats.bjHandsPlayed}</span>
                  <span>Won: {stats.bjHandsWon}</span>
                  <span>
                    Win Rate:{' '}
                    {stats.bjHandsPlayed > 0
                      ? ((stats.bjHandsWon / stats.bjHandsPlayed) * 100).toFixed(0)
                      : 0}
                    %
                  </span>
                </div>
              </div>

              {/* European Roulette */}
              <div className="p-3 bg-black/60 border border-zinc-800 rounded-2xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
                    🎯 Roulette
                  </span>
                  <span
                    className={`font-mono text-xs font-bold ${
                      stats.rouletteTotalEarnings >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {stats.rouletteTotalEarnings >= 0 ? '+' : ''}${stats.rouletteTotalEarnings.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                  <span>Spins: {stats.rouletteSpins}</span>
                  <span>Wins: {stats.rouletteWins}</span>
                  <span>
                    Win Rate:{' '}
                    {stats.rouletteSpins > 0
                      ? ((stats.rouletteWins / stats.rouletteSpins) * 100).toFixed(0)
                      : 0}
                    %
                  </span>
                </div>
              </div>
            </div>

            {/* Reset Stats Action */}
            <div className="flex justify-center pt-2 pb-4">
              <button
                id="reset-career-stats-btn"
                onClick={() => {
                  if (window.confirm('Reset all career stats and balance back to $1,000?')) {
                    sounds.playChipClick();
                    onResetStats();
                  }
                }}
                className="flex items-center gap-1.5 text-zinc-500 hover:text-red-400 text-xs font-mono transition-colors py-2 px-3 rounded-lg hover:bg-zinc-900 border border-transparent hover:border-zinc-800"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Stats & Balance</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
