import { describe, it, expect } from 'vitest';
import app from '../index.js';

describe('Server API Endpoints', () => {
  it('loads app module cleanly', () => {
    expect(app).toBeDefined();
  });
});
