/**
 * Red Top Scoopers — Simplified Pricing Logic
 * 
 * Base: $95/month flat (weekly service)
 * Bi-weekly: $95 × 0.75 = $71/month
 * One-time: $95 × 0.55 = $52
 * 
 * Yard add-ons: Small included, Medium +$5, Large +$10, XL +$15
 * 
 * Deodorizing monthly: Small +$5, Medium +$10, Large +$15, XL +$20
 * Deodorizing one-time: Small $25, Medium $30, Large $40, XL $50
 */

const BASE_MONTHLY = 95;

const YARD_ADDON = {
  small: 0,
  medium: 5,
  large: 10,
  xl: 15,
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
  yardSize = 'small',
  frequency = 'weekly',
  deodorizing = false,
}) {
  const isDeodorizingOnly = frequency === 'deodorizing_only';
  const isOnetime = frequency === 'onetime';

  // Deodorizing only — no cleanup
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
      yardSize,
      deodorizing: true,
      isHeavyCleanup: false,
      isOnetime: false,
      isDeodorizingOnly: true,
    };
  }

  // Calculate base price by frequency
  let base;
  let frequencyLabel = 'Weekly';

  if (frequency === 'biweekly') {
    base = Math.round(BASE_MONTHLY * 0.75);
    frequencyLabel = 'Bi-Weekly';
  } else if (isOnetime) {
    base = Math.round(BASE_MONTHLY * 0.55);
    frequencyLabel = 'One-Time';
  } else {
    base = BASE_MONTHLY;
  }

  // Yard add-on (same for all frequencies)
  const yardAddon = YARD_ADDON[yardSize] || 0;

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

  return {
    base,
    yardAddon,
    deodorizingAddon,
    monthlyTotal,
    weeklyPrice,
    frequency,
    frequencyLabel,
    yardSize,
    deodorizing,
    isHeavyCleanup: false,
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