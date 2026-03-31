'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

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
    notes: 'Gate code: 1234. One dog is protective of the yard.',
    quoted_monthly: 115,
    quoted_weekly: 29,
    is_heavy_cleanup: true,
    status: 'new',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    first_name: 'Demo',
    last_name: 'One-Time',
    phone: '(770) 555-0002',
    email: '',
    address: '456 Oak Dr, Emerson, GA',
    dogs: 1,
    yard_size: 'small',
    frequency: 'onetime',
    deodorizing: false,
    preferred_day: '',
    heard_about: 'google',
    last_cleaned: '2_4_weeks',
    notes: '',
    quoted_monthly: 52,
    quoted_weekly: 13,
    is_heavy_cleanup: false,
    status: 'new',
    created_at: new Date().toISOString(),
  },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('today');
  const [leads, setLeads] = useState(DEMO_LEADS);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingLead, setEditingLead] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [pendingApproval, setPendingApproval] = useState(null);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    setLoading(true);
    const [leadsRes, customersRes] = await Promise.all([
      supabase.from('leads').select('*').order('created_at', { ascending: false }),
      supabase.from('customers').select('*').eq('is_active', true).order('created_at', { ascending: false }),
    ]);
    if (leadsRes.data) setLeads(leadsRes.data);
    if (customersRes.data) setCustomers(customersRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!localStorage.getItem('rts_admin')) {
        router.push('/admin/login');
        return;
      }
      fetchData();
    }
  }, [router, fetchData]);

  const handleLogout = () => {
    localStorage.removeItem('rts_admin');
    router.push('/admin/login');
  };

  const updateLeadStatus = async (id, status, appointmentDate = null) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));

    if (isSupabaseConfigured()) {
      await supabase
        .from('leads')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (status === 'approved') {
        const lead = leads.find((l) => l.id === id);
        if (lead) {
          const isOnetime = lead.frequency === 'onetime' || lead.frequency === 'deodorizing_only';
          await supabase.from('customers').insert([{
            lead_id: lead.id,
            first_name: lead.first_name,
            last_name: lead.last_name,
            phone: lead.phone,
            email: lead.email || null,
            address: lead.address,
            dogs: lead.dogs,
            yard_size: lead.yard_size,
            frequency: lead.frequency,
            deodorizing: lead.deodorizing,
            schedule_day: isOnetime ? null : (lead.preferred_day || null),
            monthly_rate: lead.quoted_monthly,
            weekly_rate: lead.quoted_weekly,
            notes: lead.notes || null,
            start_date: appointmentDate || new Date().toISOString().split('T')[0],
            is_active: true,
          }]);
          fetchData();
        }
      }
    } else {
      if (status === 'approved') {
        const lead = leads.find((l) => l.id === id);
        if (lead) {
          const isOnetime = lead.frequency === 'onetime' || lead.frequency === 'deodorizing_only';
          setCustomers((prev) => [
            ...prev,
            {
              ...lead,
              id: Date.now(),
              is_active: true,
              schedule_day: isOnetime ? null : lead.preferred_day,
              start_date: appointmentDate || new Date().toISOString().split('T')[0],
              monthly_rate: lead.quoted_monthly,
              weekly_rate: lead.quoted_weekly,
            },
          ]);
        }
      }
    }
  };

  const saveLead = async (id) => {
    if (!editingLead) return;
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, notes: editingLead.notes, preferred_day: editingLead.preferred_day } : l));
    if (isSupabaseConfigured()) {
      await supabase.from('leads').update({
        notes: editingLead.notes,
        preferred_day: editingLead.preferred_day || null,
        updated_at: new Date().toISOString(),
      }).eq('id', id);
    }
    setEditingLead(null);
  };

  const saveCustomer = async (id) => {
    if (!editingCustomer) return;
    setCustomers((prev) => prev.map((c) => c.id === id ? { ...c, schedule_day: editingCustomer.schedule_day, notes: editingCustomer.notes } : c));
    if (isSupabaseConfigured()) {
      await supabase.from('customers').update({
        schedule_day: editingCustomer.schedule_day || null,
        notes: editingCustomer.notes,
        updated_at: new Date().toISOString(),
      }).eq('id', id);
    }
    setEditingCustomer(null);
  };

  const todayStops = useMemo(() => {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[new Date().getDay()];
    const todayDate = new Date().toISOString().split('T')[0];
    const recurring = customers.filter((c) => c.is_active && c.schedule_day === todayName && c.frequency !== 'onetime');
    const oneTime = customers.filter((c) => c.is_active && c.frequency === 'onetime' && c.start_date === todayDate);
    return [...recurring, ...oneTime];
  }, [customers]);

  const analytics = useMemo(() => {
    const total = leads.length;
    const statusCounts = leads.reduce((acc, l) => { acc[l.status] = (acc[l.status] || 0) + 1; return acc; }, {});
    const sourceCounts = leads.reduce((acc, l) => {
      const src = l.heard_about || 'direct';
      acc[src] = (acc[src] || 0) + 1;
      return acc;
    }, {});
    const approvalRate = total > 0 ? Math.round(((statusCounts.approved || 0) / total) * 100) : 0;
    const monthlyRevenue = customers.filter((c) => c.is_active && c.frequency !== 'onetime').reduce((sum, c) => sum + (c.monthly_rate || 0), 0);
    const totalDogs = customers.filter((c) => c.is_active).reduce((sum, c) => sum + (c.dogs || 1), 0);
    return { total, statusCounts, sourceCounts, approvalRate, monthlyRevenue, totalDogs };
  }, [leads, customers]);

  const newLeadCount = leads.filter((l) => l.status === 'new').length;

  const tabs = [
    { id: 'today', label: "Today", count: todayStops.length },
    { id: 'leads', label: 'Leads', count: newLeadCount },
    { id: 'customers', label: 'Customers', count: customers.length },
    { id: 'schedule', label: 'Schedule' },
    { id: 'routes', label: 'Routes' },
    { id: 'analytics', label: 'Analytics' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="RTS" width={40} height={40} className="w-10 h-10 rounded-full shadow-md" />
          <div>
            <h1 className="font-heading text-lg font-bold text-gray-900 leading-none">Red Top Scoopers</h1>
            <p className="text-xs text-gray-400">{loading ? 'Loading...' : 'Admin Dashboard'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Refresh
          </button>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-500 transition-colors">
            Sign Out
          </button>
        </div>
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
        {activeTab === 'today' && <TodayTab stops={todayStops} />}
        {activeTab === 'leads' && (
          <LeadsTab
            leads={leads}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            onUpdateStatus={updateLeadStatus}
            editingLead={editingLead}
            setEditingLead={setEditingLead}
            onSaveLead={saveLead}
            pendingApproval={pendingApproval}
            setPendingApproval={setPendingApproval}
          />
        )}
        {activeTab === 'customers' && (
          <CustomersTab
            customers={customers}
            editingCustomer={editingCustomer}
            setEditingCustomer={setEditingCustomer}
            onSaveCustomer={saveCustomer}
          />
        )}
        {activeTab === 'schedule' && <ScheduleTab customers={customers} />}
        {activeTab === 'routes' && <RoutesTab customers={customers} />}
        {activeTab === 'analytics' && <AnalyticsTab analytics={analytics} customers={customers} />}
      </div>
    </div>
  );
}

// ─── TODAY TAB ───────────────────────────────────────────────────────────────

function TodayTab({ stops }) {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayLabel = dayNames[new Date().getDay()];
  const todayFormatted = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold text-gray-900">{todayLabel}&apos;s Schedule</h2>
          <p className="text-sm text-gray-500">{todayFormatted}</p>
        </div>
        <span className="font-heading font-bold text-brand-green text-lg">{stops.length} stop{stops.length !== 1 ? 's' : ''}</span>
      </div>

      {stops.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <p className="text-2xl mb-2">🎉</p>
          <p className="font-bold text-gray-700">Nothing scheduled for today</p>
          <p className="text-sm text-gray-400 mt-1">Enjoy the day off or check the Schedule tab to plan ahead.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {stops.map((stop, i) => (
            <div key={stop.id || i} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-brand-green text-white text-sm font-bold font-heading flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-bold text-gray-900">{stop.first_name} {stop.last_name}</p>
                    <p className="text-sm text-gray-500">{stop.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {(stop.frequency === 'onetime' || stop.frequency === 'deodorizing_only') && (
                    <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">One-Time</span>
                  )}
                  <span className="text-xs font-bold text-brand-red font-heading">${stop.weekly_rate || stop.quoted_weekly}/wk</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                <span className="flex items-center gap-1">
                  <span className="font-semibold text-gray-700">{stop.dogs || 1}</span> dog{(stop.dogs || 1) !== 1 ? 's' : ''}
                </span>
                <span className="capitalize">{stop.yard_size} yard</span>
                {stop.deodorizing && <span className="text-brand-green font-semibold">+ Deodorizing</span>}
                {stop.frequency !== 'onetime' && <span className="capitalize">{stop.frequency}</span>}
              </div>

              {stop.notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3 text-xs text-amber-800">
                  <span className="font-bold">Notes:</span> {stop.notes}
                </div>
              )}

              <div className="flex gap-2">
                <a href={`tel:${stop.phone}`} className="text-xs font-bold uppercase bg-brand-green text-white px-3 py-1.5 rounded-lg hover:bg-brand-green-light transition-colors">
                  Call
                </a>
                <a href={`sms:${stop.phone}`} className="text-xs font-bold uppercase bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-colors">
                  Text
                </a>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(stop.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold uppercase bg-gray-700 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Directions
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── LEADS TAB ────────────────────────────────────────────────────────────────

function LeadsTab({ leads, statusFilter, setStatusFilter, onUpdateStatus, editingLead, setEditingLead, onSaveLead, pendingApproval, setPendingApproval }) {
  const statusColors = {
    new: 'bg-blue-100 text-blue-800',
    contacted: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    declined: 'bg-red-100 text-red-800',
  };

  const filterCounts = {
    all: leads.length,
    new: leads.filter((l) => l.status === 'new').length,
    contacted: leads.filter((l) => l.status === 'contacted').length,
    approved: leads.filter((l) => l.status === 'approved').length,
    declined: leads.filter((l) => l.status === 'declined').length,
  };

  const filtered = statusFilter === 'all' ? leads : leads.filter((l) => l.status === statusFilter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-heading text-xl font-bold text-gray-900">Leads</h2>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(filterCounts).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`text-xs font-bold uppercase px-3 py-1.5 rounded-full border transition-colors ${
              statusFilter === status
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
            }`}
          >
            {status} <span className="ml-1 opacity-70">{count}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <p className="text-gray-400">No leads in this category.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((lead) => {
            const isOnetime = lead.frequency === 'onetime' || lead.frequency === 'deodorizing_only';
            const priceDisplay = isOnetime
              ? `$${lead.quoted_monthly} flat`
              : `$${lead.quoted_weekly}/wk`;
            const isEditing = editingLead?.id === lead.id;
            const isPendingApproval = pendingApproval?.id === lead.id;

            return (
              <div key={lead.id} className={`bg-white rounded-xl border p-4 md:p-5 ${lead.status === 'approved' ? 'border-green-200 bg-green-50/30' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
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
                      {isOnetime && (
                        <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          One-Time
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{lead.address}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <p className="font-heading text-lg font-bold text-brand-red">{priceDisplay}</p>
                    <button
                      onClick={() => isEditing ? setEditingLead(null) : setEditingLead({ id: lead.id, notes: lead.notes || '', preferred_day: lead.preferred_day || '' })}
                      className="text-gray-400 hover:text-gray-700 transition-colors p-1"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-3">
                  <Detail label="Phone" value={lead.phone} />
                  <Detail label="Email" value={lead.email || '—'} />
                  <Detail label="Dogs" value={`${lead.dogs || '—'} dog${(lead.dogs || 1) > 1 ? 's' : ''}`} highlight={lead.dogs > 2} />
                  <Detail label="Yard" value={lead.yard_size} />
                  <Detail label="Service" value={lead.frequency} />
                  {!isOnetime && <Detail label="Pref. Day" value={lead.preferred_day || 'No pref'} />}
                  <Detail label="Deodorizing" value={lead.deodorizing ? 'Yes' : 'No'} />
                  <Detail label="Source" value={lead.heard_about || '—'} />
                </div>

                {lead.notes && !isEditing && (
                  <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-3 text-xs text-amber-800">
                    <span className="font-bold">Notes:</span> {lead.notes}
                  </div>
                )}

                {/* Inline edit panel */}
                {isEditing && (
                  <div className="border border-gray-200 rounded-lg p-3 mb-3 bg-gray-50 space-y-2">
                    {!isOnetime && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Preferred Day</label>
                        <select
                          value={editingLead.preferred_day}
                          onChange={(e) => setEditingLead((p) => ({ ...p, preferred_day: e.target.value }))}
                          className="text-sm border border-gray-300 rounded px-2 py-1.5 w-full bg-white"
                        >
                          <option value="">No preference</option>
                          {DAYS.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
                      <textarea
                        value={editingLead.notes}
                        onChange={(e) => setEditingLead((p) => ({ ...p, notes: e.target.value }))}
                        rows={2}
                        className="text-sm border border-gray-300 rounded px-2 py-1.5 w-full resize-none"
                        placeholder="Gate code, dog behavior, instructions..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => onSaveLead(lead.id)} className="text-xs font-bold uppercase bg-brand-green text-white px-3 py-1.5 rounded-lg">Save</button>
                      <button onClick={() => setEditingLead(null)} className="text-xs font-bold uppercase bg-gray-300 text-gray-700 px-3 py-1.5 rounded-lg">Cancel</button>
                    </div>
                  </div>
                )}

                {/* One-time approval date picker */}
                {isPendingApproval && (
                  <div className="border border-green-200 rounded-lg p-3 mb-3 bg-green-50 space-y-2">
                    <p className="text-xs font-bold text-green-800">Set appointment date for this one-time cleanup:</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={pendingApproval.date}
                        onChange={(e) => setPendingApproval((p) => ({ ...p, date: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]}
                        className="text-sm border border-gray-300 rounded px-2 py-1.5 flex-1"
                      />
                      <button
                        onClick={() => {
                          if (!pendingApproval.date) return;
                          onUpdateStatus(lead.id, 'approved', pendingApproval.date);
                          setPendingApproval(null);
                        }}
                        disabled={!pendingApproval.date}
                        className="text-xs font-bold uppercase bg-green-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-40"
                      >
                        Confirm
                      </button>
                      <button onClick={() => setPendingApproval(null)} className="text-xs font-bold uppercase bg-gray-300 text-gray-700 px-3 py-1.5 rounded-lg">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <a href={`tel:${lead.phone}`} className="text-xs font-bold uppercase bg-brand-green text-white px-3 py-1.5 rounded-lg hover:bg-brand-green-light transition-colors">
                    Call
                  </a>
                  <a href={`sms:${lead.phone}`} className="text-xs font-bold uppercase bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-colors">
                    Text
                  </a>
                  <button
                    onClick={() => onUpdateStatus(lead.id, 'contacted')}
                    disabled={lead.status === 'contacted' || lead.status === 'approved'}
                    className={`text-xs font-bold uppercase px-3 py-1.5 rounded-lg transition-colors ${
                      lead.status === 'contacted' || lead.status === 'approved'
                        ? 'bg-gray-100 text-gray-400 cursor-default'
                        : 'bg-yellow-500 text-white hover:bg-yellow-600'
                    }`}
                  >
                    {lead.status === 'contacted' || lead.status === 'approved' ? '✓ Contacted' : 'Mark Contacted'}
                  </button>
                  {lead.status !== 'approved' && !isPendingApproval && (
                    <button
                      onClick={() => {
                        if (isOnetime) {
                          setPendingApproval({ id: lead.id, date: '' });
                        } else {
                          onUpdateStatus(lead.id, 'approved');
                        }
                      }}
                      className="text-xs font-bold uppercase bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Approve {isOnetime ? '(set date)' : ''}
                    </button>
                  )}
                  {lead.status !== 'declined' && lead.status !== 'approved' && (
                    <button onClick={() => onUpdateStatus(lead.id, 'declined')} className="text-xs font-bold uppercase bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors">
                      Decline
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── CUSTOMERS TAB ────────────────────────────────────────────────────────────

function CustomersTab({ customers, editingCustomer, setEditingCustomer, onSaveCustomer }) {
  const recurring = customers.filter((c) => c.frequency !== 'onetime' && c.frequency !== 'deodorizing_only');
  const onetimes = customers.filter((c) => c.frequency === 'onetime' || c.frequency === 'deodorizing_only');

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-bold text-gray-900">Customers</h2>

      {customers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <p className="text-gray-400">No customers yet. Approve a lead to add them here.</p>
        </div>
      ) : (
        <>
          {recurring.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-heading text-sm uppercase tracking-widest text-gray-500">Recurring Customers ({recurring.length})</h3>
              {recurring.map((c) => <CustomerCard key={c.id} c={c} editingCustomer={editingCustomer} setEditingCustomer={setEditingCustomer} onSaveCustomer={onSaveCustomer} />)}
            </div>
          )}
          {onetimes.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-heading text-sm uppercase tracking-widest text-gray-500">One-Time Appointments ({onetimes.length})</h3>
              {onetimes.map((c) => <CustomerCard key={c.id} c={c} editingCustomer={editingCustomer} setEditingCustomer={setEditingCustomer} onSaveCustomer={onSaveCustomer} showDate />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CustomerCard({ c, editingCustomer, setEditingCustomer, onSaveCustomer, showDate = false }) {
  const isEditing = editingCustomer?.id === c.id;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-gray-900">{c.first_name} {c.last_name}</h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 uppercase">Active</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 uppercase">{c.frequency}</span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{c.address}</p>
          <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
            <span><span className="font-semibold text-gray-700">{c.dogs || 1}</span> dog{(c.dogs || 1) !== 1 ? 's' : ''}</span>
            <span className="capitalize">{c.yard_size} yard</span>
            {c.deodorizing && <span className="text-brand-green font-semibold">+ Deodorizing</span>}
            {!showDate && c.schedule_day && <span className="capitalize font-semibold text-brand-green">{c.schedule_day}s</span>}
            {showDate && c.start_date && <span className="font-semibold text-blue-600">Appt: {new Date(c.start_date + 'T12:00:00').toLocaleDateString()}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <div className="text-right">
            <p className="font-heading font-bold text-brand-red">${c.monthly_rate || c.quoted_monthly}/mo</p>
          </div>
          <button
            onClick={() => isEditing ? setEditingCustomer(null) : setEditingCustomer({ id: c.id, schedule_day: c.schedule_day || '', notes: c.notes || '' })}
            className="text-gray-400 hover:text-gray-700 transition-colors p-1"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>
      </div>

      {c.notes && !isEditing && (
        <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-2 text-xs text-amber-800">
          <span className="font-bold">Notes:</span> {c.notes}
        </div>
      )}

      {isEditing && (
        <div className="border border-gray-200 rounded-lg p-3 mt-2 bg-gray-50 space-y-2">
          {!showDate && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Service Day</label>
              <select
                value={editingCustomer.schedule_day}
                onChange={(e) => setEditingCustomer((p) => ({ ...p, schedule_day: e.target.value }))}
                className="text-sm border border-gray-300 rounded px-2 py-1.5 w-full bg-white"
              >
                <option value="">Unscheduled</option>
                {DAYS.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
            <textarea
              value={editingCustomer.notes}
              onChange={(e) => setEditingCustomer((p) => ({ ...p, notes: e.target.value }))}
              rows={2}
              className="text-sm border border-gray-300 rounded px-2 py-1.5 w-full resize-none"
              placeholder="Gate code, dog behavior, instructions..."
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => onSaveCustomer(c.id)} className="text-xs font-bold uppercase bg-brand-green text-white px-3 py-1.5 rounded-lg">Save</button>
            <button onClick={() => setEditingCustomer(null)} className="text-xs font-bold uppercase bg-gray-300 text-gray-700 px-3 py-1.5 rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-3">
        <a href={`tel:${c.phone}`} className="text-xs font-bold uppercase bg-brand-green text-white px-3 py-1.5 rounded-lg hover:bg-brand-green-light transition-colors">Call</a>
        <a href={`sms:${c.phone}`} className="text-xs font-bold uppercase bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-colors">Text</a>
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(c.address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-bold uppercase bg-gray-700 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Directions
        </a>
      </div>
    </div>
  );
}

// ─── SCHEDULE TAB ─────────────────────────────────────────────────────────────

function ScheduleTab({ customers }) {
  const recurring = customers.filter((c) => c.frequency !== 'onetime' && c.frequency !== 'deodorizing_only');
  const onetimes = customers.filter((c) => (c.frequency === 'onetime' || c.frequency === 'deodorizing_only') && c.start_date);

  const groupedOnetimes = onetimes.reduce((acc, c) => {
    const date = c.start_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(c);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold text-gray-900 mb-4">Weekly Schedule</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DAYS.map((day) => {
            const dayCustomers = recurring.filter((c) => c.schedule_day === day);
            return (
              <div key={day} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className={`px-4 py-2 flex items-center justify-between ${dayCustomers.length > 0 ? 'bg-brand-green' : 'bg-gray-100'}`}>
                  <h3 className={`font-heading text-sm font-bold uppercase tracking-wider ${dayCustomers.length > 0 ? 'text-white' : 'text-gray-500'}`}>
                    {day}
                  </h3>
                  {dayCustomers.length > 0 && (
                    <span className="text-xs text-white/70">{dayCustomers.length} stop{dayCustomers.length !== 1 ? 's' : ''}</span>
                  )}
                </div>
                <div className="p-3">
                  {dayCustomers.length === 0 ? (
                    <p className="text-sm text-gray-400 py-2">No customers scheduled</p>
                  ) : (
                    <div className="space-y-2">
                      {dayCustomers.map((c) => (
                        <div key={c.id} className="text-sm border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                          <p className="font-semibold text-gray-900">{c.first_name} {c.last_name}</p>
                          <p className="text-xs text-gray-500">{c.address}</p>
                          <p className="text-xs text-gray-400">{c.dogs || 1} dog{(c.dogs || 1) !== 1 ? 's' : ''} · {c.yard_size}</p>
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

      {onetimes.length > 0 && (
        <div>
          <h2 className="font-heading text-xl font-bold text-gray-900 mb-4">One-Time Appointments</h2>
          <div className="space-y-3">
            {Object.entries(groupedOnetimes)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([date, appts]) => (
                <div key={date} className="bg-white rounded-xl border border-blue-200 overflow-hidden">
                  <div className="bg-blue-50 px-4 py-2 flex items-center justify-between">
                    <h3 className="font-heading text-sm font-bold text-blue-800">
                      {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </h3>
                    <span className="text-xs text-blue-500">{appts.length} appt{appts.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="p-3 space-y-2">
                    {appts.map((c) => (
                      <div key={c.id} className="text-sm">
                        <p className="font-semibold text-gray-900">{c.first_name} {c.last_name}</p>
                        <p className="text-xs text-gray-500">{c.address} · {c.dogs || 1} dog{(c.dogs || 1) !== 1 ? 's' : ''}</p>
                        {c.notes && <p className="text-xs text-amber-700 mt-0.5">Notes: {c.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ROUTES TAB ───────────────────────────────────────────────────────────────

function RoutesTab({ customers }) {
  const recurring = customers.filter((c) => c.frequency !== 'onetime' && c.frequency !== 'deodorizing_only');

  const hasAny = DAYS.some((d) => recurring.some((c) => c.schedule_day === d));

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl font-bold text-gray-900">Routes</h2>
      <p className="text-sm text-gray-500">Recurring customers grouped by service day.</p>

      {!hasAny ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <p className="text-gray-400">No routes yet. Approve leads and assign schedule days to build routes.</p>
        </div>
      ) : (
        DAYS.map((day) => {
          const dayCustomers = recurring.filter((c) => c.schedule_day === day);
          if (dayCustomers.length === 0) return null;
          return (
            <div key={day} className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-heading text-base font-bold text-brand-green uppercase tracking-wider mb-3">
                {day} — {dayCustomers.length} stop{dayCustomers.length !== 1 ? 's' : ''}
              </h3>
              <div className="space-y-3">
                {dayCustomers.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-3 text-sm">
                    <span className="w-7 h-7 rounded-full bg-brand-green text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{c.first_name} {c.last_name}</span>
                        <span className="text-gray-400 text-xs">{c.dogs || 1} dog{(c.dogs || 1) !== 1 ? 's' : ''}</span>
                        {c.deodorizing && <span className="text-xs text-brand-green font-semibold">+ Deodorizing</span>}
                      </div>
                      <p className="text-gray-400 text-xs mt-0.5">{c.address}</p>
                      {c.notes && <p className="text-xs text-amber-700 mt-0.5">⚠ {c.notes}</p>}
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <a href={`tel:${c.phone}`} className="text-xs bg-brand-green text-white px-2 py-1 rounded font-bold">Call</a>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(c.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-gray-700 text-white px-2 py-1 rounded font-bold"
                      >
                        Map
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ─── ANALYTICS TAB ────────────────────────────────────────────────────────────

const SOURCE_LABELS = {
  facebook: 'Facebook',
  nextdoor: 'Nextdoor',
  google: 'Google',
  referral: 'Referral',
  yard_sign: 'Yard Sign',
  direct: 'Direct / Unknown',
  other: 'Other',
};

const SOURCE_COLORS = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500', 'bg-gray-500'];

function AnalyticsTab({ analytics, customers }) {
  const { total, statusCounts, sourceCounts, approvalRate, monthlyRevenue, totalDogs } = analytics;

  const sourceEntries = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]);
  const maxSource = sourceEntries.length > 0 ? sourceEntries[0][1] : 1;

  const funnel = [
    { label: 'Total Leads', count: total, color: 'bg-gray-400' },
    { label: 'Contacted', count: statusCounts.contacted || 0, color: 'bg-yellow-400' },
    { label: 'Approved', count: statusCounts.approved || 0, color: 'bg-green-500' },
    { label: 'Declined', count: statusCounts.declined || 0, color: 'bg-red-400' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-bold text-gray-900">Analytics</h2>

      {/* Key stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads', value: total, sub: 'All time' },
          { label: 'Approval Rate', value: `${approvalRate}%`, sub: `${statusCounts.approved || 0} approved` },
          { label: 'Monthly Revenue', value: `$${monthlyRevenue}`, sub: 'Recurring customers' },
          { label: 'Total Dogs', value: totalDogs, sub: 'Active customers' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="font-heading text-3xl font-bold text-brand-red mb-1">{s.value}</p>
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">{s.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Lead source breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-heading text-base font-bold text-gray-900 mb-4 uppercase tracking-wider">Lead Sources</h3>
          {sourceEntries.length === 0 ? (
            <p className="text-sm text-gray-400">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {sourceEntries.map(([src, count], i) => {
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={src}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-semibold text-gray-700">{SOURCE_LABELS[src] || src}</span>
                      <span className="text-gray-500">{count} ({pct}%)</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${SOURCE_COLORS[i % SOURCE_COLORS.length]}`}
                        style={{ width: `${Math.round((count / maxSource) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Status funnel */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-heading text-base font-bold text-gray-900 mb-4 uppercase tracking-wider">Lead Funnel</h3>
          {total === 0 ? (
            <p className="text-sm text-gray-400">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {funnel.map((f) => {
                const pct = total > 0 ? Math.round((f.count / total) * 100) : 0;
                return (
                  <div key={f.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-semibold text-gray-700">{f.label}</span>
                      <span className="text-gray-500">{f.count} ({pct}%)</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${f.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Active customers by day */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-heading text-base font-bold text-gray-900 mb-4 uppercase tracking-wider">Customers by Service Day</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {DAYS.map((day) => {
            const count = customers.filter((c) => c.schedule_day === day && c.frequency !== 'onetime').length;
            return (
              <div key={day} className="text-center">
                <p className="font-heading text-2xl font-bold text-brand-red">{count}</p>
                <p className="text-xs text-gray-500 capitalize">{day.slice(0, 3)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── SHARED ───────────────────────────────────────────────────────────────────

function Detail({ label, value, highlight = false }) {
  return (
    <div>
      <span className="text-xs text-gray-400 uppercase tracking-wider">{label}</span>
      <p className={`font-semibold capitalize ${highlight ? 'text-brand-red' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
}
