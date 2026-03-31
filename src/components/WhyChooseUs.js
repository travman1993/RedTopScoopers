'use client';

const STATS = [
  { number: '100+', label: 'Piles per dog\nper month', sub: 'More than you think' },
  { number: '4 yrs', label: 'E. coli survives\nin soil', sub: 'Long after you smell it' },
  { number: '5 hours', label: 'Saved every\nsingle week', sub: 'Back in your pocket' },
  { number: '$0', label: 'Contracts —\ncancel anytime', sub: 'Zero risk to try us' },
];

const WEEKS = [
  { week: 'Week 1', label: 'Light accumulation', note: 'Manageable, but building fast', pct: 20, bar: 'bg-yellow-400' },
  { week: 'Week 2', label: 'Noticeable odor', note: 'Guests start to notice', pct: 48, bar: 'bg-orange-400' },
  { week: 'Week 3', label: 'Lawn damage begins', note: 'Dead patches forming', pct: 74, bar: 'bg-red-500' },
  { week: 'Week 4+', label: 'Health risk zone', note: 'Bacteria & parasites present', pct: 100, bar: 'bg-red-700' },
];

const FEATURES = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Sanitized Equipment',
    desc: 'Tools and shoes disinfected between every single visit — no cross-contamination between yards.',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: 'Gate Always Secured',
    desc: 'We close and lock your gate after every service. Your pets stay safely inside, every single time.',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    title: 'Pet-Safe Deodorizing',
    desc: 'Optional enzyme treatment eliminates odor at the source — completely safe for pets, kids, and your lawn.',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Reliable & Recurring',
    desc: 'Same day, same time, every week. Set it and forget it — we show up so you never have to think about it.',
  },
];

export default function WhyChooseUs() {
  return (
    <section className="bg-gray-950">
      {/* Header */}
      <div className="section-padding container-narrow text-center pb-0 md:pb-0">
        <p className="font-heading text-sm uppercase tracking-widest text-brand-green mb-3">
          Why Choose Red Top Scoopers?
        </p>
        <h2 className="font-heading text-3xl md:text-5xl font-bold text-white mb-4">
          Your Yard Deserves Better
        </h2>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Dog waste isn&apos;t just gross — it&apos;s a health hazard. Left unmanaged, it damages your lawn,
          attracts pests, and creates bacteria that linger for years.
        </p>
      </div>

      {/* Stats bar */}
      <div className="mt-14 border-y border-white/10 bg-white/5">
        <div className="container-narrow px-5 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
            {STATS.map((s, i) => (
              <div key={i} className="py-8 px-4 md:px-6 text-center">
                <p className="font-heading text-3xl md:text-4xl font-bold text-brand-red mb-1">{s.number}</p>
                <p className="text-sm text-gray-300 leading-snug whitespace-pre-line">{s.label}</p>
                <p className="text-xs text-gray-500 mt-1 hidden md:block">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Waste buildup chart */}
      <div className="section-padding">
        <div className="container-narrow">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h3 className="font-heading text-2xl md:text-3xl font-bold text-white mb-2">
                Waste Builds Up Faster Than You Think
              </h3>
              <p className="text-gray-400">One dog. One yard. Four weeks without service.</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
              {WEEKS.map((w, i) => (
                <div key={i}>
                  <div className="flex items-baseline justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-heading font-bold text-white text-sm w-16 flex-shrink-0">{w.week}</span>
                      <span className="text-gray-300 text-sm font-semibold">{w.label}</span>
                    </div>
                    <span className="text-xs text-gray-500 hidden sm:block ml-4">{w.note}</span>
                  </div>
                  <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full ${w.bar} rounded-full`} style={{ width: `${w.pct}%` }} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 sm:hidden">{w.note}</p>
                </div>
              ))}

              <p className="text-center text-sm text-gray-500 italic pt-2 border-t border-white/10">
                &ldquo;What starts as &lsquo;just a little&rsquo; quickly becomes a yard you avoid.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature cards */}
      <div className="pb-16 md:pb-20 px-5 md:px-8">
        <div className="container-narrow grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-brand-green/40 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-green/20 flex items-center justify-center text-brand-green mb-4">
                {f.icon}
              </div>
              <h3 className="font-heading text-lg font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA strip */}
      <div className="border-t border-white/10 bg-brand-green/15 px-5 py-8 md:px-8">
        <div className="container-narrow flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div>
            <p className="font-heading text-xl font-bold text-white">Ready for a cleaner yard?</p>
            <p className="text-sm text-gray-400 mt-1">No contracts. Cancel anytime. First visit makes an instant difference.</p>
          </div>
          <a href="#quote" className="btn-primary whitespace-nowrap flex-shrink-0">
            Get Your Free Quote
          </a>
        </div>
      </div>
    </section>
  );
}
