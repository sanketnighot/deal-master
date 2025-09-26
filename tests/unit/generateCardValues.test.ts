import { generateCardValues } from '@/lib/server'

describe('generateCardValues', () => {
  it('should generate exactly 5 card values', () => {
    const values = generateCardValues(2000)
    expect(values).toHaveLength(5)
  })

  it('should include one maximum value up to 10x entry fee', () => {
    const entryFee = 2000
    const values = generateCardValues(entryFee)
    const maxValue = Math.max(...values)
    const expectedMax = Math.min(entryFee * 10, 100000)

    expect(maxValue).toBeLessThanOrEqual(expectedMax)
    expect(values).toContain(maxValue)
  })

  it('should generate values greater than minimum threshold', () => {
    const entryFee = 2000
    const values = generateCardValues(entryFee)
    const minValue = Math.max(entryFee * 0.1, 100)

    values.forEach(value => {
      expect(value).toBeGreaterThanOrEqual(minValue)
    })
  })

  it('should generate different values on multiple calls', () => {
    const entryFee = 2000
    const values1 = generateCardValues(entryFee)
    const values2 = generateCardValues(entryFee)

    // While it's possible they could be the same, it's very unlikely
    // We'll check that at least the order is different or values are different
    const isDifferent = JSON.stringify(values1.sort()) !== JSON.stringify(values2.sort())
    expect(isDifferent).toBe(true)
  })

  it('should handle different entry fees correctly', () => {
    const testCases = [500, 1000, 2000, 5000, 10000]

    testCases.forEach(entryFee => {
      const values = generateCardValues(entryFee)
      expect(values).toHaveLength(5)

      const maxValue = Math.max(...values)
      const expectedMax = Math.min(entryFee * 10, 100000)
      expect(maxValue).toBeLessThanOrEqual(expectedMax)

      const minValue = Math.max(entryFee * 0.1, 100)
      values.forEach(value => {
        expect(value).toBeGreaterThanOrEqual(minValue)
      })
    })
  })

  it('should cap maximum value at $1000 (100000 cents)', () => {
    const entryFee = 20000 // $200 entry fee
    const values = generateCardValues(entryFee)
    const maxValue = Math.max(...values)

    expect(maxValue).toBeLessThanOrEqual(100000)
  })

  it('should ensure minimum value is at least $1 (100 cents)', () => {
    const entryFee = 500 // $5 entry fee
    const values = generateCardValues(entryFee)

    values.forEach(value => {
      expect(value).toBeGreaterThanOrEqual(100)
    })
  })
})
