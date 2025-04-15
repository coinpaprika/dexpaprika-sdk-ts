import { Token } from './pools';

// Detailed token information
export interface TokenDetails extends Token {
  // Basic information
  logo_url?: string;
  twitter?: string;
  discord?: string;
  telegram?: string;
  contract_address?: string; // Alias for id
  
  // Market data
  market_cap?: number;
  price_usd?: number;
  price_change_24h?: number;
  price_change_7d?: number;
  price_change_30d?: number;
  circulating_supply?: number;
  
  market_data?: {
    price_usd: number;
    volume_usd_24h: number;
    price_change_24h: number;
    ath: number;
    ath_date: string;
    updated_at: string;
  };
  
  // Social links and data
  links?: { 
    twitter?: string; 
    telegram?: string; 
    github?: string;
    coinmarketcap?: string 
  };
  
  social_data?: {
    twitter_followers: number;
    telegram_members: number;
  };
}

// Time interval metrics for tokens
export interface TokenTimeIntervalMetrics {
  volume: number;
  volume_usd: number;
  buy_usd: number;
  sell_usd: number;
  sells: number;
  buys: number;
  txns: number;
  last_price_usd_change?: number;
}

// Token summary metrics
export interface TokenSummary {
  /**
   * Current price of the token in USD
   */
  price_usd: number;
  
  /**
   * Fully diluted valuation of token
   */
  fdv?: number;
  
  /**
   * Total liquidity (in USD) across all pools for this token
   */
  liquidity_usd: number;
  
  /**
   * Total number of pools that include the given token
   */
  pools: number;
  
  /**
   * Metrics for the last 24 hours
   */
  '24h': TokenTimeIntervalMetrics;
  
  /**
   * Metrics for the last 6 hours (optional)
   */
  '6h'?: TokenTimeIntervalMetrics;
  
  /**
   * Metrics for the last 1 hour (optional)
   */
  '1h'?: TokenTimeIntervalMetrics;
  
  /**
   * Metrics for the last 30 minutes (optional)
   */
  '30m'?: TokenTimeIntervalMetrics;
  
  /**
   * Metrics for the last 15 minutes (optional)
   */
  '15m'?: TokenTimeIntervalMetrics;
  
  /**
   * Metrics for the last 5 minutes (optional)
   */
  '5m'?: TokenTimeIntervalMetrics;
  
  /**
   * Metrics for the last 1 minute (optional)
   */
  '1m'?: TokenTimeIntervalMetrics;
}

// Extended token information
export interface TokenWithDetails extends Token {
  summary?: TokenSummary;
  last_updated?: string;
  market_data?: TokenMarketData;
  links?: TokenLinks;
  social_data?: TokenSocialData;
}

// Market data structure
export interface TokenMarketData {
  price_usd: number;
  volume_usd_24h: number;
  price_change_24h: number;
  ath: number;
  ath_date: string;
  updated_at: string;
}

// Social and external links
export interface TokenLinks {
  twitter?: string;
  telegram?: string;
  github?: string;
  coinmarketcap?: string;
}

// Social media statistics
export interface TokenSocialData {
  twitter_followers: number;
  telegram_members: number;
}

// Time period metrics
export interface TokenTimeInterval {
  time_start: string;
  time_end: string;
  price_change: number; 
  volume: number;
  txns: number;
} 