'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  DEFAULT_NETWORK_ID,
  SUPPORTED_NETWORKS,
  EncryptedVault,
  UnlockedVaultData,
  TokenBalance,
  TransactionRecord,
} from '@aetheris/common';
import { Header } from '../components/Header';
import { TestnetBanner } from '../components/TestnetBanner';
import { WalletOnboarding } from '../components/WalletOnboarding';
import { BalanceCard } from '../components/BalanceCard';
import { SendModal } from '../components/SendModal';
import { ReceiveModal } from '../components/ReceiveModal';
import { SwapCard } from '../components/SwapCard';
import { DepositWithdrawModal } from '../components/DepositWithdrawModal';
import { ZkLoginModal } from '../components/ZkLoginModal';
import { TransactionHistory } from '../components/TransactionHistory';
import { SecurityChecklistCard } from '../components/SecurityChecklistCard';
import { EvmClient } from '../lib/chains/evm';
import { SolanaClient } from '../lib/chains/solana';
import { Shield, Sparkles, Layers, ArrowLeftRight, Activity } from 'lucide-react';

const VAULT_STORAGE_KEY = 'aetheris_encrypted_vault';
const NETWORK_STORAGE_KEY = 'aetheris_active_network';
const TXS_STORAGE_KEY = 'aetheris_tx_history';

