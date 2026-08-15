import React, { useState } from 'react';
import { X, Check, User, Sparkles, AlertCircle } from 'lucide-react';
import { sounds } from '../utils/sound';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsername: string;
  currentAvatar: string;
  onSaveProfile: (newUsername: string, newAvatar: string) => void;
}

const AVAILABLE_AVATARS = [
  '👑', '💎', '♠️', '🔥', '🎲', '🦁', '🐍', '🕶️',
  '💰', '🏎️', '⚡', '🏆', '🃏', '🎩', '🚀', '⭐',
  '🍸', '🐺', '🎯', '🐉', '🍀', '🦅', '🦈', '🤖'
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentUsername,
  currentAvatar,
  onSaveProfile,
}) => {
  const [username, setUsername] = useState(currentUsername);
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setUsername(currentUsername);
      setSelectedAvatar(currentAvatar);
      setSavedSuccess(false);
    }
  }, [isOpen, currentUsername, currentAvatar]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = username.trim() || 'HighRoller';
    onSaveProfile(cleanName, selectedAvatar);
    sounds.playWinChime();
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        id="settings-modal-card"
        className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 text-white relative animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-black border border-zinc-800 text-amber-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold font-mono uppercase tracking-wider text-white">Player Profile</h2>
              <p className="text-[10px] text-zinc-400 font-mono">Live Global Leaderboard Identity</p>
            </div>
          </div>
          <button
            id="close-settings-modal-btn"
            onClick={() => {
              sounds.playChipClick();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {/* Avatar Selector */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                Select Your Icon
              </label>
              <span className="text-xl p-1 bg-black border border-zinc-800 rounded-xl px-2.5">
                {selectedAvatar}
              </span>
            </div>

            <div className="grid grid-cols-6 gap-1.5 bg-black/50 border border-zinc-800 p-2 rounded-2xl max-h-36 overflow-y-auto">
              {AVAILABLE_AVATARS.map((emoji) => {
                const isSelected = selectedAvatar === emoji;
                return (
                  <button
                    type="button"
                    key={emoji}
                    onClick={() => {
                      sounds.playChipClick();
                      setSelectedAvatar(emoji);
                    }}
                    className={`text-xl p-2 rounded-xl flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-amber-500/20 border-2 border-amber-400 scale-105 shadow-md'
                        : 'bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:scale-105'
                    }`}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Username Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
              Player Handle / Username
            </label>
            <div className="relative">
              <input
                id="player-username-input"
                type="text"
                maxLength={20}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter player handle..."
                className="w-full bg-black border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400"
                required
              />
              <span className="absolute right-3 top-3 text-[10px] font-mono text-zinc-500">
                {username.length}/20
              </span>
            </div>
          </div>

          {/* Cloud Info notice */}
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-start gap-2 text-[11px] font-mono text-zinc-400">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Your profile and career scores automatically sync in real time to the live Firestore global leaderboard.
            </span>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            id="save-profile-btn"
            className={`w-full py-3 px-4 rounded-xl font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
              savedSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-white hover:bg-zinc-200 text-black shadow-lg'
            }`}
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>SAVED & SYNCED!</span>
              </>
            ) : (
              <span>SAVE PROFILE CHANGES</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
