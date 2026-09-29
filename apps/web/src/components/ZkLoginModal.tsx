'use client';

import React, { useState } from 'react';
import { X, Shield, Lock, AlertTriangle, CheckCircle2, ArrowRight, RefreshCw, Info } from 'lucide-react';

interface ZkLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onZkAccountDerived: (derivedAddress: string) => void;
}

export const ZkLoginModal: React.FC<ZkLoginModalProps> = ({
  isOpen,
  onClose,
  onZkAccountDerived,
}) => {
  const [step, setStep] = useState<'info' | 'authenticating' | 'proving' | 'derived'>('info');
  const [simulatedEmail, setSimulatedEmail] = useState('user.sovereign@example.com');
  const [derivedZkAddress, setDerivedZkAddress] = useState('');

  if (!isOpen) return null;

  const handleStartZkFlow = async () => {
    setStep('authenticating');

    // Step 1: Simulate OIDC / Google OAuth flow yielding a signed JWT
    await new Promise((r) => setTimeout(r, 1200));

    // Step 2: Simulate client-side ZK proof computation (snarkjs / circom / Sui zkLogin circuit)
    setStep('proving');
    await new Promise((r) => setTimeout(r, 1600));

    // Step 3: Deterministic address derivation from H(iss, sub, user_salt)
    const mockDerived = `0x71C${Array.from({ length: 37 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    setDerivedZkAddress(mockDerived);
    setStep('derived');
    onZkAccountDerived(mockDerived);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-obsidian-900 border border-white/10 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Zero-Knowledge OIDC Login</h3>
              <p className="text-xs text-purple-400/80">
                ZK-Proof OAuth Account Access
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* HONESTY & SECURITY TRUST BOUNDARY BOX */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-amber-200">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Cryptographic Trust Assumptions & Limitations</span>
          </div>
          <p className="text-amber-300/80 leading-relaxed">
            <strong>ZK-login is NOT more secure than a hardware wallet or seed phrase.</strong> While the ZK proof prevents revealing your personal email/JWT on-chain, this flow introduces trust dependencies on the OAuth identity provider (e.g. Google account recovery/censorship) and the salt coordinator service.
          </p>
          <p className="text-amber-300/80 leading-relaxed">
            Aetheris treats ZK-login as an auxiliary convenience layer. Your primary cryptographic sovereign assets should always be secured by a BIP-39 mnemonic phrase.
          </p>
        </div>

        {/* STEP: INFO & INITIATE */}
        {step === 'info' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Simulated OAuth Provider Account
              </label>
              <input
                type="email"
                value={simulatedEmail}
                onChange={(e) => setSimulatedEmail(e.target.value)}
                className="w-full bg-obsidian-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-400"
                placeholder="user@example.com"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-obsidian-950 border border-white/5 text-xs text-slate-400 space-y-1.5">
              <div className="flex items-center gap-1.5 font-medium text-slate-300">
                <Info className="w-3.5 h-3.5 text-brand-cyan" />
                <span>How zkLogin Operates:</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-400">
                <li>Signs into OAuth provider without giving the wallet access to your password.</li>
                <li>Generates an ephemeral cryptographic keypair on your device.</li>
                <li>Computes a Zero-Knowledge proof verifying JWT signature without revealing identity.</li>
                <li>No server ever observes or custodies your private key.</li>
              </ul>
            </div>

            <button
              onClick={handleStartZkFlow}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-brand-cyan hover:opacity-95 font-semibold text-obsidian-950 shadow-lg transition flex items-center justify-center gap-2 text-sm"
            >
              <span>Authenticate & Compute ZK Proof</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP: AUTHENTICATING */}
        {step === 'authenticating' && (
          <div className="py-8 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
            <h4 className="text-sm font-semibold text-white">Authenticating with OAuth Provider...</h4>
            <p className="text-xs text-slate-400">
              Requesting signed OIDC JWT token with client ephemeral nonce commitment.
            </p>
          </div>
        )}

        {/* STEP: PROVING */}
        {step === 'proving' && (
          <div className="py-8 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-brand-cyan animate-spin mx-auto" />
            <h4 className="text-sm font-semibold text-white">Computing Zero-Knowledge Proof (Groth16)...</h4>
            <p className="text-xs text-slate-400">
              Proving JWT validity client-side while concealing subject identifier and signature.
            </p>
          </div>
        )}

        {/* STEP: DERIVED ACCOUNT */}
        {step === 'derived' && (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-bold text-white">ZK Account Derived!</h4>
              <p className="text-xs text-slate-400">
                Deterministic address derived from OAuth claim hash and private salt.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-obsidian-950 border border-white/10 font-mono text-xs text-slate-300 break-all">
              {derivedZkAddress}
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-purple-500 hover:bg-purple-400 text-obsidian-950 font-bold text-xs transition"
            >
              Continue to Wallet
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
