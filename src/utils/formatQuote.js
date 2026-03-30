/**
 * Format quotes for on-screen, SMS, and email output
 */

export function formatQuoteOnScreen(quote) {
  if (quote.isOnetime) {
    return {
      primary: `$${quote.monthlyTotal}`,
      secondary: 'One-time cleanup',
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

  if (quote.isOnetime) {
    lines.push(
      `One-time cleanup for ${quote.dogCount} dog${quote.dogCount > 1 ? 's' : ''}: $${quote.base}`
    );
  } else {
    lines.push(
      `${quote.frequencyLabel} service for ${quote.dogCount} dog${quote.dogCount > 1 ? 's' : ''}: $${quote.weeklyPrice}/week (billed monthly at $${quote.base})`
    );
  }

  if (quote.yardAddon > 0) {
    lines.push(`${formatYardLabel(quote.yardSize)} yard: +$${quote.yardAddon}/mo`);
  }

  if (quote.deodorizingAddon > 0) {
    lines.push(
      `Deodorizing: ${quote.isOnetime ? '' : '+'}$${quote.deodorizingAddon}${quote.isOnetime ? '' : '/mo'}`
    );
  }

  lines.push('');

  if (quote.isOnetime) {
    lines.push(`Total: $${quote.monthlyTotal}`);
  } else {
    lines.push(`Total: $${quote.weeklyPrice}/week ($${quote.monthlyTotal}/month)`);
  }

  if (quote.isHeavyCleanup) {
    lines.push('');
    lines.push('Note: An initial heavy cleanup fee may apply based on yard condition.');
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