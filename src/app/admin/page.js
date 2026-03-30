'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const DEMO_LEADS = [
  {
    id: 1,
    first_name: 'Demo',
    last_name: 'Customer',
    phone: '(770) 555-0001',
    email: 'demo@test.com',
    address: '123 Main St, Cartersville, GA',
    dogs: 2,
    yard_size: 'large',
    frequency: 'weekly',
    deodorizing: true,
    preferred_day: 'tuesday',
    heard_about: 'facebook',
    last_cleaned: 'over_month',
    notes: 'Gate code: 1234',
    quoted_monthly: 115,
    quoted_weekly: 29,
    is_heavy_cleanup: true,
    status: 'new',
    created_at: new Date().toISOString(),
  },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('leads');
  const [leads, setLeads] = useState(DEMO_LEADS);
  const [customers, setCustomers] = useState([]);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('rts_admin')) {
      router.push('/admin/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('rts_admin');
    router.push('/admin/login');
  };

  const updateLeadStatus = (id, status) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status } : l))
    );

    if (status === 'approved') {
      const lead = leads.find((l) => l.id === id);
      if (lead) {
        setCustomers((prev) => [
          ...prev,
          { ...lead, status: 'active', schedule_day: lead.preferred_day, start_date: new Date().toISOString() },
        ]);
      }
    }
  };

  const tabs = [
    { id: 'leads', label: 'Leads', count: leads.filter((l) => l.status === 'new').length },
    { id: 'customers', label: 'Customers', count: customers.length },
    { id: 'schedule', label: 'Schedule' },
    { id: 'routes', label: 'Routes' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="RTS" width={40} height={40} className="w-10 h-10" />
          <div>
            <h1 className="font-heading text-lg font-bold text-gray-900 leading-none">Red Top Scoopers</h1>
            <p className="text-xs text-gray-400">Admin Dashboard</p>
          </div>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-500 transition-colors">
          Sign Out
        </button>
      </header>

      <div className="bg-white border-b border-gray-200 px-4 overflow-x-auto">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`font-heading text-sm uppercase tracking-wider px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-brand-green text-brand-green font-bold'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1.5 bg-brand-red text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 max-w-6xl mx-auto">
        {activeTab === 'leads' && (
          <LeadsTab leads={leads} onUpdateStatus={updateLeadStatus} />
        )}
        {activeTab === 'customers' && (
          <CustomersTab customers={customers} />
        )}
        {activeTab === 'schedule' && (
          <ScheduleTab customers={customers} />
        )}
        {activeTab === 'routes' && (
          <RoutesTab customers={customers} />
        )}
      </div>
    </div>
  );
}

function LeadsTab({ leads, onUpdateStatus }) {
  const statusColors = {
    new: 'bg-blue-100 text-blue-800',
    contacted: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    declined: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-gray-900">Leads</h2>
        <span className="text-sm text-gray-500">{leads.length} total</span>
      </div>

      {leads.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <p className="text-gray-400">No leads yet. They&apos;ll show up here when customers submit the quote form.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <div key={lead.id} className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900">
                      {lead.first_name} {lead.last_name}
                    </h3>
                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${statusColors[lead.status]}`}>
                      {lead.status}
                    </span>
                    {lead.is_heavy_cleanup && (
                      <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        ⚠ Heavy Cleanup
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{lead.address}</p>
                </div>
                <p className="font-heading text-lg font-bold text-brand-red">
                  ${lead.quoted_weekly}/wk
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-4">
                <Detail label="Phone" value={lead.phone} />
                <Detail label="Email" value={lead.email || '—'} />
                <Detail label="Dogs" value={lead.dogs} />
                <Detail label="Yard" value={lead.yard_size} />
                <Detail label="Frequency" value={lead.frequency} />
                <Detail label="Day" value={lead.preferred_day || 'No pref'} />
                <Detail label="Deodorizing" value={lead.deodorizing ? 'Yes' : 'No'} />
                <Detail label="Source" value={lead.heard_about || '—'} />
              </div>

              {lead.notes && (
                <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-2 mb-3">
                  <span className="font-semibold">Notes:</span> {lead.notes}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <a href={`tel:${lead.phone}`} className="text-xs font-bold uppercase bg-brand-green text-white px-3 py-1.5 rounded-lg hover:bg-brand-green-light transition-colors">
                  Call
                </a>
                <a href={`sms:${lead.phone}`} className="text-xs font-bold uppercase bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-colors">
                  Text
                </a>
                {lead.status !== 'contacted' && (
                  <button onClick={() => onUpdateStatus(lead.id, 'contacted')} className="text-xs font-bold uppercase bg-yellow-500 text-white px-3 py-1.5 rounded-lg hover:bg-yellow-600 transition-colors">
                    Mark Contacted
                  </button>
                )}
                {lead.status !== 'approved' && (
                  <button onClick={() => onUpdateStatus(lead.id, 'approved')} className="text-xs font-bold uppercase bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors">
                    Approve
                  </button>
                )}
                {lead.status !== 'declined' && (
                  <button onClick={() => onUpdateStatus(lead.id, 'declined')} className="text-xs font-bold uppercase bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors">
                    Decline
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CustomersTab({ customers }) {
  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl font-bold text-gray-900">Customers</h2>

      {customers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <p className="text-gray-400">No customers yet. Approve a lead to add them here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {customers.map((c, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">{c.first_name} {c.last_name}</h3>
                  <p className="text-sm text-gray-500">{c.address}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {c.frequency} &bull; {c.dogs} dog{c.dogs > 1 ? 's' : ''} &bull; {c.schedule_day || 'Unscheduled'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-heading font-bold text-brand-red">${c.quoted_weekly}/wk</p>
                  <p className="text-xs text-gray-400">${c.quoted_monthly}/mo</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScheduleTab({ customers }) {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl font-bold text-gray-900">Weekly Schedule</h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {days.map((day) => {
          const dayCustomers = customers.filter((c) => c.schedule_day === day);
          return (
            <div key={day} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-brand-green text-white px-4 py-2">
                <h3 className="font-heading text-sm font-bold uppercase tracking-wider">
                  {day}
                </h3>
              </div>
              <div className="p-3">
                {dayCustomers.length === 0 ? (
                  <p className="text-sm text-gray-400 py-2">No customers scheduled</p>
                ) : (
                  <div className="space-y-2">
                    {dayCustomers.map((c, i) => (
                      <div key={i} className="text-sm border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                        <p className="font-semibold text-gray-900">{c.first_name} {c.last_name}</p>
                        <p className="text-xs text-gray-500">{c.address}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RoutesTab({ customers }) {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl font-bold text-gray-900">Routes</h2>
      <p className="text-sm text-gray-500">Customers grouped by service day for efficient routing.</p>

      {days.map((day) => {
        const dayCustomers = customers.filter((c) => c.schedule_day === day);
        if (dayCustomers.length === 0) return null;

        return (
          <div key={day} className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-heading text-base font-bold text-brand-green uppercase tracking-wider mb-3">
              {day} Route — {dayCustomers.length} stop{dayCustomers.length > 1 ? 's' : ''}
            </h3>
            <div className="space-y-2">
              {dayCustomers.map((c, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="w-6 h-6 rounded-full bg-brand-green text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <div>
                    <span className="font-semibold">{c.first_name} {c.last_name}</span>
                    <span className="text-gray-400 ml-2">{c.address}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {customers.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <p className="text-gray-400">No routes yet. Approve leads and assign days to build routes.</p>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <span className="text-xs text-gray-400 uppercase tracking-wider">{label}</span>
      <p className="font-semibold text-gray-900 capitalize">{value}</p>
    </div>
  );
}