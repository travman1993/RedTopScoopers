'use client';

import { useState } from 'react';
import { calculateQuote } from '@/lib/pricing';
import QuoteResult from './QuoteResult';

const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  address: '',
  yardSize: 'small',
  frequency: 'weekly',
  deodorizing: false,
  preferredDay: '',
  heardAbout: '',
  lastCleaned: 'within_1_week',
  notes: '',
};

export default function QuoteForm() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [quote, setQuote] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const result = calculateQuote({
      yardSize: form.yardSize,
      frequency: form.frequency,
      deodorizing: form.deodorizing,
    });

    setQuote(result);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          dogs: 0,
          quotedMonthly: result.monthlyTotal,
          quotedWeekly: result.weeklyPrice,
          isHeavyCleanup: result.isHeavyCleanup,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
      }
    } catch (err) {
      console.log('Lead submission pending — Supabase not configured yet');
      setSubmitted(true);
    }

    setSubmitting(false);
  };

  if (submitted && quote) {
    return (
      <QuoteResult
        quote={quote}
        customerName={form.firstName}
        onReset={() => {
          setForm(INITIAL_FORM);
          setQuote(null);
          setSubmitted(false);
        }}
      />
    );
  }

  const isOnetime = form.frequency === 'onetime';
  const isDeodorizingOnly = form.frequency === 'deodorizing_only';
  const isRecurring = form.frequency === 'weekly' || form.frequency === 'biweekly';

  return (
    <section id="quote" className="relative section-padding overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1558904541-efa843a96f01?w=1920&q=80')`,
        }}
      />
      <div className="absolute inset-0 bg-white/90" />

      <div className="relative container-narrow max-w-2xl">
        <div className="text-center mb-10">
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-gray-900 mb-3">
            Get Your Instant Quote
          </h2>
          <p className="text-lg text-gray-600">
            Get your exact price in seconds.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="First Name" name="firstName" value={form.firstName} onChange={handleChange} required />
            <FormField label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Phone" name="phone" type="tel" value={form.phone} onChange={handleChange} required placeholder="(770) 555-1234" />
            <FormField label="Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@email.com" />
          </div>

          <FormField label="Address" name="address" value={form.address} onChange={handleChange} required placeholder="123 Main St, Cartersville, GA" />

          <div className="grid grid-cols-2 gap-4">
            <SelectField label="Yard Size" name="yardSize" value={form.yardSize} onChange={handleChange} options={[
              { value: 'small', label: 'Small' },
              { value: 'medium', label: 'Medium' },
              { value: 'large', label: 'Large' },
              { value: 'xl', label: 'Extra Large' },
            ]} />
            <SelectField label="Service Type" name="frequency" value={form.frequency} onChange={handleChange} options={[
              { value: 'weekly', label: 'Weekly Cleanup' },
              { value: 'biweekly', label: 'Bi-Weekly Cleanup' },
              { value: 'onetime', label: 'One-Time Cleanup' },
              { value: 'deodorizing_only', label: 'Deodorizing Only' },
            ]} />
          </div>

          {!isDeodorizingOnly && (
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" name="deodorizing" checked={form.deodorizing} onChange={handleChange} className="w-5 h-5 rounded border-gray-300 text-brand-green focus:ring-brand-green cursor-pointer" />
              <div>
                <span className="font-semibold text-gray-900 group-hover:text-brand-green transition-colors">
                  Add Deodorizing Treatment
                </span>
                <span className="block text-xs text-gray-500">
                  {isOnetime
                    ? 'One-time enzyme treatment — $25–$50 based on yard size'
                    : 'Monthly enzyme treatment — +$5–$20/mo based on yard size'}
                </span>
              </div>
            </label>
          )}

          {isDeodorizingOnly && (
            <div className="bg-brand-green-pale border border-brand-green/20 rounded-lg p-4">
              <p className="text-sm text-brand-green font-semibold">Deodorizing Only Service</p>
              <p className="text-xs text-gray-600 mt-1">
                Pet-safe enzyme treatment to eliminate yard odor. No waste cleanup included.
                Price based on yard size: Small $25 · Medium $30 · Large $40 · XL $50
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isRecurring && (
              <SelectField label="Preferred Service Day" name="preferredDay" value={form.preferredDay} onChange={handleChange} options={[
                { value: '', label: 'No preference' },
                { value: 'monday', label: 'Monday' },
                { value: 'tuesday', label: 'Tuesday' },
                { value: 'wednesday', label: 'Wednesday' },
                { value: 'thursday', label: 'Thursday' },
                { value: 'friday', label: 'Friday' },
                { value: 'saturday', label: 'Saturday' },
              ]} />
            )}
            {!isDeodorizingOnly && (
              <SelectField label="Last Time Yard Was Cleaned" name="lastCleaned" value={form.lastCleaned} onChange={handleChange} options={[
                { value: 'within_1_week', label: 'Within 1 week' },
                { value: '1_2_weeks', label: '1–2 weeks' },
                { value: '2_4_weeks', label: '2–4 weeks' },
                { value: 'over_month', label: 'Over a month' },
                { value: 'not_sure', label: 'Not sure' },
              ]} />
            )}
          </div>

          <SelectField label="Where Did You Hear About Us?" name="heardAbout" value={form.heardAbout} onChange={handleChange} options={[
            { value: '', label: 'Select one...' },
            { value: 'facebook', label: 'Facebook' },
            { value: 'nextdoor', label: 'Nextdoor' },
            { value: 'google', label: 'Google' },
            { value: 'referral', label: 'Referral' },
            { value: 'yard_sign', label: 'Yard Sign' },
            { value: 'other', label: 'Other' },
          ]} />

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Notes <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition-colors resize-none"
              placeholder="Gate code, special instructions, questions..."
            />
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full text-center disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? 'Calculating...' : 'Get Instant Quote'}
          </button>

          <p className="text-xs text-center text-gray-400">
            Your info is only used to provide your quote and schedule service. We never share your information.
          </p>
        </form>
      </div>
    </section>
  );
}

function FormField({ label, name, type = 'text', value, onChange, required, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label} {required && <span className="text-brand-red">*</span>}
      </label>
      <input type={type} name={name} value={value} onChange={onChange} required={required} placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition-colors"
      />
    </div>
  );
}

function SelectField({ label, name, value, onChange, options }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <select name={name} value={value} onChange={onChange}
        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition-colors appearance-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
          backgroundPosition: 'right 0.75rem center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '1.25rem',
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}