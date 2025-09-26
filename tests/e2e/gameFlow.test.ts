import { expect, test } from '@playwright/test'

test.describe('Deal or No Deal Game Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the demo page
    await page.goto('/demo')
  })

  test('should complete a full game flow', async ({ page }) => {
    // Start the demo
    await page.click('text=Start Demo Game')
    await expect(page.locator('text=Choose Your Case')).toBeVisible()

    // Choose a case (Case 1)
    await page.click('[data-testid="case-0"]')
    await expect(page.locator('text=Case 1 selected')).toBeVisible()

    // Burn a case (Case 2)
    await page.click('[data-testid="case-1"]')
    await expect(page.locator('text=Case 2 burned')).toBeVisible()

    // Wait for banker modal
    await expect(page.locator('text=The Banker\'s Offer')).toBeVisible()

    // Reject the deal
    await page.click('text=No Deal')
    await expect(page.locator('text=Deal Rejected')).toBeVisible()

    // Burn another case (Case 3)
    await page.click('[data-testid="case-2"]')
    await expect(page.locator('text=Case 3 burned')).toBeVisible()

    // Wait for second banker offer
    await expect(page.locator('text=The Banker\'s Offer')).toBeVisible()

    // Accept the deal this time
    await page.click('text=Accept Deal')
    await expect(page.locator('text=Deal Accepted')).toBeVisible()
    await expect(page.locator('text=You won')).toBeVisible()

    // Check that game is finished
    await expect(page.locator('text=Game Complete')).toBeVisible()
    await expect(page.locator('text=Ready to Play for Real?')).toBeVisible()
  })

  test('should allow final reveal when rejecting all deals', async ({ page }) => {
    // Start the demo
    await page.click('text=Start Demo Game')

    // Choose a case
    await page.click('[data-testid="case-0"]')

    // Burn cases and reject all deals
    for (let i = 1; i <= 3; i++) {
      await page.click(`[data-testid="case-${i}"]`)
      await expect(page.locator('text=The Banker\'s Offer')).toBeVisible()
      await page.click('text=No Deal')
    }

    // Should now see final decision
    await expect(page.locator('text=Final Decision')).toBeVisible()
    await expect(page.locator('text=Keep My Case')).toBeVisible()
    await expect(page.locator('text=Swap Cases')).toBeVisible()

    // Choose to keep the case
    await page.click('text=Keep My Case')
    await expect(page.locator('text=Demo Complete')).toBeVisible()
  })

  test('should show correct case states', async ({ page }) => {
    // Start the demo
    await page.click('text=Start Demo Game')

    // Initially all cases should show "Case X"
    for (let i = 0; i < 5; i++) {
      await expect(page.locator(`[data-testid="case-${i}"]`)).toContainText(`Case ${i + 1}`)
    }

    // Choose a case
    await page.click('[data-testid="case-0"]')
    await expect(page.locator('[data-testid="case-0"]')).toContainText('YOUR CASE')

    // Burn a case
    await page.click('[data-testid="case-1"]')
    await expect(page.locator('[data-testid="case-1"]')).toContainText('$')
    await expect(page.locator('[data-testid="case-1"]')).toContainText('BURNED')
  })

  test('should display game statistics correctly', async ({ page }) => {
    // Start the demo
    await page.click('text=Start Demo Game')

    // Check initial stats
    await expect(page.locator('text=Entry Fee')).toBeVisible()
    await expect(page.locator('text=$20.00')).toBeVisible()
    await expect(page.locator('text=Cases Left')).toBeVisible()
    await expect(page.locator('text=5')).toBeVisible()

    // Choose a case
    await page.click('[data-testid="case-0"]')
    await expect(page.locator('text=5')).toBeVisible() // Still 5 cases left

    // Burn a case
    await page.click('[data-testid="case-1"]')
    await expect(page.locator('text=4')).toBeVisible() // Now 4 cases left
  })

  test('should handle reset demo functionality', async ({ page }) => {
    // Start the demo
    await page.click('text=Start Demo Game')
    await expect(page.locator('text=Choose Your Case')).toBeVisible()

    // Reset the demo
    await page.click('text=Reset Demo')
    await expect(page.locator('text=Start Demo Game')).toBeVisible()
    await expect(page.locator('text=Demo Features')).toBeVisible()
  })

  test('should show demo mode indicator', async ({ page }) => {
    // Start the demo
    await page.click('text=Start Demo Game')

    // Check for demo mode indicator
    await expect(page.locator('text=DEMO MODE')).toBeVisible()
  })
})
