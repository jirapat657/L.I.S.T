// src/config.ts

// ใช้ .env ในการกำหนด BASE URL
export const CF_BASE =
  import.meta.env.VITE_CF_BASE_URL ||
  "http://localhost:5001/<lucas-strategy-company-dev>/us-central1";
