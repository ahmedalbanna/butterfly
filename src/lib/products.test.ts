import { describe, it, expect } from 'vitest';
import { PRODUCTS, CATEGORIES, MAX_PRODUCT_PRICE, MIN_PRODUCT_PRICE, getProductById } from './products';

describe('products', () => {
  it('has 8 products with required fields', () => {
    expect(PRODUCTS).toHaveLength(8);
    for (const p of PRODUCTS) {
      expect(p.id).toBeTruthy();
      expect(p.sku).toMatch(/^LX-/);
      expect(p.name).toBeTruthy();
      expect(p.price).toBeGreaterThan(0);
      expect(typeof p.stock).toBe('number');
      expect(p.image).toContain('http');
      expect(p.images.length).toBeGreaterThan(0);
    }
  });

  it('categories include All', () => {
    expect(CATEGORIES).toContain('All');
  });

  it('price bounds correct', () => {
    expect(MIN_PRODUCT_PRICE).toBeLessThan(MAX_PRODUCT_PRICE);
    expect(MAX_PRODUCT_PRICE).toBe(2100);
  });

  it('getProductById works', () => {
    expect(getProductById('p1')?.name).toBe('Rose Gold Diamond Necklace');
    expect(getProductById('not-exist')).toBeUndefined();
  });

  it('no duplicate ids or skus', () => {
    const ids = PRODUCTS.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    const skus = PRODUCTS.map(p => p.sku);
    expect(new Set(skus).size).toBe(skus.length);
  });
});
