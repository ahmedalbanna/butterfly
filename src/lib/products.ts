/**
 * Product and Category Constants
 * Used for compatibility with existing code
 */

export const CATEGORIES = [
  'Jewelry',
  'Watches', 
  'Bags',
  'Accessories'
] as const;

export type CategoryName = typeof CATEGORIES[number];
