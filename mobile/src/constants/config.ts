/**
 * OCPP Gateway base URL.
 * Expo injects EXPO_PUBLIC_* from .env at build time (restart "npm start" after changing .env).
 * - iOS Simulator: http://localhost:3000
 * - Android Emulator: http://10.0.2.2:3000
 * - Physical device: http://BILGISAYAR_IP:3000
 */
export const OCPP_GATEWAY_URL: string =
  typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_OCPP_GATEWAY_URL
    ? process.env.EXPO_PUBLIC_OCPP_GATEWAY_URL
    : 'http://localhost:3000';

/**
 * Backend API base URL for auth and charge.
 * - iOS Simulator: http://localhost:4000
 * - Android Emulator: http://10.0.2.2:4000
 * - Physical device: http://BILGISAYAR_IP:4000
 */
export const BACKEND_API_URL: string =
  typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_BACKEND_API_URL
    ? process.env.EXPO_PUBLIC_BACKEND_API_URL
    : 'http://localhost:4000';

/** idTag format for logged-in users: USER-{userId}. Fallback when not logged in. */
export const DEFAULT_ID_TAG = 'MOBILE-USER';

/** Price per kWh for cost display (placeholder until backend provides it). */
export const PRICE_PER_KWH = 12.5;
