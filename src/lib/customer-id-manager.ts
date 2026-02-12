/**
 * Customer ID Manager
 * Manages unique customer identification for product Q&A messaging
 * Supports both session-based (temporary) and persistent (localStorage) IDs
 */

import { v4 as uuidv4 } from 'uuid';

const SESSION_ID_KEY = 'butterfly_customer_session_id';
const CUSTOMER_ID_KEY = 'butterfly_customer_id';

/**
 * Get or create a unique session ID for the current user
 * Session ID persists for the duration of the browser session
 */
export function getCustomerSessionId(): string {
  if (typeof window === 'undefined') {
    // Server-side, return a temporary ID
    return uuidv4();
  }

  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = uuidv4();
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

/**
 * Get or create a persistent customer ID
 * This ID can be stored in localStorage to track customer across sessions
 */
export function getPersistentCustomerId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem(CUSTOMER_ID_KEY);
}

/**
 * Set a persistent customer ID (usually after customer provides email)
 */
export function setPersistentCustomerId(customerId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CUSTOMER_ID_KEY, customerId);
  }
}

/**
 * Get the effective customer ID - preferring persistent ID if available
 */
export function getEffectiveCustomerId(): string {
  if (typeof window === 'undefined') {
    return uuidv4();
  }

  const persistentId = getPersistentCustomerId();
  if (persistentId) {
    return persistentId;
  }

  return getCustomerSessionId();
}

/**
 * Clear session and customer IDs (useful for logout)
 */
export function clearCustomerIds(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(SESSION_ID_KEY);
    localStorage.removeItem(CUSTOMER_ID_KEY);
  }
}

/**
 * Check if customer has a persistent ID
 */
export function hasPersistentCustomerId(): boolean {
  return getPersistentCustomerId() !== null;
}
