export interface UserStats {
  owned: number;
  tradedVolume: number;
  created: number;
  joined: number;
}

export interface UserState {
  address: string | null;
  balance: number;
  isConnected: boolean;
  stats: UserStats;
}

export enum CampaignStatus {
  ACTIVE = 'ACTIVE',
  SUCCESSFUL = 'SUCCESSFUL',
  FAILED = 'FAILED',
}

export interface Campaign {
  id: string;
  name: string;
  ticker: string;
  description: string;
  imageUrl: string;
  targetEth: number;
  raisedEth: number;
  creator: string;
  status: CampaignStatus;
  treasuryAddress: string;
  lockPeriodSeconds: number;
  contributions: any[];
  createdAt: number;
}

export interface NFT {
  id: string;
  tokenId: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  collectionName: string;
  creator: string;
  owner: string;
}

export type ViewState = 'MARKET' | 'HOME' | 'CREATE' | 'DETAILS' | 'PROFILE' | 'PRIVACY' | 'TERMS';

declare global {
  interface Window {
    ethereum?: any;
  }
}