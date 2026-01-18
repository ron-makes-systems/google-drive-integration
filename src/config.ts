import {env} from "./env.js";

// Tier-based storage quota limits (in bytes)
// Keys should match x-marketplace-tier-id header values from the gateway
export const tierQuotaBytes: Record<string, number> = {
  free: 15 * 1024 ** 3, // 15 GB
  pro: 100 * 1024 ** 3, // 100 GB
  enterprise: 1000 * 1024 ** 3, // 1 TB
};

// Get storage quota for a given tier, with fallback to free tier
export const getStorageQuotaForTier = (tier?: string): number => {
  if (tier && tier in tierQuotaBytes) {
    return tierQuotaBytes[tier];
  }
  return tierQuotaBytes.free;
};

export const config = {
  server: {
    port: env["PORT"],
    waitBeforeServerClose: env["WAIT_BEFORE_SERVER_CLOSE"] * 1000,
  },
  logLevel: env["LOG_LEVEL"],
  nodeEnv: env["NODE_ENV"],
  pageSize: env["PAGE_SIZE"],
  maxConcurrentConnections: env["MAX_CONCURRENT_CONNECTIONS"],
  apiVersion: env["API_VERSION"],
  google: {
    clientId: env["GOOGLE_CLIENT_ID"],
    clientSecret: env["GOOGLE_CLIENT_SECRET"],
    redirectUri: env["GOOGLE_REDIRECT_URI"],
    scopes: [
      "https://www.googleapis.com/auth/drive", // Full access needed for sharing
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
  },
};
