/**
 * Red Top Scoopers — Pricing Logic
 * 
 * Base: $90 + ($10 × each extra dog)
 * Bi-weekly: base × 0.75
 * One-time: base × 0.50
 * Weekly display: monthly ÷ 4, rounded to nearest dollar
 */

const YARD_ADDON_MONTHLY = {
  small: 0,
  medium: 5,
  large: 15,
  xl: 20,
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

  let base = 90 + (dogCount - 1) * 10;

  let frequencyLabel = 'Weekly';
  if (frequency === 'biweekly') {
    base = Math.ceil(base * 0.75);
    frequencyLabel = 'Bi-Weekly';
  } else if (frequency === 'onetime') {
    base = Math.ceil(base * 0.5);
    frequencyLabel = 'One-Time';
  }

  const yardAddon = frequency === 'onetime' ? 0 : (YARD_ADDON_MONTHLY[yardSize] || 0);

  let deodorizingAddon = 0;
  if (deodorizing) {
    if (frequency === 'onetime') {
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
    isOnetime: frequency === 'onetime',
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
  };
  return labels[freq] || freq;
}