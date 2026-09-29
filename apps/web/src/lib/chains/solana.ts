import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
  Keypair,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import bs58 from 'bs58';
import { SUPPORTED_NETWORKS, TokenBalance } from '@aetheris/common';

export class SolanaClient {
  public static getConnection(networkId: string): Connection {
    const config = SUPPORTED_NETWORKS[networkId];
    if (!config || config.family !== 'solana') {
      throw new Error(`Unsupported Solana network ID: ${networkId}`);
    }
    return new Connection(config.rpcUrls[0], 'confirmed');
  }

  public static async getNativeBalance(
    networkId: string,
    publicKeyStr: string
  ): Promise<TokenBalance> {
    const connection = this.getConnection(networkId);
    const config = SUPPORTED_NETWORKS[networkId];

    try {
      const pubkey = new PublicKey(publicKeyStr);
      const balanceLamports = await connection.getBalance(pubkey);
      const formatted = balanceLamports / LAMPORTS_PER_SOL;

      return {
        symbol: config.nativeCurrency.symbol,
        name: config.nativeCurrency.name,
        decimals: config.nativeCurrency.decimals,
        isNative: true,
        balanceRaw: balanceLamports.toString(),
        balanceFormatted: formatted.toFixed(4),
      };
    } catch (error) {
      console.warn(`[Solana RPC] Failed to query balance for ${publicKeyStr}:`, error);
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

  public static async simulateTransfer(
    networkId: string,
    fromAddress: string,
    toAddress: string,
    amountSol: number
  ): Promise<{ success: boolean; feeLamports: number; error?: string }> {
    const connection = this.getConnection(networkId);
    try {
      const fromPubkey = new PublicKey(fromAddress);
      const toPubkey = new PublicKey(toAddress);
      const lamports = Math.round(amountSol * LAMPORTS_PER_SOL);

      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports,
        })
      );

      const latestBlockhash = await connection.getLatestBlockhash('finalized');
      tx.recentBlockhash = latestBlockhash.blockhash;
      tx.feePayer = fromPubkey;

      const simResult = await connection.simulateTransaction(tx);
      if (simResult.value.err) {
        return {
          success: false,
          feeLamports: 5000,
          error: JSON.stringify(simResult.value.err),
        };
      }

      return { success: true, feeLamports: 5000 };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Solana simulation failed';
      return { success: false, feeLamports: 5000, error: msg };
    }
  }

  public static async sendTransfer(
    networkId: string,
    secretKeyBase58: string,
    toAddress: string,
    amountSol: number
  ): Promise<string> {
    const connection = this.getConnection(networkId);
    const keypair = Keypair.fromSecretKey(bs58.decode(secretKeyBase58));
    const toPubkey = new PublicKey(toAddress);
    const lamports = Math.round(amountSol * LAMPORTS_PER_SOL);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey,
        lamports,
      })
    );

    const signature = await sendAndConfirmTransaction(connection, transaction, [keypair]);
    return signature;
  }
}
