/**
 * Format quotes for on-screen, SMS, and email output
 */

export function formatQuoteOnScreen(quote) {
  if (quote.isDeodorizingOnly) {
    return {
      primary: `$${quote.monthlyTotal}`,
      secondary: 'Billed at time of service',
    };
  }
  if (quote.isOnetime) {
    return {
      primary: `$${quote.monthlyTotal}`,
      secondary: 'Billed at time of service',
    };
  }
  if (quote.frequency === 'biweekly') {
    return {
      primary: `$${quote.monthlyTotal}/mo`,
      secondary: 'Bi-weekly service (every other week)',
    };
  }
  return {
    primary: `$${quote.weeklyPrice}/week`,
    secondary: `Billed monthly: $${quote.monthlyTotal}`,
  };
}

export function formatQuoteSMS(quote, customerName = '') {
  const lines = ['Red Top Scoopers Quote:'];

  if (customerName) {
    lines.push(`Hi ${customerName}!`);
  }

  lines.push('');

  if (quote.isDeodorizingOnly) {
    lines.push(
      `Yard deodorizing treatment (${formatYardLabel(quote.yardSize)} yard): $${quote.monthlyTotal}`
    );
  } else if (quote.isOnetime) {
    lines.push(`One-time cleanup: $${quote.base}`);
    if (quote.yardAddon > 0) {
      lines.push(`${formatYardLabel(quote.yardSize)} yard: +$${quote.yardAddon}`);
    }
    if (quote.deodorizingAddon > 0) {
      lines.push(`Deodorizing: $${quote.deodorizingAddon}`);
    }
  } else if (quote.frequency === 'biweekly') {
    lines.push(`Bi-weekly cleanup: $${quote.base}/mo`);
    if (quote.yardAddon > 0) {
      lines.push(`${formatYardLabel(quote.yardSize)} yard: +$${quote.yardAddon}/mo`);
    }
    if (quote.deodorizingAddon > 0) {
      lines.push(`Deodorizing: +$${quote.deodorizingAddon}/mo`);
    }
  } else {
    lines.push(`Weekly cleanup: $${quote.weeklyPrice}/week (billed monthly at $${quote.base})`);
    if (quote.yardAddon > 0) {
      lines.push(`${formatYardLabel(quote.yardSize)} yard: +$${quote.yardAddon}/mo`);
    }
    if (quote.deodorizingAddon > 0) {
      lines.push(`Deodorizing: +$${quote.deodorizingAddon}/mo`);
    }
  }

  lines.push('');

  if (quote.isDeodorizingOnly || quote.isOnetime) {
    lines.push(`Total: $${quote.monthlyTotal}`);
  } else if (quote.frequency === 'biweekly') {
    lines.push(`Total: $${quote.monthlyTotal}/month`);
  } else {
    lines.push(`Total: $${quote.weeklyPrice}/week ($${quote.monthlyTotal}/month)`);
  }

  lines.push('');
  lines.push('Reply YES to get started or call 404-649-4654.');

  return lines.join('\n');
}

export function formatQuoteEmail(quote, customerName = '') {
  const smsContent = formatQuoteSMS(quote, customerName);

  return `
RED TOP SCOOPERS
Pet Waste Removal Service

${smsContent}

---
Red Top Scoopers LLC
404-649-4654
redtopscoopers@gmail.com
RedTopScoopers.com

Sanitized equipment between every visit
Gate secured after every service
Pet-safe deodorizing available

We Handle the Dirty Work
`.trim();
}

function formatYardLabel(size) {
  const labels = { small: 'Small', medium: 'Medium', large: 'Large', xl: 'XL' };
  return labels[size] || size;
}