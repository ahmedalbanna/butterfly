'use client';

import { useEffect, useRef, useCallback } from 'react';

interface UseIdleTimeoutOptions {
  /**
   * Timeout duration in milliseconds
   */
  timeout: number;
  
  /**
   * Callback function to execute when idle timeout is reached
   */
  onIdle: () => void;
  
  /**
   * Optional callback to execute before timeout (warning)
   * @param remainingTime - Remaining time in milliseconds
   */
  onWarning?: (remainingTime: number) => void;
  
  /**
   * Warning time before timeout (in milliseconds)
   * Defaults to 2 minutes (120000ms)
   */
  warningTime?: number;
  
  /**
   * Events to track for activity detection
   */
  events?: string[];
  
  /**
   * Whether the idle timeout is enabled
   */
  enabled?: boolean;
}

/**
 * Hook to track user idle time and execute callback when timeout is reached
 * Automatically resets on user activity (mouse, keyboard, touch)
 */
export function useIdleTimeout({
  timeout,
  onIdle,
  onWarning,
  warningTime = 120000, // 2 minutes default warning
  events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'],
  enabled = true,
}: UseIdleTimeoutOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    if (!enabled) return;

    lastActivityRef.current = Date.now();
    clearTimeouts();

    // Set warning timeout if callback provided
    if (onWarning && warningTime < timeout) {
      const warningDelay = timeout - warningTime;
      warningTimeoutRef.current = setTimeout(() => {
        onWarning(warningTime);
      }, warningDelay);
    }

    // Set idle timeout
    timeoutRef.current = setTimeout(() => {
      onIdle();
    }, timeout);
  }, [enabled, timeout, onIdle, onWarning, warningTime, clearTimeouts]);

  useEffect(() => {
    if (!enabled) {
      clearTimeouts();
      return;
    }

    // Initialize timer
    resetTimer();

    // Add event listeners for activity detection
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Cleanup
    return () => {
      clearTimeouts();
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [enabled, events, resetTimer, clearTimeouts]);

  return {
    /**
     * Get time since last activity
     */
    getTimeSinceLastActivity: () => Date.now() - lastActivityRef.current,
    
    /**
     * Manually reset the idle timer
     */
    reset: resetTimer,
    
    /**
     * Clear all timers (useful for cleanup)
     */
    clear: clearTimeouts,
  };
}
