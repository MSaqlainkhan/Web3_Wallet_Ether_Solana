import {
  createPublicClient,
  createWalletClient,
  fallback,
  http,
  formatEther,
  parseEther,
  type Hash,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia, mainnet, arbitrumSepolia, polygonAmoy } from 'viem/chains';
import { SUPPORTED_NETWORKS, TokenBalance, TransactionRecord } from '@aetheris/common';

const CHAIN_MAP = {
  'ethereum-sepolia': sepolia,
  'ethereum-mainnet': mainnet,
  'arbitrum-sepolia': arbitrumSepolia,
  'polygon-amoy': polygonAmoy,
};

export class EvmClient {
  public static getPublicClient(networkId: string) {
    const config = SUPPORTED_NETWORKS[networkId];
    if (!config || config.family !== 'evm') {
      throw new Error(`Unsupported EVM network ID: ${networkId}`);
    }

    const chain = CHAIN_MAP[networkId as keyof typeof CHAIN_MAP] || sepolia;

    // Build multi-RPC fallback transport to prevent downtime if one RPC fails
    const transports = config.rpcUrls.map((url) =>
      http(url, {
        timeout: 10_000,
        retryCount: 2,
        retryDelay: 1_000,
      })
    );

    return createPublicClient({
      chain,
      transport: fallback(transports, { rank: false }),
    });
  }

  public static async getNativeBalance(
    networkId: string,
    address: `0x${string}`
  ): Promise<TokenBalance> {
    const client = this.getPublicClient(networkId);
    const config = SUPPORTED_NETWORKS[networkId];

    try {
      const balance = await client.getBalance({ address });
      const formatted = formatEther(balance);
      const num = Number(formatted);

      let balanceFormatted = num.toFixed(4);
      if (num > 0) {
        // Display precise non-zero balances (e.g. 0.011 instead of rounding down)
        balanceFormatted = parseFloat(num.toFixed(6)).toString();
        if (!balanceFormatted.includes('.')) {
          balanceFormatted = `${balanceFormatted}.0000`;
        }
      }

      return {
        symbol: config.nativeCurrency.symbol,
        name: config.nativeCurrency.name,
        decimals: config.nativeCurrency.decimals,
        isNative: true,
        balanceRaw: balance.toString(),
        balanceFormatted,
      };
    } catch (error) {
      console.warn(`[EVM RPC] Failed to query balance for ${address}:`, error);
      return {
        symbol: config.nativeCurrency.symbol,
        name: config.nativeCurrency.name,
        decimals: config.nativeCurrency.decimals,
        isNative: true,
        balanceRaw: '0',
        balanceFormatted: '0.0000',
      };
    }
  }

  public static async fetchTransactionHistory(
    networkId: string,
    address: `0x${string}`
  ): Promise<TransactionRecord[]> {
    if (networkId !== 'ethereum-sepolia') return [];

    try {
      const res = await fetch(
        `https://eth-sepolia.blockscout.com/api?module=account&action=txlist&address=${address}&page=1&offset=25&sort=desc`
      );
      if (!res.ok) return [];
      const data = await res.json();
      if (data.status !== '1' || !Array.isArray(data.result)) return [];

      return data.result.map((item: any) => {
        const isSend = item.from?.toLowerCase() === address.toLowerCase();
        const valueEth = formatEther(BigInt(item.value || '0'));
        return {
          id: item.hash,
          hash: item.hash,
          networkId,
          type: isSend ? 'send' : 'receive',
          from: item.from,
          to: item.to,
          amount: parseFloat(Number(valueEth).toFixed(6)).toString(),
          symbol: 'ETH',
          status: item.isError === '0' ? 'confirmed' : 'failed',
          timestamp: Number(item.timeStamp) * 1000,
          explorerUrl: `https://sepolia.etherscan.io/tx/${item.hash}`,
        };
      });
    } catch (err) {
      console.warn('[EVM History] Failed to fetch on-chain history:', err);
      return [];
    }
  }

  public static async simulateTransfer(
    networkId: string,
    fromAddress: `0x${string}`,
    toAddress: `0x${string}`,
    amountEth: string
  ): Promise<{ success: boolean; gasEstimate: bigint; error?: string }> {
    const client = this.getPublicClient(networkId);
    try {
      const value = parseEther(amountEth);
      const gasEstimate = await client.estimateGas({
        account: fromAddress,
        to: toAddress,
        value,
      });

      // Simulation via eth_call
      await client.call({
        account: fromAddress,
        to: toAddress,
        value,
      });

      return { success: true, gasEstimate };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Simulation failed';
      return { success: false, gasEstimate: 21000n, error: msg };
    }
  }

  public static async sendTransfer(
    networkId: string,
    privateKey: `0x${string}`,
    toAddress: `0x${string}`,
    amountEth: string
  ): Promise<Hash> {
    const account = privateKeyToAccount(privateKey);
    const config = SUPPORTED_NETWORKS[networkId];
    const chain = CHAIN_MAP[networkId as keyof typeof CHAIN_MAP] || sepolia;

    const transports = config.rpcUrls.map((url) =>
      http(url, {
        timeout: 10_000,
        retryCount: 2,
        retryDelay: 1_000,
      })
    );

    const walletClient = createWalletClient({
      account,
      chain,
      transport: fallback(transports, { rank: false }),
    });

    const hash = await walletClient.sendTransaction({
      to: toAddress,
      value: parseEther(amountEth),
    });

    return hash;
  }
}
