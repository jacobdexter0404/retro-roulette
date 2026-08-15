import React, { useState } from 'react';
import { GameStats } from '../types';
import { Landmark, Coins, ShieldCheck, Clock, Sparkles, ShoppingBag, ArrowRight, Zap, RefreshCw, HelpCircle, ChevronDown, ChevronUp, RotateCcw, Smartphone, Check } from 'lucide-react';
import { sounds } from '../utils/sound';
import { ChipPurchaseModal } from './ChipPurchaseModal';
import { APPLE_IAP_PRODUCTS, AppleIAPProduct, restoreApplePurchases } from '../utils/appleIAP';

interface BankViewProps {
  balance: number;
  stats: GameStats;
  lastDailyBonusTime: number;
  onClaimDailyBonus: () => void;
  onAddChips?: (amount: number) => void;
}

export const BankView: React.FC<BankViewProps> = ({
  balance,
  lastDailyBonusTime,
  onClaimDailyBonus,
  onAddChips,
}) => {
  const [selectedBundle, setSelectedBundle] = useState<AppleIAPProduct | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState<boolean>(false);
  const [showDevGuide, setShowDevGuide] = useState<boolean>(false);
  const [refillSuccess, setRefillSuccess] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);

  const isBonusAvailable = Date.now() - lastDailyBonusTime >= 24 * 60 * 60 * 1000;
  const msRemaining = Math.max(0, 24 * 60 * 60 * 1000 - (Date.now() - lastDailyBonusTime));
  const hoursLeft = Math.floor(msRemaining / (1000 * 60 * 60));
  const minsLeft = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));

  // Determine VIP Tier based on balance
  const getTier = () => {
    if (balance >= 10000) return { name: 'Whale VIP', color: 'text-amber-400 border-amber-500/40 bg-amber-950/20' };
    if (balance >= 5000) return { name: 'High Roller', color: 'text-purple-400 border-purple-500/40 bg-purple-950/20' };
    if (balance >= 2000) return { name: 'Silver Member', color: 'text-blue-400 border-blue-500/40 bg-blue-950/20' };
    return { name: 'Standard Member', color: 'text-zinc-400 border-zinc-700 bg-zinc-900' };
  };

  const tier = getTier();

  // Chip breakdown calculation
  const calculateChipStack = () => {
    let rem = balance;
    const c500 = Math.floor(rem / 500);
    rem %= 500;
    const c100 = Math.floor(rem / 100);
    rem %= 100;
    const c25 = Math.floor(rem / 25);
    rem %= 25;
    const c5 = Math.floor(rem / 5);
    rem %= 5;
    const c1 = rem;
    return { c500, c100, c25, c5, c1 };
  };

  const chips = calculateChipStack();

  const handleOpenBundle = (bundle: AppleIAPProduct) => {
    sounds.playChipClick();
    setSelectedBundle(bundle);
    setIsPurchaseModalOpen(true);
  };

  const handleConfirmPurchase = (chipsAdded: number) => {
    if (onAddChips) {
      onAddChips(chipsAdded);
    }
  };

  const handleEmergencyRefill = () => {
    if (balance < 100 && onAddChips) {
      sounds.playWinChime();
      onAddChips(250);
      setRefillSuccess(true);
      setTimeout(() => setRefillSuccess(false), 3000);
    }
  };

  const handleRestorePurchases = async () => {
    sounds.playChipClick();
    setIsRestoring(true);
    setRestoreMessage(null);
    const res = await restoreApplePurchases();
    setIsRestoring(false);
    setRestoreMessage(res.message);
    setTimeout(() => setRestoreMessage(null), 5000);
  };

  return (
    <div id="bank-view-container" className="w-full h-full flex flex-col justify-between p-4 text-white font-sans max-w-md mx-auto select-none overflow-y-auto">
      <div className="flex flex-col gap-4 pb-6">
        {/* Bank Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-amber-400">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-wider uppercase font-mono">Casino Bank & Store</h1>
              <p className="text-[10px] text-zinc-400 font-mono">Apple In-App Purchases & Vault</p>
            </div>
          </div>
          <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${tier.color}`}>
            {tier.name}
          </span>
        </div>

        {/* Primary Vault Balance Card */}
        <div id="bank-vault-card" className="bg-gradient-to-b from-zinc-900 via-zinc-900 to-black border border-zinc-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Available Chip Balance
            </span>
            <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800">
              USD CHIPS
            </span>
          </div>

          <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight mb-3">
            ${balance.toLocaleString()}
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-3 border-t border-zinc-800/80">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Live Firestore Synced
            </span>
            {balance < 100 ? (
              <button
                id="emergency-refill-btn"
                onClick={handleEmergencyRefill}
                className="text-xs font-mono font-bold text-amber-400 hover:text-amber-300 underline flex items-center gap-1"
              >
                {refillSuccess ? 'Refilled +$250!' : 'Emergency $250 Refill →'}
              </button>
            ) : (
              <span className="text-emerald-400 font-bold">100% Liquid</span>
            )}
          </div>
        </div>

        {/* APPLE IN-APP PURCHASE CHIP STOREFRONT */}
        <div id="chip-store-section" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-200 font-extrabold">
                Apple In-App Purchases
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Smartphone className="w-3 h-3" /> APP STORE IAP
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {APPLE_IAP_PRODUCTS.map((bundle) => {
              const totalChips = bundle.chips + bundle.bonusChips;
              return (
                <div
                  key={bundle.productId}
                  id={`chip-bundle-card-${bundle.productId}`}
                  className={`bg-zinc-900/90 border rounded-2xl p-3.5 flex flex-col justify-between relative transition-all hover:border-zinc-500 hover:scale-[1.02] shadow-lg group ${
                    bundle.popular
                      ? 'border-amber-500/50 bg-gradient-to-b from-zinc-900 via-zinc-900 to-amber-950/20'
                      : 'border-zinc-800'
                  }`}
                >
                  {bundle.badge && (
                    <span
                      className={`absolute -top-2.5 right-3 text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-full uppercase border shadow-sm ${
                        bundle.popular
                          ? 'bg-amber-500 text-black border-amber-300'
                          : 'bg-emerald-600 text-white border-emerald-400'
                      }`}
                    >
                      {bundle.badge}
                    </span>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-2xl">{bundle.icon}</span>
                      <span className="font-mono text-xs font-extrabold text-white bg-black/60 px-2 py-0.5 rounded-md border border-zinc-800">
                        {bundle.priceFormatted}
                      </span>
                    </div>

                    <h3 className="font-mono font-bold text-xs text-white">{bundle.name}</h3>

                    <div className="flex flex-col mt-1">
                      <span className="font-mono font-extrabold text-sm text-emerald-400">
                        +${totalChips.toLocaleString()}
                      </span>
                      {bundle.bonusChips > 0 ? (
                        <span className="text-[10px] font-mono text-amber-300">
                          Includes +${bundle.bonusChips.toLocaleString()} Bonus
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-zinc-500">Standard Tier</span>
                      )}
                    </div>
                  </div>

                  <button
                    id={`buy-bundle-${bundle.productId}-btn`}
                    onClick={() => handleOpenBundle(bundle)}
                    className={`mt-3 w-full py-2 px-3 rounded-xl font-mono text-[11px] font-extrabold flex items-center justify-center gap-1 transition-all active:scale-95 ${
                      bundle.popular
                        ? 'bg-amber-400 hover:bg-amber-300 text-black shadow-md'
                        : 'bg-white hover:bg-zinc-200 text-black'
                    }`}
                  >
                    <span>BUY WITH APPLE</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Restore Purchases Button (Mandatory App Store Guideline 3.1.1) */}
          <div className="flex flex-col items-center gap-1.5 pt-1">
            <button
              id="restore-purchases-btn"
              disabled={isRestoring}
              onClick={handleRestorePurchases}
              className="text-[11px] font-mono text-zinc-400 hover:text-white flex items-center gap-1.5 py-1 transition-colors"
            >
              <RotateCcw className={`w-3 h-3 ${isRestoring ? 'animate-spin' : ''}`} />
              <span>{isRestoring ? 'Contacting App Store...' : 'Restore Apple Purchases'}</span>
            </button>
            {restoreMessage && (
              <p className="text-[10px] font-mono text-emerald-400 text-center animate-in fade-in duration-150">
                {restoreMessage}
              </p>
            )}
          </div>
        </div>

        {/* Daily Bonus Section */}
        <div id="daily-bonus-section" className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-bold">
                Daily Cashier Bonus
              </span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Every 24h
            </span>
          </div>

          {isBonusAvailable ? (
            <button
              id="claim-daily-bonus-btn"
              onClick={() => {
                sounds.playWinChime();
                onClaimDailyBonus();
              }}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-between active:scale-[0.98]"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-200 animate-spin" style={{ animationDuration: '3s' }} />
                <span>CLAIM $100 DAILY BONUS</span>
              </div>
              <span className="text-[10px] bg-emerald-800 text-emerald-100 px-2.5 py-1 rounded-md uppercase font-extrabold">
                READY
              </span>
            </button>
          ) : (
            <div className="w-full py-3 px-4 bg-black border border-zinc-800 rounded-2xl flex items-center justify-between font-mono text-xs">
              <span className="text-zinc-400">Bonus Claimed Today</span>
              <span className="text-amber-400 text-[11px] font-bold">
                Next in {hoursLeft}h {minsLeft}m
              </span>
            </div>
          )}
        </div>

        {/* Chip Stack Breakdown Section */}
        <div id="chip-stack-breakdown" className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 flex flex-col gap-3">
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-bold">
            Cashier Chip Breakdown
          </span>

          <div className="grid grid-cols-5 gap-1.5 text-center font-mono">
            <div className="bg-black/60 border border-zinc-800 rounded-xl p-2 flex flex-col items-center">
              <span className="text-[10px] text-purple-400 font-bold">$500</span>
              <span className="text-xs text-white font-extrabold mt-0.5">{chips.c500}x</span>
            </div>
            <div className="bg-black/60 border border-zinc-800 rounded-xl p-2 flex flex-col items-center">
              <span className="text-[10px] text-zinc-300 font-bold">$100</span>
              <span className="text-xs text-white font-extrabold mt-0.5">{chips.c100}x</span>
            </div>
            <div className="bg-black/60 border border-zinc-800 rounded-xl p-2 flex flex-col items-center">
              <span className="text-[10px] text-emerald-400 font-bold">$25</span>
              <span className="text-xs text-white font-extrabold mt-0.5">{chips.c25}x</span>
            </div>
            <div className="bg-black/60 border border-zinc-800 rounded-xl p-2 flex flex-col items-center">
              <span className="text-[10px] text-red-400 font-bold">$5</span>
              <span className="text-xs text-white font-extrabold mt-0.5">{chips.c5}x</span>
            </div>
            <div className="bg-black/60 border border-zinc-800 rounded-xl p-2 flex flex-col items-center">
              <span className="text-[10px] text-blue-400 font-bold">$1</span>
              <span className="text-xs text-white font-extrabold mt-0.5">{chips.c1}x</span>
            </div>
          </div>
        </div>

        {/* App Store Connect / StoreKit 2 Implementation Guide */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3 flex flex-col gap-2">
          <button
            onClick={() => setShowDevGuide(!showDevGuide)}
            className="flex items-center justify-between text-xs font-mono text-zinc-400 hover:text-white"
          >
            <span className="flex items-center gap-1.5 font-bold">
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              iOS App Store IAP Implementation Guide
            </span>
            {showDevGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showDevGuide && (
            <div className="text-[11px] font-mono text-zinc-400 border-t border-zinc-800 pt-2 flex flex-col gap-2">
              <div>
                <span className="text-white font-bold block mb-1">1. App Store Connect Setup:</span>
                <p>Register these 4 Consumable In-App Purchase products under your app's "In-App Purchases" tab in App Store Connect:</p>
                <ul className="list-disc pl-4 text-[10px] text-zinc-300 mt-1 space-y-0.5">
                  <li><code className="text-amber-400">com.retroroulette.chips.starter</code> ($1.99 - Pocket Stack)</li>
                  <li><code className="text-amber-400">com.retroroulette.chips.pro</code> ($4.99 - High Roller Stash)</li>
                  <li><code className="text-amber-400">com.retroroulette.chips.boss</code> ($9.99 - Pit Boss Vault)</li>
                  <li><code className="text-amber-400">com.retroroulette.chips.whale</code> ($19.99 - Whale Syndicate)</li>
                </ul>
              </div>

              <div>
                <span className="text-white font-bold block mb-1">2. Native StoreKit 2 Swift Bridge:</span>
                <p>In your iOS WKWebView / Xcode wrapper, expose a message handler:</p>
                <pre className="bg-black/90 p-2 rounded-lg text-[9px] text-emerald-300 overflow-x-auto mt-1 font-mono">
{`// Swift StoreKit 2 WKScriptMessageHandler
func userContentController(_ ucc: WKUserContentController, didReceive message: WKScriptMessage) {
  if message.name == "iapPurchase", let body = message.body as? [String: Any],
     let id = body["productId"] as? String {
    Task {
      let result = try await Product.purchase(id)
      // verify transaction & credit chips
    }
  }
}`}
                </pre>
              </div>

              <div>
                <span className="text-white font-bold block mb-1">3. App Store Guideline 3.1.1 Compliance:</span>
                <p>All third-party payment buttons (Google Pay, web forms) have been removed. The app now strictly invokes Apple In-App Purchase and includes the required "Restore Purchases" trigger.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Apple In-App Purchase Modal */}
      <ChipPurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        selectedBundle={selectedBundle}
        onConfirmPurchase={handleConfirmPurchase}
      />
    </div>
  );
};
