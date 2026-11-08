'use client';

import React, { useState } from 'react';
import { ClientVaultManager } from '../lib/crypto/vault';
import { EncryptedVault, UnlockedVaultData } from '@aetheris/common';
import { KeyRound, Shield, AlertTriangle, Copy, Check, ArrowRight, Eye, EyeOff, Lock, RefreshCw } from 'lucide-react';

interface WalletOnboardingProps {
  existingVault: EncryptedVault | null;
  onUnlocked: (data: UnlockedVaultData, vault: EncryptedVault) => void;
  onResetVault: () => void;
}

export const WalletOnboarding: React.FC<WalletOnboardingProps> = ({
  existingVault,
  onUnlocked,
  onResetVault,
}) => {
  const [mode, setMode] = useState<'create' | 'import' | 'unlock'>(
    existingVault ? 'unlock' : 'create'
  );

  // Creation State
  const [step, setStep] = useState<'generate' | 'confirm_backup' | 'set_password' | 'import'>('generate');
  const [mnemonic, setMnemonic] = useState<string>('');
  const [hasCopied, setHasCopied] = useState(false);
  const [hasConfirmedBackup, setHasConfirmedBackup] = useState(false);
  const [passwordFlowOrigin, setPasswordFlowOrigin] = useState<'create' | 'import'>('create');

  // Import State
  const [importInput, setImportInput] = useState('');
  const [importError, setImportError] = useState('');

  // Password / Unlock State
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle initialization of fresh mnemonic
  const startCreate = () => {
    const freshMnemonic = ClientVaultManager.generateMnemonic();
    setMnemonic(freshMnemonic);
    setStep('generate');
    setMode('create');
  };

  const handleCopyMnemonic = () => {
    navigator.clipboard.writeText(mnemonic);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2500);
  };

  const handleCreateVault = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setIsProcessing(true);
    try {
      const derived = ClientVaultManager.deriveAccountsFromMnemonic(mnemonic);
      const unlockedData: UnlockedVaultData = {
        mnemonic,
        evmPrivateKey: derived.evmPrivateKey,
        solanaPrivateKey: derived.solanaPrivateKey,
      };

      const encryptedVault = await ClientVaultManager.encryptVault(unlockedData, password);
      onUnlocked(unlockedData, encryptedVault);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create vault';
      setPasswordError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportVault = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportError('');

    if (!ClientVaultManager.validateMnemonic(importInput)) {
      setImportError('Invalid BIP-39 mnemonic phrase. Check word spelling and count (12 or 24 words).');
      return;
    }

    setMnemonic(importInput.trim());
    setPasswordFlowOrigin('import');
    setStep('set_password');
    setMode('create');
  };

  const handleBackFromPassword = () => {
    if (passwordFlowOrigin === 'import') {
      setMode('import');
      setStep('import');
    } else {
      setStep('confirm_backup');
    }
    setPasswordFlowOrigin('create');
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!existingVault) return;
    setPasswordError('');
    setIsProcessing(true);

    try {
      const unlockedData = await ClientVaultManager.decryptVault(existingVault, password);
      onUnlocked(unlockedData, existingVault);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Incorrect password.';
      setPasswordError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-8 p-6 sm:p-8 rounded-3xl glass-panel shadow-2xl border border-white/10">
      {/* UNLOCK EXISTING VAULT */}
      {mode === 'unlock' && existingVault && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-brand-emerald/10 border border-brand-emerald/30 mx-auto flex items-center justify-center">
              <Lock className="w-6 h-6 text-brand-emerald" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Unlock Your Vault</h2>
            <p className="text-sm text-slate-400">
              Enter your password to decrypt your session keypairs in local memory.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Vault Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter vault password"
                  required
                  className="w-full bg-obsidian-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-emerald transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordError && (
                <p className="text-xs text-brand-ruby flex items-center gap-1.5 mt-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{passwordError}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3.5 rounded-xl bg-brand-emerald hover:bg-emerald-400 font-semibold text-obsidian-950 shadow-glow-emerald transition flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Decrypting Vault...</span>
                </>
              ) : (
                <>
                  <span>Unlock Session</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
            <span>Forgot your password?</span>
            <button
              type="button"
              onClick={onResetVault}
              className="text-red-400 hover:text-red-300 transition underline underline-offset-2"
            >
              Reset Vault (Requires Mnemonic)
            </button>
          </div>
        </div>
      )}

      {/* CREATE NEW WALLET */}
      {mode === 'create' && step !== 'set_password' && (
        <div className="space-y-6">
          {step === 'generate' && (
            <div className="space-y-6">
              <div className="text-center space-y-1.5">
                <div className="w-12 h-12 rounded-2xl bg-brand-cyan/10 border border-brand-cyan/30 mx-auto flex items-center justify-center">
                  <KeyRound className="w-6 h-6 text-brand-cyan" />
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Create Sovereign Wallet</h2>
                <p className="text-xs text-slate-400">
                  A 12-word BIP-39 phrase generates your multi-chain accounts client-side.
                </p>
              </div>

              {!mnemonic ? (
                <div className="space-y-4 pt-2">
                  <button
                    onClick={startCreate}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-emerald to-brand-cyan hover:opacity-90 font-semibold text-obsidian-950 shadow-glow-emerald transition flex items-center justify-center gap-2"
                  >
                    <span>Generate Secure Seed Phrase</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="text-center">
                    <button
                      onClick={() => setMode('import')}
                      className="text-xs text-slate-400 hover:text-white transition"
                    >
                      Already have a seed phrase? <span className="text-brand-cyan underline">Import Wallet</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Warning Box */}
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold text-amber-200">Non-Custodial Guarantee & Warning</p>
                      <p className="text-amber-300/80 leading-relaxed">
                        Write these 12 words down in exact sequence. This seed phrase will never be stored on any server. If you lose it, your funds cannot be recovered by anyone.
                      </p>
                    </div>
                  </div>

                  {/* Words Grid */}
                  <div className="grid grid-cols-3 gap-2.5 bg-obsidian-950 p-4 rounded-2xl border border-white/10">
                    {mnemonic.split(' ').map((word, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-obsidian-900 border border-white/5 font-mono text-xs text-slate-200"
                      >
                        <span className="text-slate-500 text-[10px] w-4">{idx + 1}.</span>
                        <span className="font-semibold">{word}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <button
                      onClick={handleCopyMnemonic}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-obsidian-800 hover:bg-obsidian-750 border border-white/10 text-xs font-medium text-slate-300 hover:text-white transition flex items-center justify-center gap-2"
                    >
                      {hasCopied ? (
                        <>
                          <Check className="w-4 h-4 text-brand-emerald" />
                          <span>Copied to Clipboard</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy Phrase</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setStep('confirm_backup')}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-brand-emerald hover:bg-emerald-400 text-obsidian-950 font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-glow-emerald"
                    >
                      <span>I Saved It</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'confirm_backup' && (
            <div className="space-y-6">
              <div className="text-center space-y-1.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 mx-auto flex items-center justify-center">
                  <Shield className="w-6 h-6 text-amber-400" />
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Confirm Backup</h2>
                <p className="text-xs text-slate-400">
                  Please confirm that you have safely recorded your seed phrase.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-obsidian-950 border border-white/10 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasConfirmedBackup}
                    onChange={(e) => setHasConfirmedBackup(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-white/20 bg-obsidian-900 text-brand-emerald focus:ring-0"
                  />
                  <span className="text-xs text-slate-300 leading-relaxed">
                    I understand that my seed phrase is the ONLY way to recover my assets. Neither Aetheris nor any third party can restore my wallet if I lose it.
                  </span>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('generate')}
                  className="px-4 py-3 rounded-xl bg-obsidian-800 hover:bg-obsidian-750 text-slate-300 text-xs font-medium"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!hasConfirmedBackup}
                  onClick={() => setStep('set_password')}
                  className="flex-1 py-3 rounded-xl bg-brand-emerald disabled:opacity-40 hover:bg-emerald-400 font-semibold text-xs text-obsidian-950 shadow-glow-emerald transition"
                >
                  Proceed to Device Password
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SET PASSWORD STEP (shared between create and import) */}
      {step === 'set_password' && (
        <form onSubmit={handleCreateVault} className="space-y-5">
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 rounded-2xl bg-brand-emerald/10 border border-brand-emerald/30 mx-auto flex items-center justify-center">
              <Lock className="w-6 h-6 text-brand-emerald" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Encrypt Local Vault</h2>
            <p className="text-xs text-slate-400">
              Choose a password to encrypt your wallet on this browser using AES-GCM (256-bit).
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Set Password (min 8 chars)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter strong password"
                className="w-full bg-obsidian-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand-emerald focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Re-enter password"
                className="w-full bg-obsidian-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand-emerald focus:outline-none"
              />
            </div>

            {passwordError && (
              <p className="text-xs text-brand-ruby flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{passwordError}</span>
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleBackFromPassword}
              className="px-4 py-3 rounded-xl bg-obsidian-800 hover:bg-obsidian-750 text-slate-300 text-xs font-medium"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="flex-1 py-3.5 rounded-xl bg-brand-emerald hover:bg-emerald-400 font-semibold text-obsidian-950 shadow-glow-emerald transition flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Encrypting Vault...</span>
                </>
              ) : (
                <>
                  <span>Finish Setup & Open Wallet</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* IMPORT EXISTING WALLET */}
      {mode === 'import' && step !== 'set_password' && (
        <form onSubmit={handleImportVault} className="space-y-5">
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 rounded-2xl bg-brand-cyan/10 border border-brand-cyan/30 mx-auto flex items-center justify-center">
              <KeyRound className="w-6 h-6 text-brand-cyan" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Import Existing Wallet</h2>
            <p className="text-xs text-slate-400">
              Enter your 12 or 24-word recovery phrase.
            </p>
          </div>

          <div className="space-y-2">
            <textarea
              rows={3}
              value={importInput}
              onChange={(e) => setImportInput(e.target.value)}
              placeholder="e.g. apple banana cherry dog elephant fox grape horse igloo jaguar kite lemon"
              className="w-full bg-obsidian-950 border border-white/10 rounded-xl p-3.5 text-sm font-mono text-white placeholder-slate-600 focus:border-brand-cyan focus:outline-none resize-none"
              required
            />
            {importError && (
              <p className="text-xs text-brand-ruby flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{importError}</span>
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setMode('create')}
              className="px-4 py-3 rounded-xl bg-obsidian-800 hover:bg-obsidian-750 text-slate-300 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-brand-cyan hover:bg-cyan-400 text-obsidian-950 font-semibold text-xs shadow-glow-cyan transition"
            >
              Verify Seed Phrase
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
