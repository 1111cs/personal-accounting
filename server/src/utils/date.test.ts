import assert from 'node:assert/strict';
import test from 'node:test';
import { getDaysInMonth, getMonthKey, getRemainingDays } from './date';

test('getMonthKey formats a date as YYYY-MM', () => {
  assert.equal(getMonthKey('2026-06-13'), '2026-06');
});

test('getDaysInMonth handles leap years', () => {
  assert.equal(getDaysInMonth('2024-02-01'), 29);
  assert.equal(getDaysInMonth('2025-02-01'), 28);
});

test('getRemainingDays includes the supplied day', () => {
  assert.equal(getRemainingDays('2026-06-30'), 1);
  assert.equal(getRemainingDays('2026-06-01'), 30);
});
