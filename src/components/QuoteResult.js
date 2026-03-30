'use client';

import { useState } from 'react';
import { formatQuoteOnScreen, formatQuoteSMS, formatQuoteEmail } from '@/utils/formatQuote';
import { formatYardSize } from '@/lib/pricing';

export default function QuoteResult({ quote, customerName, onReset }) {
  const [copied, setCopied] = useState(null);
  const display = formatQuoteOnScreen(quote);
  const smsText = formatQuoteSMS(quote, customerName);
  const emailText = formatQuoteEmail(quote, customerName);

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  return (
    <section id="quote" className="section-padding bg-gray-50">
      <div className="container-narrow max-w-lg">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-brand-green text-white text-center py-6 px-6">
            <p className="font-heading text-sm uppercase tracking-widest mb-2 opacity-80">Your Quote</p>
            <p className="font-heading text-5xl font-bold mb-1">{display.primary}</p>
            <p className="text-green-100 text-lg">{display.secondary}</p>
          </div>

          <div className="p-6 space-y-3">
            <h3 className="font-heading text-sm uppercase tracking-widest text-gray-400 mb-3">Breakdown</h3>

            <BreakdownRow
              label={`${quote.frequencyLabel} service — ${quote.dogCount} dog${quote.dogCount > 1 ? 's' : ''}`}
              value={`$${quote.base}${quote.isOnetime ? '' : '/mo'}`}
            />

            {quote.yardAddon > 0 && (
              <BreakdownRow label={`${formatYardSize(quote.yardSize)} yard`} value={`+$${quote.yardAddon}/mo`} />
            )}

            {quote.deodorizingAddon > 0 && (
              <BreakdownRow
                label="Deodorizing treatment"
                value={`${quote.isOnetime ? '' : '+'}$${quote.deodorizingAddon}${quote.isOnetime ? '' : '/mo'}`}
              />
            )}

            <div className="border-t border-gray-200 pt-3 mt-3">
              <BreakdownRow
                label="Total"
                value={quote.isOnetime ? `$${quote.monthlyTotal}` : `$${quote.weeklyPrice}/wk ($${quote.monthlyTotal}/mo)`}
                bold
              />
            </div>

            {quote.isHeavyCleanup && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                <div className="flex items-start gap-2">
                  <span className="text-amber-500 text-lg">⚠️</span>
                  <div>
                    <p className="font-semibold text-amber-800 text-sm">Initial Cleanup May Be Required</p>
                    <p className="text-amber-700 text-xs mt-1">
                      Based on the time since your last cleanup, an initial heavy cleanup fee may apply. 
                      We&apos;ll confirm after reviewing your yard.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {quote.isCustomPricing && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="font-semibold text-blue-800 text-sm">Custom Pricing</p>
                <p className="text-blue-700 text-xs mt-1">
                  For 5+ dogs, we&apos;ll provide a custom quote. We&apos;ll reach out shortly!
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 p-6 space-y-3">
            <a href="tel:4046494654" className="btn-primary w-full text-center block">
              Call to Get Started — 404-649-4654
            </a>

            
              <a href={`sms:4046494654?body=${encodeURIComponent('Hi! I got a quote from your website for $' + quote.monthlyTotal + '/month. I\'d like to get started.')}`}
              className="btn-secondary w-full text-center block"
            >
              Text Us to Sign Up
            </a>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button onClick={() => copyToClipboard(smsText, 'sms')}
                className="text-sm text-gray-500 hover:text-brand-green border border-gray-200 rounded-lg py-2 px-3 transition-colors">
                {copied === 'sms' ? '✓ Copied!' : 'Copy SMS Quote'}
              </button>
              <button onClick={() => copyToClipboard(emailText, 'email')}
                className="text-sm text-gray-500 hover:text-brand-green border border-gray-200 rounded-lg py-2 px-3 transition-colors">
                {copied === 'email' ? '✓ Copied!' : 'Copy Email Quote'}
              </button>
            </div>

            <button onClick={onReset} className="w-full text-center text-sm text-gray-400 hover:text-gray-600 py-2 transition-colors">
              ← Get another quote
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function BreakdownRow({ label, value, bold }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${bold ? 'font-bold text-gray-900' : 'text-gray-600'}`}>{label}</span>
      <span className={`font-heading ${bold ? 'text-lg font-bold text-brand-red' : 'text-base font-semibold text-gray-900'}`}>{value}</span>
    </div>
  );
}