export type ManifoldAPIError = {
  message: string;
  details?: {
    [key: string]: unknown;
  };
};

export type MarketTier = 'play' | 'plus' | 'premium' | 'crystal';

export interface StoredMarket {
  id: string;              // Manifold market ID
  encryptedDescription: string;  // Description encrypted with user's API key or password
  descriptionHash: string; // SHA-256 hash of the original description
  encryptedPassword?: string;  // Password encrypted with API key, if market uses password
  createdAt: Date;
}
