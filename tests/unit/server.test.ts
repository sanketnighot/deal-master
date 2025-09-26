import {
    calculateBankerOffer,
    formatCurrency,
    getGameStatusText,
    getRemainingValues,
    isGameFinished,
    shouldBankerOffer,
    validateGameState
} from '@/lib/server'

describe('Server Utilities', () => {
  describe('calculateBankerOffer', () => {
    it('should return 0 for empty array', () => {
      const offer = calculateBankerOffer([])
      expect(offer).toBe(0)
    })

    it('should calculate offer based on average with random factor', () => {
      const remainingValues = [1000, 2000, 3000, 4000, 5000]
      const offer = calculateBankerOffer(remainingValues)
      const average = remainingValues.reduce((sum, val) => sum + val, 0) / remainingValues.length

      // Offer should be between 60% and 80% of average
      expect(offer).toBeGreaterThanOrEqual(average * 0.6)
      expect(offer).toBeLessThanOrEqual(average * 0.8)
    })

    it('should return rounded integer', () => {
      const remainingValues = [1000, 2000, 3000]
      const offer = calculateBankerOffer(remainingValues)
      expect(Number.isInteger(offer)).toBe(true)
    })
  })

  describe('shouldBankerOffer', () => {
    it('should return true for 1, 2, and 3 burned cards', () => {
      expect(shouldBankerOffer(1)).toBe(true)
      expect(shouldBankerOffer(2)).toBe(true)
      expect(shouldBankerOffer(3)).toBe(true)
    })

    it('should return false for other counts', () => {
      expect(shouldBankerOffer(0)).toBe(false)
      expect(shouldBankerOffer(4)).toBe(false)
      expect(shouldBankerOffer(5)).toBe(false)
    })
  })

  describe('getRemainingValues', () => {
    const mockCards = [
      { idx: 0, value_cents: 1000, revealed: false, burned: false },
      { idx: 1, value_cents: 2000, revealed: true, burned: true },
      { idx: 2, value_cents: 3000, revealed: false, burned: false },
      { idx: 3, value_cents: 4000, revealed: true, burned: false },
      { idx: 4, value_cents: 5000, revealed: false, burned: false },
    ]

    it('should return values of unrevealed cards excluding player case', () => {
      const playerCase = 2
      const remaining = getRemainingValues(mockCards, playerCase)

      expect(remaining).toEqual([1000, 5000]) // idx 0 and 4, excluding idx 2 (player case)
    })

    it('should return all unrevealed values when no player case', () => {
      const remaining = getRemainingValues(mockCards, null)

      expect(remaining).toEqual([1000, 3000, 5000]) // idx 0, 2, 4
    })

    it('should return empty array when all cards are revealed', () => {
      const allRevealedCards = mockCards.map(card => ({ ...card, revealed: true }))
      const remaining = getRemainingValues(allRevealedCards, 2)

      expect(remaining).toEqual([])
    })
  })

  describe('validateGameState', () => {
    const mockGame = {
      status: 'PLAYING',
      player_case: null,
      banker_offer_cents: null,
      accepted_deal: false
    }

    it('should validate pick operation correctly', () => {
      const result = validateGameState(mockGame, 'pick')
      expect(result.valid).toBe(true)
    })

    it('should reject pick when game is not playing', () => {
      const game = { ...mockGame, status: 'FINISHED' }
      const result = validateGameState(game, 'pick')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('not in playing state')
    })

    it('should reject pick when player already picked', () => {
      const game = { ...mockGame, player_case: 2 }
      const result = validateGameState(game, 'pick')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('already picked')
    })

    it('should validate burn operation correctly', () => {
      const game = { ...mockGame, player_case: 2 }
      const result = validateGameState(game, 'burn')
      expect(result.valid).toBe(true)
    })

    it('should reject burn when no player case', () => {
      const result = validateGameState(mockGame, 'burn')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('must pick a case first')
    })

    it('should validate acceptDeal operation correctly', () => {
      const game = { ...mockGame, banker_offer_cents: 1500 }
      const result = validateGameState(game, 'acceptDeal')
      expect(result.valid).toBe(true)
    })

    it('should reject acceptDeal when no offer', () => {
      const result = validateGameState(mockGame, 'acceptDeal')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('No banker offer available')
    })

    it('should reject acceptDeal when already accepted', () => {
      const game = { ...mockGame, banker_offer_cents: 1500, accepted_deal: true }
      const result = validateGameState(game, 'acceptDeal')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('already accepted')
    })
  })

  describe('formatCurrency', () => {
    it('should format cents to currency string', () => {
      expect(formatCurrency(2000)).toBe('$20.00')
      expect(formatCurrency(1500)).toBe('$15.00')
      expect(formatCurrency(100)).toBe('$1.00')
      expect(formatCurrency(50)).toBe('$0.50')
    })

    it('should handle different currencies', () => {
      expect(formatCurrency(2000, 'EUR')).toBe('€20.00')
      expect(formatCurrency(2000, 'GBP')).toBe('£20.00')
    })
  })

  describe('getGameStatusText', () => {
    it('should return correct status text', () => {
      expect(getGameStatusText('CREATED')).toBe('Ready to Start')
      expect(getGameStatusText('PLAYING')).toBe('In Progress')
      expect(getGameStatusText('FINISHED')).toBe('Completed')
      expect(getGameStatusText('CANCELLED')).toBe('Cancelled')
      expect(getGameStatusText('UNKNOWN')).toBe('UNKNOWN')
    })
  })

  describe('isGameFinished', () => {
    it('should return true for finished states', () => {
      expect(isGameFinished('FINISHED')).toBe(true)
      expect(isGameFinished('CANCELLED')).toBe(true)
    })

    it('should return false for active states', () => {
      expect(isGameFinished('CREATED')).toBe(false)
      expect(isGameFinished('PLAYING')).toBe(false)
    })
  })
})
