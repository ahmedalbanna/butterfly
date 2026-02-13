/**
 * Offline-First API Wrapper
 * Wraps fetch calls to queue requests when offline
 */

import { isOnline } from './connectivity';
import { queueRequest } from './offline-queue';

export interface OfflineAPIOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  offline?: boolean; // Allow offline, defaults to true for POST/PUT/PATCH
  cache?: boolean; // Cache successful responses
  cacheTTLMinutes?: number;
  headers?: Record<string, string>;
}

/**
 * Make an API request with offline support
 */
export async function offlineAPI(
  url: string,
  options: OfflineAPIOptions = {}
): Promise<Response> {
  const {
    method = 'GET',
    body,
    offline = ['POST', 'PUT', 'PATCH'].includes(method),
    headers = {},
  } = options;

  // GET requests are read-only and always go through normal fetch
  if (method === 'GET') {
    return fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });
  }

  // Check if online
  if (isOnline()) {
    // Online - make normal request
    return fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // Offline
  if (!offline) {
    throw new Error(`Cannot make ${method} request while offline`);
  }

  // Queue the request for later sync
  await queueRequest({
    method: method as 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    url,
    payload: body,
    priority: 'normal',
  });

  // Return a mock response indicating request is queued
  return new Response(
    JSON.stringify({
      success: true,
      queued: true,
      message: 'Request queued for sync when online',
    }),
    {
      status: 202,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * POST request with offline support
 */
export async function offlinePOST(
  url: string,
  body: any,
  options: Omit<OfflineAPIOptions, 'method' | 'body'> = {}
): Promise<Response> {
  return offlineAPI(url, {
    ...options,
    method: 'POST',
    body,
  });
}

/**
 * PUT request with offline support
 */
export async function offlinePUT(
  url: string,
  body: any,
  options: Omit<OfflineAPIOptions, 'method' | 'body'> = {}
): Promise<Response> {
  return offlineAPI(url, {
    ...options,
    method: 'PUT',
    body,
  });
}

/**
 * PATCH request with offline support
 */
export async function offlinePATCH(
  url: string,
  body: any,
  options: Omit<OfflineAPIOptions, 'method' | 'body'> = {}
): Promise<Response> {
  return offlineAPI(url, {
    ...options,
    method: 'PATCH',
    body,
  });
}

/**
 * DELETE request with offline support
 */
export async function offlineDELETE(
  url: string,
  options: Omit<OfflineAPIOptions, 'method'> = {}
): Promise<Response> {
  return offlineAPI(url, {
    ...options,
    method: 'DELETE',
  });
}
