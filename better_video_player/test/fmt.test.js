import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fmtTime, fmtPercent } from '../ui/src/utils/fmt.js'

test('fmtTime', () => {
  assert.equal(fmtTime(0), '00:00')
  assert.equal(fmtTime(59_999), '01:00')
  assert.equal(fmtTime(3661_000), '1:01:01')
  assert.equal(fmtTime(-5), '00:00')
  assert.equal(fmtTime(undefined), '00:00')
})

test('fmtPercent', () => {
  assert.equal(fmtPercent(50, 100), 50)
  assert.equal(fmtPercent(0, 0), 0)
  assert.equal(fmtPercent(200, 100), 100)
  assert.equal(fmtPercent(-5, 100), 0)
})
