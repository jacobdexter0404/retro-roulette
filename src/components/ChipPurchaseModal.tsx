import React, { useState } from 'react';
import { X, Check, ShieldCheck, Sparkles, Lock, ArrowRight, Smartphone, Fingerprint, Info } from 'lucide-react';
import { sounds } from '../utils/sound';
import { AppleIAPProduct, requestAppleInAppPurchase } from '../utils/appleIAP';

interface ChipPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBundle: AppleIAPProduct | null;
  onConfirmPurchase: (chipsAdded: number, bundle: AppleIAPProduct) => void;
}

export const ChipPurchaseModal: React.FC<ChipPurchaseModalProps> = ({
  isOpen,
  onClose,
  selectedBundle,
  onConfirmPurchase,
}) => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [purchaseComplete, setPurchaseComplete] = useState<boolean>(false);
  const [transactionId, setTransactionId] = useState<string>('');
  const [authStep, setAuthStep] = useState<'prompt' | 'authenticating' | 'confirmed'>('prompt');

  if (!isOpen || !selectedBundle) return null;

  const totalChips = selectedBundle.chips + selectedBundle.bonusChips;

  const handleConfirmApplePay = async () => {
    sounds.playChipClick();
    setIsProcessing(true);
    setAuthStep('authenticating');

    try {
      const result = await requestAppleInAppPurchase(selectedBundle);

      if (result.success) {
        setAuthStep('confirmed');
        setTransactionId(result.transactionId || `APPL-IAP-${Date.now()}`);
        setTimeout(() => {
          setIsProcessing(false);
          setPurchaseComplete(true);
          sounds.playWinChime();
          onConfirmPurchase(totalChips, selectedBundle);
        }, 800);
      } else {
        setIsProcessing(false);
        setAuthStep('prompt');
      }
    } catch {
      setIsProcessing(false);
      setAuthStep('prompt');
    }
  };

  const handleFinish = () => {
    sounds.playChipClick();
    setPurchaseComplete(false);
    setAuthStep('prompt');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4 select-none animate-in fade-in duration-200">
      <div
        id="apple-iap-modal"
        className="w-full max-w-sm bg-zinc-900/95 border border-zinc-700/80 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl flex flex-col gap-4 text-white relative animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
      >
        {/* iOS Native Modal Drag Pill indicator on mobile */}
        <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto sm:hidden -mt-1 mb-1" />

        {/* Apple In-App Purchase Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-zinc-800 to-black border border-zinc-700 flex items-center justify-center text-white font-bold text-xs shadow-inner">
              🎰
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-xs font-semibold tracking-wide text-white">Retro Roulette</h2>
                <span className="text-[9px] font-mono bg-zinc-800 text-zinc-300 px-1.5 py-0.2 rounded border border-zinc-700">
                  App Store
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-mono">In-App Purchase</p>
            </div>
          </div>
          <button
            id="close-iap-btn"
            onClick={() => {
              sounds.playChipClick();
              setPurchaseComplete(false);
              setAuthStep('prompt');
              onClose();
            }}
            className="w-7 h-7 rounded-full bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {!purchaseComplete ? (
          <div className="flex flex-col gap-4">
            {/* Apple Product Details Card */}
            <div className="bg-black/60 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-700/60 flex items-center justify-center text-2xl shadow-inner">
                    {selectedBundle.icon}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-white tracking-tight">{selectedBundle.name}</span>
                    <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                      +{totalChips.toLocaleString()} Chips
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500">{selectedBundle.productId}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-extrabold text-lg text-white">
                    {selectedBundle.priceFormatted}
                  </span>
                  <span className="block text-[9px] text-zinc-400">Tier {selectedBundle.priceUsd < 5 ? '1' : selectedBundle.priceUsd < 10 ? '2' : '3'}</span>
                </div>
              </div>

              {selectedBundle.bonusChips > 0 && (
                <div className="flex items-center gap-1.5 p-2 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-[10px] font-mono text-emerald-300">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Includes {selectedBundle.bonusChips.toLocaleString()} Free Bonus Casino Chips!</span>
                </div>
              )}
            </div>

            {/* Apple Account Info Section */}
            <div className="p-3 bg-zinc-950/80 border border-zinc-800/80 rounded-2xl flex flex-col gap-1.5 text-[11px] font-mono">
              <div className="flex items-center justify-between text-zinc-400">
                <span>Account:</span>
                <span className="text-white font-medium">Apple ID / StoreKit</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>Product Type:</span>
                <span className="text-zinc-300">Consumable Chip Pack</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>Payment Route:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Apple In-App Purchase
                </span>
              </div>
            </div>

            {/* Apple Store Legal Notice */}
            <p className="text-[10px] text-zinc-500 leading-tight text-center px-1">
              Payment will be charged to your Apple ID account at confirmation of purchase. Consumable items are immediately credited to your bank balance.
            </p>

            {/* Apple In-App Purchase Trigger Button */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                id="apple-confirm-purchase-btn"
                disabled={isProcessing}
                onClick={handleConfirmApplePay}
                className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                  isProcessing
                    ? 'bg-zinc-800 text-zinc-400 cursor-wait'
                    : 'bg-white hover:bg-zinc-200 text-black shadow-xl shadow-white/10'
                }`}
              >
                {authStep === 'authenticating' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-zinc-600 border-t-black rounded-full animate-spin" />
                    <span>Authenticating with Apple ID...</span>
                  </>
                ) : authStep === 'confirmed' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                    <span>Payment Authorized</span>
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-4 h-4 text-zinc-800" />
                    <span>Purchase with Apple ID ({selectedBundle.priceFormatted})</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playChipClick();
                  onClose();
                }}
                className="text-[11px] font-mono text-zinc-400 hover:text-zinc-200 py-1"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* Apple StoreKit Success Receipt */
          <div className="flex flex-col gap-4 py-2 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-12 h-12 bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 rounded-full flex items-center justify-center">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <h3 className="font-mono font-extrabold text-base text-white">PURCHASE COMPLETE</h3>
              <p className="text-xs font-mono text-zinc-400">
                Your Apple In-App Purchase was successful! <br />
                <span className="text-emerald-400 font-bold">+{totalChips.toLocaleString()} Chips</span> added to your bank.
              </p>
            </div>

            {/* Apple Receipt Box */}
            <div className="p-3.5 bg-black border border-zinc-800 rounded-2xl flex flex-col gap-2 font-mono text-xs text-zinc-300">
              <div className="flex items-center justify-between text-[10px] text-zinc-500 pb-1.5 border-b border-zinc-900">
                <span>Apple StoreKit Receipt</span>
                <span className="text-[9px] truncate max-w-[150px]">{transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span>Item:</span>
                <span className="text-white font-bold">{selectedBundle.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Chips Credited:</span>
                <span className="text-emerald-400 font-bold">+${totalChips.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount Charged:</span>
                <span className="text-white font-bold">{selectedBundle.priceFormatted} USD</span>
              </div>
              <div className="flex justify-between text-[10px] text-zinc-500 pt-1 border-t border-zinc-900">
                <span>Status:</span>
                <span className="text-emerald-400 font-bold">Apple ID Verified ✓</span>
              </div>
            </div>

            <button
              id="finish-apple-purchase-btn"
              onClick={handleFinish}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-extrabold text-xs rounded-2xl transition-all shadow-lg active:scale-[0.98]"
            >
              COLLECT CHIPS & RETURN TO GAME
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
