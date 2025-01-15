export type ManifoldAPIError = {
  message: string;
  details?: {
    [key: string]: unknown;
  };
};

export interface StoredMarket {
  id: string;              // Manifold market ID
  encryptedDescription: string;  // Description encrypted with user's API key
  descriptionHash: string; // SHA-256 hash of the original description
  createdAt: Date;
  revealed: boolean;       // Whether the description has been publicly revealed
}
