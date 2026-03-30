/**
 * Red Top Scoopers — Pricing Logic
 * 
 * Base: $90 + ($10 × each extra dog)
 * Bi-weekly: base × 0.75
 * One-time: base × 0.50
 * Weekly display: monthly ÷ 4, rounded to nearest dollar
 * 
 * Yard add-ons (monthly): Medium +$5, Large +$15, XL +$20
 * Yard add-ons (one-time): Medium +$10, Large +$20, XL +$30
 * 
 * Deodorizing only (no cleanup):
 * One-time: Small $25, Medium $30, Large $40, XL $50
 * Monthly add-on: Small $5, Medium $10, Large $15, XL $20
 */

const YARD_ADDON_MONTHLY = {
  small: 0,
  medium: 5,
  large: 15,
  xl: 20,
};

const YARD_ADDON_ONETIME = {
  small: 0,
  medium: 10,
  large: 20,
  xl: 30,
};

const DEODORIZING_MONTHLY = {
  small: 5,
  medium: 10,
  large: 15,
  xl: 20,
};

const DEODORIZING_ONETIME = {
  small: 25,
  medium: 30,
  large: 40,
  xl: 50,
};

export function calculateQuote({
  dogs = 1,
  yardSize = 'small',
  frequency = 'weekly',
  deodorizing = false,
  lastCleaned = 'within_1_week',
}) {
  const dogCount = Math.min(Math.max(1, dogs), 4);
  const isCustomPricing = dogs >= 5;
  const isDeodorizingOnly = frequency === 'deodorizing_only';
  const isOnetime = frequency === 'onetime';

  // Deodorizing only — no cleanup involved
  if (isDeodorizingOnly) {
    const deodorizingPrice = DEODORIZING_ONETIME[yardSize] || 25;
    return {
      base: 0,
      yardAddon: 0,
      deodorizingAddon: deodorizingPrice,
      monthlyTotal: deodorizingPrice,
      weeklyPrice: 0,
      frequency,
      frequencyLabel: 'Deodorizing Only',
      dogCount,
      yardSize,
      deodorizing: true,
      isHeavyCleanup: false,
      isCustomPricing: false,
      isOnetime: false,
      isDeodorizingOnly: true,
    };
  }

  // Standard cleanup pricing
  let base = 90 + (dogCount - 1) * 10;

  let frequencyLabel = 'Weekly';
  if (frequency === 'biweekly') {
    base = Math.ceil(base * 0.75);
    frequencyLabel = 'Bi-Weekly';
  } else if (isOnetime) {
    base = Math.ceil(base * 0.5);
    frequencyLabel = 'One-Time';
  }

  // Yard add-on — different rates for one-time vs recurring
  let yardAddon;
  if (isOnetime) {
    yardAddon = YARD_ADDON_ONETIME[yardSize] || 0;
  } else {
    yardAddon = YARD_ADDON_MONTHLY[yardSize] || 0;
  }

  // Deodorizing add-on
  let deodorizingAddon = 0;
  if (deodorizing) {
    if (isOnetime) {
      deodorizingAddon = DEODORIZING_ONETIME[yardSize] || 0;
    } else {
      deodorizingAddon = DEODORIZING_MONTHLY[yardSize] || 0;
    }
  }

  const monthlyTotal = base + yardAddon + deodorizingAddon;
  const weeklyPrice = Math.round(monthlyTotal / 4);
  const isHeavyCleanup = lastCleaned === 'over_month' || lastCleaned === 'not_sure';

  return {
    base,
    yardAddon,
    deodorizingAddon,
    monthlyTotal,
    weeklyPrice,
    frequency,
    frequencyLabel,
    dogCount,
    yardSize,
    deodorizing,
    isHeavyCleanup,
    isCustomPricing,
    isOnetime,
    isDeodorizingOnly: false,
  };
}

export function formatYardSize(size) {
  const labels = {
    small: 'Small (Standard)',
    medium: 'Medium',
    large: 'Large',
    xl: 'Extra Large',
  };
  return labels[size] || size;
}

export function formatFrequency(freq) {
  const labels = {
    weekly: 'Weekly',
    biweekly: 'Bi-Weekly',
    onetime: 'One-Time',
    deodorizing_only: 'Deodorizing Only',
  };
  return labels[freq] || freq;
}