export default function Home() {
  // Network Selection state (strictly defaulting to Sepolia for testnet safety)
  const [currentNetworkId, setCurrentNetworkId] = useState<string>(DEFAULT_NETWORK_ID);

  // Vault & Authentication state
  const [encryptedVault, setEncryptedVault] = useState<EncryptedVault | null>(null);
  const [unlockedData, setUnlockedData] = useState<UnlockedVaultData | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  // Balances state
  const [nativeBalance, setNativeBalance] = useState<TokenBalance | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Transaction history state
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);

  // Active view tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'swap' | 'activity' | 'security'>('overview');

  // Modals state
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [isDepositWithdrawOpen, setIsDepositWithdrawOpen] = useState(false);
  const [depositWithdrawTab, setDepositWithdrawTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [isZkLoginOpen, setIsZkLoginOpen] = useState(false);

  // Load session and vault on initial mount
  useEffect(() => {
    try {
      const storedNetwork = localStorage.getItem(NETWORK_STORAGE_KEY);
      // Verify stored network is valid and fallback to testnet if not set
      if (storedNetwork && SUPPORTED_NETWORKS[storedNetwork]) {
        setCurrentNetworkId(storedNetwork);
      } else {
        setCurrentNetworkId(DEFAULT_NETWORK_ID);
      }

      const storedVault = localStorage.getItem(VAULT_STORAGE_KEY);
      if (storedVault) {
        setEncryptedVault(JSON.parse(storedVault));
      }

      const storedTxs = localStorage.getItem(TXS_STORAGE_KEY);
      if (storedTxs) {
        setTransactions(JSON.parse(storedTxs));
      }
    } catch (e) {
      console.error('Failed to load local storage:', e);
    } finally {
      setIsLoadingSession(false);
    }
  }, []);

  // Handle switching network with immediate total cache invalidation
  const handleSelectNetwork = (networkId: string) => {
    setCurrentNetworkId(networkId);
    setNativeBalance(null); // Invalidate old balance immediately
    localStorage.setItem(NETWORK_STORAGE_KEY, networkId);
  };

  // Derived current address based on active network family
  const network = SUPPORTED_NETWORKS[currentNetworkId] || SUPPORTED_NETWORKS[DEFAULT_NETWORK_ID];
  const isEvm = network.family === 'evm';
  const currentAddress = encryptedVault
    ? isEvm
      ? encryptedVault.accounts.evmAddress
      : encryptedVault.accounts.solanaAddress
    : undefined;

  // Balance and on-chain transaction polling
  const refreshBalance = useCallback(async () => {
    if (!encryptedVault || !currentAddress) return;

    setIsLoadingBalance(true);
    try {
      if (isEvm) {
        const evmAddr = encryptedVault.accounts.evmAddress as `0x${string}`;
        const bal = await EvmClient.getNativeBalance(currentNetworkId, evmAddr);
        setNativeBalance(bal);

        // Fetch live on-chain history (incoming deposits and outgoing transfers)
        const onChainTxs = await EvmClient.fetchTransactionHistory(currentNetworkId, evmAddr);
        if (onChainTxs.length > 0) {
          setTransactions((prev) => {
            const seen = new Set<string>();
            const merged: TransactionRecord[] = [];

            for (const tx of onChainTxs) {
              if (!seen.has(tx.hash.toLowerCase())) {
                seen.add(tx.hash.toLowerCase());
                merged.push(tx);
              }
            }
            for (const tx of prev) {
              if (!seen.has(tx.hash.toLowerCase())) {
                seen.add(tx.hash.toLowerCase());
                merged.push(tx);
              }
            }

            merged.sort((a, b) => b.timestamp - a.timestamp);
            try {
              localStorage.setItem(TXS_STORAGE_KEY, JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      } else {
        const bal = await SolanaClient.getNativeBalance(
          currentNetworkId,
          encryptedVault.accounts.solanaAddress
        );
        setNativeBalance(bal);
      }
    } catch (err) {
      console.warn('Balance refresh error:', err);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [encryptedVault, currentAddress, isEvm, currentNetworkId]);

  // Initial balance update and periodic 7-second background polling
  useEffect(() => {
    if (!unlockedData || !currentAddress) return;

    refreshBalance();

    const interval = setInterval(() => {
      refreshBalance();
    }, 7000);

    return () => clearInterval(interval);
  }, [unlockedData, currentAddress, currentNetworkId, refreshBalance]);

  // Lock wallet session
  const handleLockWallet = () => {
    setUnlockedData(null);
  };

  // Reset vault (with user warning)
  const handleResetVault = () => {
    if (confirm('Are you sure you want to reset this vault? Ensure you have your 12-word seed phrase backed up, as all local encrypted data will be wiped.')) {
      localStorage.removeItem(VAULT_STORAGE_KEY);
      setEncryptedVault(null);
      setUnlockedData(null);
      setNativeBalance(null);
    }
  };

  // Handle vault unlocked
  const handleVaultUnlocked = (data: UnlockedVaultData, vault: EncryptedVault) => {
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(vault));
    setEncryptedVault(vault);
    setUnlockedData(data);
  };

  // Handle successful send transaction
  const handleSendSuccess = (txHash: string) => {
    const newTx: TransactionRecord = {
      id: `${Date.now()}-${txHash.slice(0, 8)}`,
      hash: txHash,
      networkId: currentNetworkId,
      type: 'send',
      from: currentAddress || '',
      to: 'External Address',
      amount: '0.001',
      symbol: network.nativeCurrency.symbol,
      status: 'confirmed',
      timestamp: Date.now(),
      explorerUrl: network.blockExplorers[0]?.url || '',
    };

    const updated = [newTx, ...transactions];
    setTransactions(updated);
    localStorage.setItem(TXS_STORAGE_KEY, JSON.stringify(updated));
    refreshBalance();
  };

  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-obsidian-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-emerald border-t-transparent animate-spin" />
      </div>
    );
  }

  const isUnlocked = Boolean(unlockedData);

  return (
    <div className="min-h-screen flex flex-col bg-obsidian-950 text-slate-100">
      {/* Testnet Persistent Top Banner */}
      <TestnetBanner currentNetworkId={currentNetworkId} />

      {/* Main Header */}
      <Header
        currentNetworkId={currentNetworkId}
        onSelectNetwork={handleSelectNetwork}
        isUnlocked={isUnlocked}
        hasVault={Boolean(encryptedVault)}
        currentAddress={currentAddress}
        onLockWallet={handleLockWallet}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {!isUnlocked ? (
          <div className="space-y-6">
            <WalletOnboarding
              existingVault={encryptedVault}
              onUnlocked={handleVaultUnlocked}
              onResetVault={handleResetVault}
            />

            {/* Optional ZK-Login Teaser */}
            <div className="max-w-xl mx-auto p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 text-center space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-purple-300">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Looking for seamless OAuth access?</span>
              </div>
              <p className="text-xs text-slate-400">
                Test the ZK-login flow using Google OIDC JWT verification without ever sharing your seed phrase.
              </p>
              <button
                onClick={() => setIsZkLoginOpen(true)}
                className="px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/30 text-xs font-bold transition"
              >
                Launch ZK-Proof Login Simulation
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* View Navigation Tabs */}
            <div className="flex items-center justify-center">
              <div className="flex items-center p-1.5 rounded-2xl bg-obsidian-900 border border-white/10 shadow-inner">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'overview'
                      ? 'bg-brand-emerald text-obsidian-950 shadow-glow-emerald'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Wallet Overview</span>
                </button>

                <button
                  onClick={() => setActiveTab('swap')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'swap'
                      ? 'bg-brand-emerald text-obsidian-950 shadow-glow-emerald'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  <span>DEX Swaps</span>
                </button>

                <button
                  onClick={() => setActiveTab('activity')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'activity'
                      ? 'bg-brand-emerald text-obsidian-950 shadow-glow-emerald'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  <span>History</span>
                </button>

                <button
                  onClick={() => setActiveTab('security')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'security'
                      ? 'bg-brand-emerald text-obsidian-950 shadow-glow-emerald'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>Audit Readiness</span>
                </button>
              </div>
            </div>

            {/* TAB CONTENT */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <BalanceCard
                    currentNetworkId={currentNetworkId}
                    address={currentAddress || ''}
                    nativeBalance={nativeBalance}
                    isLoadingBalance={isLoadingBalance}
                    onRefreshBalance={refreshBalance}
                    onOpenSend={() => setIsSendOpen(true)}
                    onOpenReceive={() => setIsReceiveOpen(true)}
                    onOpenSwap={() => setActiveTab('swap')}
                    onOpenDepositWithdraw={(tab) => {
                      setDepositWithdrawTab(tab);
                      setIsDepositWithdrawOpen(true);
                    }}
                  />

                  <TransactionHistory
                    transactions={transactions}
                    currentNetworkId={currentNetworkId}
                  />
                </div>

                <div className="space-y-6">
                  <SecurityChecklistCard />
                </div>
              </div>
            )}

            {activeTab === 'swap' && unlockedData && (
              <div className="py-4">
                <SwapCard
                  currentNetworkId={currentNetworkId}
                  nativeBalance={nativeBalance}
                  evmPrivateKey={unlockedData.evmPrivateKey as `0x${string}`}
                  solanaPrivateKey={unlockedData.solanaPrivateKey}
                />
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="max-w-3xl mx-auto py-4">
                <TransactionHistory
                  transactions={transactions}
                  currentNetworkId={currentNetworkId}
                />
              </div>
            )}

            {activeTab === 'security' && (
              <div className="max-w-3xl mx-auto py-4">
                <SecurityChecklistCard />
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODALS */}
      {currentAddress && unlockedData && (
        <>
          <SendModal
            isOpen={isSendOpen}
            onClose={() => setIsSendOpen(false)}
            currentNetworkId={currentNetworkId}
            senderEvmAddress={encryptedVault?.accounts.evmAddress || ''}
            senderSolanaAddress={encryptedVault?.accounts.solanaAddress || ''}
            evmPrivateKey={unlockedData.evmPrivateKey as `0x${string}`}
            solanaPrivateKey={unlockedData.solanaPrivateKey}
            nativeBalance={nativeBalance}
            onSuccess={handleSendSuccess}
          />

          <ReceiveModal
            isOpen={isReceiveOpen}
            onClose={() => setIsReceiveOpen(false)}
            currentNetworkId={currentNetworkId}
            address={currentAddress}
          />

          <DepositWithdrawModal
            isOpen={isDepositWithdrawOpen}
            onClose={() => setIsDepositWithdrawOpen(false)}
            initialTab={depositWithdrawTab}
            currentNetworkId={currentNetworkId}
            address={currentAddress}
          />
        </>
      )}

      {/* ZK-Login Modal */}
      <ZkLoginModal
        isOpen={isZkLoginOpen}
        onClose={() => setIsZkLoginOpen(false)}
        onZkAccountDerived={(addr) => {
          console.log('ZK Account Derived:', addr);
        }}
      />
    </div>
  );
}
