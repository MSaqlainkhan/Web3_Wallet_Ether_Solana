import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { webcrypto } from 'node:crypto';

Object.defineProperty(window, 'crypto', {
  value: webcrypto,
  writable: true,
});

HTMLTextAreaElement.prototype.select = vi.fn();
HTMLInputElement.prototype.select = vi.fn();

Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
  writable: true,
});