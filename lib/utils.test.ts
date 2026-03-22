import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'flex')).toBe('base flex');
  });

  it('resolves tailwind conflicts (last wins)', () => {
    const result = cn('px-2', 'px-4');
    expect(result).toBe('px-4');
  });

  it('handles empty inputs', () => {
    expect(cn()).toBe('');
    expect(cn('')).toBe('');
  });

  it('handles undefined and null', () => {
    expect(cn('base', undefined, null, 'flex')).toBe('base flex');
  });

  it('merges responsive variants correctly', () => {
    const result = cn('text-sm', 'md:text-lg', 'text-base');
    expect(result).toBe('md:text-lg text-base');
  });
});
