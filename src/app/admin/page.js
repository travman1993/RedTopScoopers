'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];


export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('today');
  const [leads, setLeads] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingLead, setEditingLead] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [pendingApproval, setPendingApproval] = useState(null);
  const [todayOrder, setTodayOrder] = useState([]);
  const [declinedLeads, setDeclinedLeads] = useState([]);
  const [allTimeLeadCount, setAllTimeLeadCount] = useState(0);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    setLoading(true);
    const [leadsRes, customersRes, countRes] = await Promise.all([
      supabase.from('leads').select('*').order('created_at', { ascending: false }),
      supabase.from('customers').select('*').order('created_at', { ascending: false }),
      supabase.from('leads').select('id', { count: 'exact', head: true }).neq('status', 'deleted'),
    ]);
    if (leadsRes.data) {
      const active = leadsRes.data.filter((l) => l.status !== 'declined' && l.status !== 'approved' && l.status !== 'deleted');
      const declined = leadsRes.data.filter((l) => l.status === 'declined');
      setLeads(active);
      setDeclinedLeads(declined);
    }
    if (customersRes.data) setCustomers(customersRes.data);
    if (countRes.count != null) setAllTimeLeadCount(countRes.count);
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
    const lead = leads.find((l) => l.id === id);
    if (!lead) return;

    // Auto-remove lead from list on approve or decline — moves to customers / follow-up
    setLeads((prev) => prev.filter((l) => l.id !== id));

    if (isSupabaseConfigured()) {
      if (status === 'approved') {
        const isOnetime = lead.frequency === 'onetime' || lead.frequency === 'deodorizing_only';
        await Promise.all([
          supabase.from('leads').update({ status, updated_at: new Date().toISOString() }).eq('id', id),
          supabase.from('customers').insert([{
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
          }]),
        ]);
        fetchData();
      } else if (status === 'declined') {
        await supabase.from('leads').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
        setDeclinedLeads((prev) => [{ ...lead, status: 'declined' }, ...prev]);
      } else {
        await supabase.from('leads').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
      }
    } else {
      // Demo mode
      if (status === 'approved') {
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
      } else if (status === 'declined') {
        setDeclinedLeads((prev) => [{ ...lead, status: 'declined' }, ...prev]);
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
    const updates = {
      first_name: editingCustomer.first_name,
      last_name: editingCustomer.last_name,
      phone: editingCustomer.phone,
      email: editingCustomer.email || null,
      address: editingCustomer.address,
      dogs: parseInt(editingCustomer.dogs, 10) || 1,
      yard_size: editingCustomer.yard_size,
      frequency: editingCustomer.frequency,
      deodorizing: editingCustomer.deodorizing,
      schedule_day: editingCustomer.schedule_day || null,
      start_date: editingCustomer.start_date || null,
      monthly_rate: parseInt(editingCustomer.monthly_rate, 10) || 0,
      notes: editingCustomer.notes,
      updated_at: new Date().toISOString(),
    };
    setCustomers((prev) => prev.map((c) => c.id === id ? { ...c, ...updates } : c));
    if (isSupabaseConfigured()) {
      await supabase.from('customers').update(updates).eq('id', id);
    }
    setEditingCustomer(null);
  };

  const addCustomer = async (data) => {
    const newCustomer = {
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
      email: data.email || null,
      address: data.address,
      dogs: parseInt(data.dogs, 10) || 1,
      yard_size: data.yard_size,
      frequency: data.frequency,
      deodorizing: data.deodorizing,
      schedule_day: data.schedule_day || null,
      start_date: data.start_date || null,
      monthly_rate: parseInt(data.monthly_rate, 10) || 0,
      notes: data.notes || null,
      is_active: true,
    };
    if (isSupabaseConfigured()) {
      const { data: inserted } = await supabase.from('customers').insert([newCustomer]).select().single();
      if (inserted) setCustomers((prev) => [inserted, ...prev]);
    } else {
      setCustomers((prev) => [{ ...newCustomer, id: Date.now() }, ...prev]);
    }
  };

  const deleteCustomer = async (id) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    if (isSupabaseConfigured()) {
      await supabase.from('customers').update({ is_active: false, payment_status: 'removed', updated_at: new Date().toISOString() }).eq('id', id);
    }
  };

  const pauseCustomer = async (id) => {
    setCustomers((prev) => prev.map((c) => c.id === id ? { ...c, is_active: false } : c));
    if (isSupabaseConfigured()) {
      await supabase.from('customers').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', id);
    }
  };

  const resumeCustomer = async (id) => {
    setCustomers((prev) => prev.map((c) => c.id === id ? { ...c, is_active: true } : c));
    if (isSupabaseConfigured()) {
      await supabase.from('customers').update({ is_active: true, updated_at: new Date().toISOString() }).eq('id', id);
    }
  };

  const updatePaymentStatus = async (id, payment_status) => {
    setCustomers((prev) => prev.map((c) => c.id === id ? { ...c, payment_status } : c));
    if (isSupabaseConfigured()) {
      await supabase.from('customers').update({ payment_status, updated_at: new Date().toISOString() }).eq('id', id);
    }
  };

  const deleteLead = async (id) => {
    setLeads((prev) => prev.filter((l) => l.id !== id));
    setDeclinedLeads((prev) => prev.filter((l) => l.id !== id));
    if (isSupabaseConfigured()) {
      // Soft-delete: can't hard-delete leads because customers table references lead_id via foreign key
      await supabase.from('leads').update({ status: 'deleted', updated_at: new Date().toISOString() }).eq('id', id);
    }
  };

  const reopenLead = async (id) => {
    const lead = declinedLeads.find((l) => l.id === id);
    if (!lead) return;
    setDeclinedLeads((prev) => prev.filter((l) => l.id !== id));
    setLeads((prev) => [{ ...lead, status: 'new' }, ...prev]);
    if (isSupabaseConfigured()) {
      await supabase.from('leads').update({ status: 'new', updated_at: new Date().toISOString() }).eq('id', id);
    }
  };

  const baseTodayStops = useMemo(() => {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[new Date().getDay()];
    const todayDate = new Date().toISOString().split('T')[0];
    const recurring = customers.filter((c) => c.is_active && c.schedule_day === todayName && c.frequency !== 'onetime' && c.frequency !== 'deodorizing_only');
    const singleVisit = customers.filter((c) => c.is_active && (c.frequency === 'onetime' || c.frequency === 'deodorizing_only') && c.start_date === todayDate);
    return [...recurring, ...singleVisit];
  }, [customers]);

  // Reorder today's stops while keeping todayOrder IDs in sync
  const todayStops = useMemo(() => {
    if (todayOrder.length === 0) return baseTodayStops;
    const ordered = todayOrder.map((id) => baseTodayStops.find((s) => s.id === id)).filter(Boolean);
    const unordered = baseTodayStops.filter((s) => !todayOrder.includes(s.id));
    return [...ordered, ...unordered];
  }, [baseTodayStops, todayOrder]);

  const analytics = useMemo(() => {
    const allLeads = [...leads, ...declinedLeads];
    const sourceCounts = allLeads.reduce((acc, l) => {
      const src = l.heard_about || 'direct';
      acc[src] = (acc[src] || 0) + 1;
      return acc;
    }, {});
    const activeCustomers = customers.filter((c) => c.is_active);
    const pausedCustomers = customers.filter((c) => !c.is_active);
    const recurringCustomers = activeCustomers.filter((c) => c.frequency !== 'onetime' && c.frequency !== 'deodorizing_only');
    const onetimeCustomers = customers.filter((c) => c.frequency === 'onetime' || c.frequency === 'deodorizing_only');
    const monthlyRevenue = recurringCustomers.reduce((sum, c) => sum + (c.monthly_rate || 0), 0);
    const onetimeRevenue = onetimeCustomers.reduce((sum, c) => sum + (c.monthly_rate || 0), 0);
    const totalDogs = activeCustomers.reduce((sum, c) => sum + (c.dogs || 1), 0);
    const approvalRate = allTimeLeadCount > 0 ? Math.round((activeCustomers.length / allTimeLeadCount) * 100) : 0;
    return {
      total: allTimeLeadCount,
      activeLeads: leads.length,
      declinedLeads: declinedLeads.length,
      sourceCounts,
      approvalRate,
      monthlyRevenue,
      onetimeRevenue,
      totalDogs,
      activeCount: activeCustomers.length,
      pausedCount: pausedCustomers.length,
    };
  }, [leads, declinedLeads, customers, allTimeLeadCount]);

  const newLeadCount = leads.filter((l) => l.status === 'new').length;

  const tabs = [
    { id: 'today', label: 'Today', count: todayStops.length },
    { id: 'leads', label: 'Leads', count: newLeadCount },
    { id: 'customers', label: 'Customers', count: customers.length },
    { id: 'schedule', label: 'Schedule' },
    { id: 'followup', label: 'Follow-Up', count: declinedLeads.length },
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
        {activeTab === 'today' && <TodayTab stops={todayStops} onReorder={(newOrder) => setTodayOrder(newOrder.map((s) => s.id))} />}
        {activeTab === 'leads' && (
          <LeadsTab
            leads={leads}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            onUpdateStatus={updateLeadStatus}
            editingLead={editingLead}
            setEditingLead={setEditingLead}
            onSaveLead={saveLead}
            onDeleteLead={deleteLead}
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
            onDeleteCustomer={deleteCustomer}
            onAddCustomer={addCustomer}
            onPauseCustomer={pauseCustomer}
            onResumeCustomer={resumeCustomer}
            onUpdatePayment={updatePaymentStatus}
          />
        )}
        {activeTab === 'schedule' && <ScheduleTab customers={customers} />}
        {activeTab === 'followup' && <FollowUpTab leads={declinedLeads} onReopen={reopenLead} onDelete={deleteLead} />}
        {activeTab === 'analytics' && <AnalyticsTab analytics={analytics} customers={customers} />}
      </div>
    </div>
  );
}

// ─── TODAY TAB (drag-to-reorder) ─────────────────────────────────────────────

function TodayTab({ stops, onReorder }) {
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const todayKey = `rts_completed_${new Date().toISOString().split('T')[0]}`;
  const [completed, setCompleted] = useState(() => {
    try {
      const saved = localStorage.getItem(todayKey);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayLabel = dayNames[new Date().getDay()];
  const todayFormatted = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const handleDragStart = (i) => setDragIndex(i);
  const handleDragOver = (e, i) => { e.preventDefault(); setDragOverIndex(i); };
  const handleDrop = (e, i) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === i) { setDragIndex(null); setDragOverIndex(null); return; }
    const reordered = [...stops];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(i, 0, moved);
    onReorder(reordered);
    setDragIndex(null);
    setDragOverIndex(null);
  };
  const handleDragEnd = () => { setDragIndex(null); setDragOverIndex(null); };
  const markComplete = (id) => setCompleted((prev) => {
    const next = new Set([...prev, id]);
    try { localStorage.setItem(todayKey, JSON.stringify([...next])); } catch {}
    return next;
  });

  const visible = stops.filter((s) => !completed.has(s.id));
  const doneCount = completed.size;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold text-gray-900">{todayLabel}&apos;s Schedule</h2>
          <p className="text-sm text-gray-500">{todayFormatted}</p>
        </div>
        <div className="text-right">
          <span className="font-heading font-bold text-brand-green text-lg">{visible.length} left</span>
          {doneCount > 0 && <p className="text-xs text-gray-400">{doneCount} completed</p>}
        </div>
      </div>

      {visible.length > 1 && (
        <p className="text-xs text-gray-400 text-center">Hold and drag a stop to reorder your route</p>
      )}

      {visible.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          {stops.length === 0 ? (
            <>
              <p className="text-2xl mb-2">🎉</p>
              <p className="font-bold text-gray-700">Nothing scheduled for today</p>
              <p className="text-sm text-gray-400 mt-1">Enjoy the day off or check the Schedule tab to plan ahead.</p>
            </>
          ) : (
            <>
              <p className="text-2xl mb-2">✅</p>
              <p className="font-bold text-gray-700">All {doneCount} stop{doneCount !== 1 ? 's' : ''} done!</p>
              <p className="text-sm text-gray-400 mt-1">Great work today.</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((stop, i) => {
            const onTheWayCall = `tel:${stop.phone}`;
            const onTheWayText = `sms:${stop.phone}${typeof window !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent) ? '&' : '?'}body=${encodeURIComponent(`Hi ${stop.first_name}, it's Red Top Scoopers — we're on our way to your place now! See you shortly.`)}`;
            const gatePhotoText = `sms:${stop.phone}${typeof window !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent) ? '&' : '?'}body=${encodeURIComponent(`Hi ${stop.first_name}, your yard is all cleaned up and your gate is secured! Here's a photo for your records 📸`)}`;

            return (
              <div
                key={stop.id || i}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDrop={(e) => handleDrop(e, i)}
                onDragEnd={handleDragEnd}
                className={`bg-white rounded-xl border p-4 transition-all cursor-grab active:cursor-grabbing select-none ${
                  dragOverIndex === i && dragIndex !== i
                    ? 'border-brand-green shadow-lg scale-[1.01]'
                    : dragIndex === i
                    ? 'opacity-40 border-gray-300'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                      <span className="w-8 h-8 rounded-full bg-brand-green text-white text-sm font-bold font-heading flex items-center justify-center">
                        {i + 1}
                      </span>
                      <svg className="w-3.5 h-3.5 text-gray-300 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7 2a1 1 0 000 2h6a1 1 0 000-2H7zM4 7a1 1 0 000 2h12a1 1 0 000-2H4zM4 12a1 1 0 000 2h12a1 1 0 000-2H4zM7 17a1 1 0 000 2h6a1 1 0 000-2H7z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{stop.first_name} {stop.last_name}</p>
                      <p className="text-sm text-gray-500">{stop.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {(stop.frequency === 'onetime' || stop.frequency === 'deodorizing_only') && (
                      <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">One-Time</span>
                    )}
                    <span className="text-xs font-bold text-brand-red font-heading">${stop.monthly_rate || stop.weekly_rate}/mo</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                  <span className="font-semibold text-gray-700">{stop.dogs || 1} dog{(stop.dogs || 1) !== 1 ? 's' : ''}</span>
                  <span className="capitalize">{stop.yard_size} yard</span>
                  {stop.deodorizing && <span className="text-brand-green font-semibold">+ Deodorizing</span>}
                  {stop.frequency !== 'onetime' && <span className="capitalize">{stop.frequency}</span>}
                </div>

                {stop.notes && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3 text-xs text-amber-800">
                    <span className="font-bold">Notes:</span> {stop.notes}
                  </div>
                )}

                <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                  <a href={onTheWayCall} className="text-xs font-bold uppercase bg-brand-green text-white px-3 py-1.5 rounded-lg hover:bg-brand-green-light transition-colors">
                    Call On The Way
                  </a>
                  <a href={onTheWayText} className="text-xs font-bold uppercase bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-colors">
                    Text On The Way
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

                <div className="flex flex-wrap gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                  <a href={gatePhotoText} className="text-xs font-bold uppercase bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors">
                    Send Gate Photo
                  </a>
                  <button
                    onClick={() => markComplete(stop.id)}
                    className="text-xs font-bold uppercase bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    ✓ Mark Complete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── LEADS TAB ────────────────────────────────────────────────────────────────

function LeadsTab({ leads, statusFilter, setStatusFilter, onUpdateStatus, editingLead, setEditingLead, onSaveLead, onDeleteLead, pendingApproval, setPendingApproval }) {
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
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
                    {lead.created_at && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Submitted {new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </p>
                    )}
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
                  <a
                    href={`sms:${lead.phone}${typeof window !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent) ? '&' : '?'}body=${encodeURIComponent(`Hey ${lead.first_name}! This is Travis with Red Top Scoopers 🐾 I saw your inquiry and wanted to reach out — I'll be giving you a call shortly to go over the details. We'd love to add you to the family! Talk soon.`)}`}
                    className="text-xs font-bold uppercase bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-colors"
                  >
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
                  {(lead.status === 'approved' || lead.status === 'declined') && confirmDeleteId !== lead.id && (
                    <button onClick={() => setConfirmDeleteId(lead.id)} className="text-xs font-bold uppercase bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors ml-auto">
                      Delete
                    </button>
                  )}
                </div>

                {confirmDeleteId === lead.id && (
                  <div className="mt-3 border border-red-200 bg-red-50 rounded-lg px-3 py-2.5 flex items-center justify-between gap-3">
                    <p className="text-xs text-red-700 font-semibold">Permanently delete this lead?</p>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => { onDeleteLead(lead.id); setConfirmDeleteId(null); }} className="text-xs font-bold uppercase bg-red-600 text-white px-3 py-1.5 rounded-lg">
                        Delete
                      </button>
                      <button onClick={() => setConfirmDeleteId(null)} className="text-xs font-bold uppercase bg-gray-300 text-gray-700 px-3 py-1.5 rounded-lg">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── CUSTOMERS TAB ────────────────────────────────────────────────────────────

const BLANK_CUSTOMER = {
  first_name: '', last_name: '', phone: '', email: '', address: '',
  dogs: '1', yard_size: 'small', frequency: 'weekly', deodorizing: false,
  schedule_day: '', start_date: '', monthly_rate: '', notes: '',
};

function CustomersTab({ customers, editingCustomer, setEditingCustomer, onSaveCustomer, onDeleteCustomer, onAddCustomer, onPauseCustomer, onResumeCustomer, onUpdatePayment }) {
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(BLANK_CUSTOMER);
  const [addSaving, setAddSaving] = useState(false);

  const q = search.toLowerCase();
  const filtered = q
    ? customers.filter((c) =>
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
        (c.address || '').toLowerCase().includes(q) ||
        (c.phone || '').includes(q) ||
        (c.email || '').toLowerCase().includes(q)
      )
    : customers;

  const todayStr = new Date().toISOString().split('T')[0];
  const activeFiltered = filtered.filter((c) => c.is_active);
  const recurring = activeFiltered.filter((c) => c.frequency !== 'onetime' && c.frequency !== 'deodorizing_only');
  const onetimes = activeFiltered.filter((c) => (c.frequency === 'onetime' || c.frequency === 'deodorizing_only') && (!c.start_date || c.start_date >= todayStr));
  const pastOnetimes = activeFiltered.filter((c) => (c.frequency === 'onetime' || c.frequency === 'deodorizing_only') && c.start_date && c.start_date < todayStr);

  const setAdd = (field) => (e) =>
    setAddForm((p) => ({ ...p, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleAdd = async (e) => {
    e.preventDefault();
    setAddSaving(true);
    await onAddCustomer(addForm);
    setAddForm(BLANK_CUSTOMER);
    setShowAdd(false);
    setAddSaving(false);
  };

  const isAddRecurring = addForm.frequency !== 'onetime' && addForm.frequency !== 'deodorizing_only';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-heading text-xl font-bold text-gray-900">Customers</h2>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="text-xs font-bold uppercase bg-brand-green text-white px-4 py-2 rounded-lg hover:bg-brand-green-light transition-colors"
        >
          {showAdd ? 'Cancel' : '+ Add Customer'}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, address, or phone..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Add Customer Form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border-2 border-brand-green/30 p-5 space-y-3">
          <p className="text-sm font-bold uppercase tracking-wider text-brand-green mb-2">New Customer</p>
          <div className="grid grid-cols-2 gap-2">
            <EditField label="First Name *" value={addForm.first_name} onChange={setAdd('first_name')} />
            <EditField label="Last Name *" value={addForm.last_name} onChange={setAdd('last_name')} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <EditField label="Phone *" value={addForm.phone} onChange={setAdd('phone')} type="tel" />
            <EditField label="Email" value={addForm.email} onChange={setAdd('email')} type="email" />
          </div>
          <EditField label="Address *" value={addForm.address} onChange={setAdd('address')} />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Dogs</label>
              <select value={addForm.dogs} onChange={setAdd('dogs')} className="text-sm border border-gray-300 rounded px-2 py-1.5 w-full bg-white">
                {['1','2','3','4','5'].map((n) => <option key={n} value={n}>{n} dog{n !== '1' ? 's' : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Yard Size</label>
              <select value={addForm.yard_size} onChange={setAdd('yard_size')} className="text-sm border border-gray-300 rounded px-2 py-1.5 w-full bg-white">
                {['small','medium','large','xl'].map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Service Type</label>
              <select value={addForm.frequency} onChange={setAdd('frequency')} className="text-sm border border-gray-300 rounded px-2 py-1.5 w-full bg-white">
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-Weekly</option>
                <option value="onetime">One-Time</option>
                <option value="deodorizing_only">Deodorizing Only</option>
              </select>
            </div>
            {isAddRecurring ? (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Service Day</label>
                <select value={addForm.schedule_day} onChange={setAdd('schedule_day')} className="text-sm border border-gray-300 rounded px-2 py-1.5 w-full bg-white">
                  <option value="">Unscheduled</option>
                  {DAYS.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                </select>
              </div>
            ) : (
              <EditField label="Appointment Date" value={addForm.start_date} onChange={setAdd('start_date')} type="date" />
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 items-end">
            <EditField label="Monthly Rate ($)" value={addForm.monthly_rate} onChange={setAdd('monthly_rate')} type="number" />
            <label className="flex items-center gap-2 pb-1.5 cursor-pointer">
              <input type="checkbox" checked={addForm.deodorizing} onChange={setAdd('deodorizing')} className="w-4 h-4 rounded border-gray-300 text-brand-green" />
              <span className="text-sm font-semibold text-gray-700">Deodorizing</span>
            </label>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
            <textarea value={addForm.notes} onChange={setAdd('notes')} rows={2}
              className="text-sm border border-gray-300 rounded px-2 py-1.5 w-full resize-none"
              placeholder="Gate code, dog names, instructions..." />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={addSaving || !addForm.first_name || !addForm.last_name || !addForm.phone || !addForm.address}
              className="text-xs font-bold uppercase bg-brand-green text-white px-4 py-2 rounded-lg disabled:opacity-40">
              {addSaving ? 'Saving...' : 'Save Customer'}
            </button>
            <button type="button" onClick={() => { setShowAdd(false); setAddForm(BLANK_CUSTOMER); }}
              className="text-xs font-bold uppercase bg-gray-300 text-gray-700 px-3 py-2 rounded-lg">
              Cancel
            </button>
          </div>
        </form>
      )}

      {customers.length === 0 && !showAdd ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <p className="text-gray-400">No customers yet. Approve a lead or add one manually above.</p>
        </div>
      ) : filtered.length === 0 && search ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-400">No customers match &ldquo;{search}&rdquo;</p>
        </div>
      ) : (
        <>
          {recurring.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-heading text-sm uppercase tracking-widest text-gray-500">Recurring Customers ({recurring.length})</h3>
              {recurring.map((c) => <CustomerCard key={c.id} c={c} editingCustomer={editingCustomer} setEditingCustomer={setEditingCustomer} onSaveCustomer={onSaveCustomer} onDeleteCustomer={onDeleteCustomer} onPause={onPauseCustomer} onResume={onResumeCustomer} onUpdatePayment={onUpdatePayment} />)}
            </div>
          )}
          {onetimes.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-heading text-sm uppercase tracking-widest text-gray-500">Upcoming One-Time Appointments ({onetimes.length})</h3>
              {onetimes.map((c) => <CustomerCard key={c.id} c={c} editingCustomer={editingCustomer} setEditingCustomer={setEditingCustomer} onSaveCustomer={onSaveCustomer} onDeleteCustomer={onDeleteCustomer} onPause={onPauseCustomer} onResume={onResumeCustomer} onUpdatePayment={onUpdatePayment} showDate />)}
            </div>
          )}
          {pastOnetimes.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-heading text-sm uppercase tracking-widest text-gray-400">Past One-Time Appointments ({pastOnetimes.length})</h3>
              {pastOnetimes.map((c) => <CustomerCard key={c.id} c={c} editingCustomer={editingCustomer} setEditingCustomer={setEditingCustomer} onSaveCustomer={onSaveCustomer} onDeleteCustomer={onDeleteCustomer} onPause={onPauseCustomer} onResume={onResumeCustomer} onUpdatePayment={onUpdatePayment} showDate past />)}
            </div>
          )}
          {(() => {
            const paused = filtered.filter((c) => !c.is_active && c.payment_status !== 'removed');
            return paused.length > 0 ? (
              <div className="space-y-3">
                <h3 className="font-heading text-sm uppercase tracking-widest text-gray-500">Paused ({paused.length})</h3>
                {paused.map((c) => <CustomerCard key={c.id} c={c} editingCustomer={editingCustomer} setEditingCustomer={setEditingCustomer} onSaveCustomer={onSaveCustomer} onDeleteCustomer={onDeleteCustomer} onPause={onPauseCustomer} onResume={onResumeCustomer} onUpdatePayment={onUpdatePayment} />)}
              </div>
            ) : null;
          })()}
        </>
      )}
    </div>
  );
}

const PAYMENT_STYLES = {
  paid:    { label: 'Paid',    cls: 'bg-green-100 text-green-700' },
  unpaid:  { label: 'Unpaid',  cls: 'bg-red-100 text-red-700' },
  overdue: { label: 'Overdue', cls: 'bg-orange-100 text-orange-700' },
  pending: { label: 'Pending', cls: 'bg-gray-100 text-gray-500' },
};
const PAYMENT_CYCLE = ['pending', 'paid', 'unpaid', 'overdue'];

function CustomerCard({ c, editingCustomer, setEditingCustomer, onSaveCustomer, onDeleteCustomer, onPause, onResume, onUpdatePayment, showDate = false, past = false }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmPause, setConfirmPause] = useState(false);
  const isEditing = editingCustomer?.id === c.id;
  const ec = editingCustomer;
  const set = (field) => (e) => setEditingCustomer((p) => ({ ...p, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const openEdit = () => setEditingCustomer({
    id: c.id,
    first_name: c.first_name,
    last_name: c.last_name,
    phone: c.phone,
    email: c.email || '',
    address: c.address,
    dogs: String(c.dogs || 1),
    yard_size: c.yard_size || 'small',
    frequency: c.frequency || 'weekly',
    deodorizing: c.deodorizing || false,
    schedule_day: c.schedule_day || '',
    start_date: c.start_date || '',
    monthly_rate: String(c.monthly_rate || c.quoted_monthly || ''),
    notes: c.notes || '',
  });

  const isRecurring = (ec?.frequency || c.frequency) !== 'onetime' && (ec?.frequency || c.frequency) !== 'deodorizing_only';

  return (
    <div className={`bg-white rounded-xl border p-4 ${past ? 'border-gray-100 opacity-70' : 'border-gray-200'}`}>
      {/* Card header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-gray-900">{c.first_name} {c.last_name}</h3>
            {past
              ? <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 uppercase">Completed</span>
              : c.is_active
                ? <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 uppercase">Active</span>
                : <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 uppercase">Paused</span>
            }
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 uppercase">{c.frequency}</span>
            {/* Payment status badge — click to cycle */}
            {c.is_active && c.frequency !== 'onetime' && c.frequency !== 'deodorizing_only' && (
              <button
                onClick={() => {
                  const cur = c.payment_status || 'pending';
                  const next = PAYMENT_CYCLE[(PAYMENT_CYCLE.indexOf(cur) + 1) % PAYMENT_CYCLE.length];
                  onUpdatePayment(c.id, next);
                }}
                className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase cursor-pointer hover:opacity-80 transition-opacity ${(PAYMENT_STYLES[c.payment_status] || PAYMENT_STYLES.pending).cls}`}
                title="Click to change payment status"
              >
                {(PAYMENT_STYLES[c.payment_status] || PAYMENT_STYLES.pending).label}
              </button>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{c.address}</p>
          <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
            <span><span className="font-semibold text-gray-700">{c.dogs || 1}</span> dog{(c.dogs || 1) !== 1 ? 's' : ''}</span>
            <span className="capitalize">{c.yard_size} yard</span>
            {c.deodorizing && <span className="text-brand-green font-semibold">+ Deodorizing</span>}
            {!showDate && c.schedule_day && <span className="capitalize font-semibold text-brand-green">{c.schedule_day}s</span>}
            {!showDate && !c.schedule_day && c.frequency !== 'onetime' && c.frequency !== 'deodorizing_only' && <span className="text-amber-600 font-semibold">⚠ Unscheduled</span>}
            {showDate && c.start_date && <span className="font-semibold text-blue-600">Appt: {new Date(c.start_date + 'T12:00:00').toLocaleDateString()}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <p className="font-heading font-bold text-brand-red">${c.monthly_rate || c.quoted_monthly}/mo</p>
          <button
            onClick={() => isEditing ? setEditingCustomer(null) : openEdit()}
            className="text-gray-400 hover:text-gray-700 transition-colors p-1"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Notes alert */}
      {c.notes && !isEditing && (
        <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-2 text-xs text-amber-800">
          <span className="font-bold">Notes:</span> {c.notes}
        </div>
      )}

      {/* Full edit form */}
      {isEditing && (
        <div className="border border-gray-200 rounded-lg p-4 mt-3 bg-gray-50 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Edit Customer</p>

          <div className="grid grid-cols-2 gap-2">
            <EditField label="First Name" value={ec.first_name} onChange={set('first_name')} />
            <EditField label="Last Name" value={ec.last_name} onChange={set('last_name')} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <EditField label="Phone" value={ec.phone} onChange={set('phone')} type="tel" />
            <EditField label="Email" value={ec.email} onChange={set('email')} type="email" />
          </div>
          <EditField label="Address" value={ec.address} onChange={set('address')} />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Dogs</label>
              <select value={ec.dogs} onChange={set('dogs')} className="text-sm border border-gray-300 rounded px-2 py-1.5 w-full bg-white">
                {['1','2','3','4','5'].map((n) => <option key={n} value={n}>{n} dog{n !== '1' ? 's' : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Yard Size</label>
              <select value={ec.yard_size} onChange={set('yard_size')} className="text-sm border border-gray-300 rounded px-2 py-1.5 w-full bg-white">
                {['small','medium','large','xl'].map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Service Type</label>
              <select value={ec.frequency} onChange={set('frequency')} className="text-sm border border-gray-300 rounded px-2 py-1.5 w-full bg-white">
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-Weekly</option>
                <option value="onetime">One-Time</option>
                <option value="deodorizing_only">Deodorizing Only</option>
              </select>
            </div>
            {isRecurring ? (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Service Day</label>
                <select value={ec.schedule_day} onChange={set('schedule_day')} className="text-sm border border-gray-300 rounded px-2 py-1.5 w-full bg-white">
                  <option value="">Unscheduled</option>
                  {DAYS.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Appointment Date</label>
                <input
                  type="date"
                  value={ec.start_date}
                  onChange={set('start_date')}
                  className="text-sm border border-gray-300 rounded px-2 py-1.5 w-full"
                />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 items-end">
            <EditField label="Monthly Rate ($)" value={ec.monthly_rate} onChange={set('monthly_rate')} type="number" />
            <label className="flex items-center gap-2 pb-1.5 cursor-pointer">
              <input type="checkbox" checked={ec.deodorizing} onChange={set('deodorizing')} className="w-4 h-4 rounded border-gray-300 text-brand-green" />
              <span className="text-sm font-semibold text-gray-700">Deodorizing</span>
            </label>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
            <textarea
              value={ec.notes}
              onChange={set('notes')}
              rows={2}
              className="text-sm border border-gray-300 rounded px-2 py-1.5 w-full resize-none"
              placeholder="Gate code, dog names/behavior, instructions..."
            />
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="flex gap-2">
              <button onClick={() => onSaveCustomer(c.id)} className="text-xs font-bold uppercase bg-brand-green text-white px-4 py-1.5 rounded-lg">Save Changes</button>
              <button onClick={() => setEditingCustomer(null)} className="text-xs font-bold uppercase bg-gray-300 text-gray-700 px-3 py-1.5 rounded-lg">Cancel</button>
            </div>
            <button onClick={() => setConfirmDelete(true)} className="text-xs font-bold uppercase text-red-500 hover:text-red-700 transition-colors">
              Remove Customer
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="mt-3 border border-red-200 bg-red-50 rounded-lg px-3 py-2.5 flex items-center justify-between gap-3">
          <p className="text-xs text-red-700 font-semibold">Remove {c.first_name} {c.last_name} as a customer?</p>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => { onDeleteCustomer(c.id); setConfirmDelete(false); }}
              className="text-xs font-bold uppercase bg-red-600 text-white px-3 py-1.5 rounded-lg"
            >
              Remove
            </button>
            <button onClick={() => setConfirmDelete(false)} className="text-xs font-bold uppercase bg-gray-300 text-gray-700 px-3 py-1.5 rounded-lg">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmPause && (
        <div className="mt-3 border border-yellow-200 bg-yellow-50 rounded-lg px-3 py-2.5 flex items-center justify-between gap-3">
          <p className="text-xs text-yellow-800 font-semibold">Pause {c.first_name}? They&apos;ll be hidden from Today &amp; Schedule but not deleted.</p>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => { onPause(c.id); setConfirmPause(false); }} className="text-xs font-bold uppercase bg-yellow-500 text-white px-3 py-1.5 rounded-lg">Pause</button>
            <button onClick={() => setConfirmPause(false)} className="text-xs font-bold uppercase bg-gray-300 text-gray-700 px-3 py-1.5 rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!isEditing && !confirmPause && (
        <div className="flex flex-wrap gap-2 mt-3">
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
          {c.is_active
            ? <button onClick={() => setConfirmPause(true)} className="text-xs font-bold uppercase bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-lg hover:bg-yellow-200 transition-colors ml-auto">Pause</button>
            : <button onClick={() => onResume(c.id)} className="text-xs font-bold uppercase bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 transition-colors ml-auto">Resume</button>
          }
        </div>
      )}
    </div>
  );
}

function EditField({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="text-sm border border-gray-300 rounded px-2 py-1.5 w-full"
      />
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

// ─── FOLLOW-UP TAB ───────────────────────────────────────────────────────────

const FOLLOWUP_SEQUENCE = [
  { days: 2,   label: 'Day 2',    msg: (n) => `Hey ${n}! It's Travis with Red Top Scoopers 🐾 Just wanted to follow up and see if you had any questions about our service. We'd love to get your yard looking great — no contracts, cancel anytime. Let me know!` },
  { days: 4,   label: 'Day 4',    msg: (n) => `Hey ${n}! Travis from Red Top Scoopers again 🐾 Still thinking it over? Totally understand! We make it super easy — just say the word and we'll get you on the schedule. Happy to answer any questions!` },
  { days: 7,   label: 'Week 1',   msg: (n) => `Hi ${n}! Travis here from Red Top Scoopers 🐾 It's been about a week — just reaching out one more time. We're taking new customers in your area and would love to add you to the family!` },
  { days: 14,  label: 'Week 2',   msg: (n) => `Hey ${n}! Travis with Red Top Scoopers 🐾 Hope things are great! Spring is the perfect time to get a fresh start in the yard. We've got great availability right now — would love to get you scheduled!` },
  { days: 30,  label: '1 Month',  msg: (n) => `Hey ${n}! Travis from Red Top Scoopers here 🐾 Just checking in — it's been about a month. No pressure at all, just want you to know we're still here if you ever need us. Weekly, bi-weekly, and one-time cleanups available!` },
  { days: 60,  label: '2 Months', msg: (n) => `Hi ${n}! Travis with Red Top Scoopers 🐾 Hope you've been well! If things have changed and you'd like to try our service, we'd love to take care of your yard. Reach out anytime — no pressure!` },
  { days: 90,  label: '3 Months', msg: (n) => `Hey ${n}! Travis from Red Top Scoopers 🐾 Checking in after a few months — we have great scheduling availability and would love to have you as a customer. No contracts, easy cancel. Let me know if you're interested!` },
  { days: 180, label: '6 Months', msg: (n) => `Hi ${n}! Travis with Red Top Scoopers 🐾 It's been a while — just one final note. If you ever need pet waste cleanup, we're always here. No contracts, we work around your schedule. Would love to help anytime!` },
];

function FollowUpLeadCard({ lead, onReopen, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const storageKey = `rts_followup_${lead.id}`;
  const [sentSteps, setSentSteps] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(storageKey) || '[]')); }
    catch { return new Set(); }
  });

  const markSent = (i) => setSentSteps((prev) => {
    const next = new Set([...prev, i]);
    try { localStorage.setItem(storageKey, JSON.stringify([...next])); } catch {}
    return next;
  });

  const declinedAt = lead.updated_at ? new Date(lead.updated_at) : new Date();
  const daysElapsed = Math.floor((Date.now() - declinedAt.getTime()) / (1000 * 60 * 60 * 24));

  const sep = typeof window !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent) ? '&' : '?';

  // Find the current "active" step — most recent due step not yet sent
  const activeStep = [...FOLLOWUP_SEQUENCE].reverse().find((s, ri) => {
    const i = FOLLOWUP_SEQUENCE.length - 1 - ri;
    return daysElapsed >= s.days && !sentSteps.has(i);
  });
  const activeIndex = activeStep ? FOLLOWUP_SEQUENCE.indexOf(activeStep) : -1;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-gray-900">{lead.first_name} {lead.last_name}</h3>
            <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-700">Declined</span>
            {(lead.frequency === 'onetime' || lead.frequency === 'deodorizing_only') && (
              <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">One-Time</span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{lead.address}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {lead.frequency} · {lead.dogs || 1} dog{(lead.dogs || 1) !== 1 ? 's' : ''} · {lead.yard_size} yard
            {lead.heard_about ? ` · via ${lead.heard_about}` : ''}
            {' · '}<span className="font-semibold text-gray-500">Day {daysElapsed} since declined</span>
          </p>
        </div>
        <p className="font-heading font-bold text-gray-400 text-sm flex-shrink-0 ml-2">
          ${lead.quoted_monthly}{lead.frequency !== 'onetime' ? '/mo' : ' flat'}
        </p>
      </div>

      {lead.notes && (
        <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-3 text-xs text-amber-800">
          <span className="font-bold">Notes:</span> {lead.notes}
        </div>
      )}

      {/* Follow-up sequence timeline */}
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Follow-Up Sequence</p>
        <div className="space-y-1.5">
          {FOLLOWUP_SEQUENCE.map((step, i) => {
            const isDue = daysElapsed >= step.days;
            const isSent = sentSteps.has(i);
            const isActive = i === activeIndex;
            const smsLink = `sms:${lead.phone}${sep}body=${encodeURIComponent(step.msg(lead.first_name))}`;

            return (
              <div
                key={i}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-all ${
                  isSent
                    ? 'bg-green-50 border-green-200 opacity-60'
                    : isActive
                    ? 'bg-blue-50 border-blue-300 shadow-sm'
                    : isDue
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-gray-50 border-gray-100'
                }`}
              >
                {/* Status icon */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  isSent ? 'bg-green-500 text-white' :
                  isActive ? 'bg-blue-500 text-white' :
                  isDue ? 'bg-amber-400 text-white' :
                  'bg-gray-200 text-gray-400'
                }`}>
                  {isSent ? '✓' : i + 1}
                </div>

                {/* Label */}
                <div className="flex-1 min-w-0">
                  <span className={`text-xs font-bold ${
                    isSent ? 'text-green-700' :
                    isActive ? 'text-blue-700' :
                    isDue ? 'text-amber-700' :
                    'text-gray-400'
                  }`}>
                    {step.label}
                    {isActive && <span className="ml-1 text-blue-500">← Due now</span>}
                    {isSent && <span className="ml-1 font-normal text-green-600">Sent</span>}
                    {!isDue && !isSent && <span className="ml-1 font-normal text-gray-400">(in {step.days - daysElapsed}d)</span>}
                  </span>
                </div>

                {/* Action buttons */}
                {!isSent && isDue && (
                  <div className="flex gap-1.5 flex-shrink-0">
                    <a
                      href={smsLink}
                      className={`text-xs font-bold uppercase px-2.5 py-1 rounded-lg text-white transition-colors ${
                        isActive ? 'bg-blue-500 hover:bg-blue-600' : 'bg-amber-500 hover:bg-amber-600'
                      }`}
                    >
                      Send Text
                    </a>
                    <button
                      onClick={() => markSent(i)}
                      className="text-xs font-bold uppercase px-2 py-1 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                    >
                      ✓
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action buttons */}
      {confirmDelete ? (
        <div className="border border-red-200 bg-red-50 rounded-lg px-3 py-2.5 flex items-center justify-between gap-3">
          <p className="text-xs text-red-700 font-semibold">Permanently delete this lead?</p>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => onDelete(lead.id)} className="text-xs font-bold uppercase bg-red-600 text-white px-3 py-1.5 rounded-lg">Delete</button>
            <button onClick={() => setConfirmDelete(false)} className="text-xs font-bold uppercase bg-gray-300 text-gray-700 px-3 py-1.5 rounded-lg">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <a href={`tel:${lead.phone}`} className="text-xs font-bold uppercase bg-brand-green text-white px-3 py-1.5 rounded-lg hover:bg-brand-green-light transition-colors">Call</a>
          <a href={`sms:${lead.phone}`} className="text-xs font-bold uppercase bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-colors">Text</a>
          <button onClick={() => onReopen(lead.id)} className="text-xs font-bold uppercase bg-yellow-500 text-white px-3 py-1.5 rounded-lg hover:bg-yellow-600 transition-colors">
            Re-open Lead
          </button>
          <button onClick={() => setConfirmDelete(true)} className="text-xs font-bold uppercase bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors ml-auto">
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function FollowUpTab({ leads, onReopen, onDelete }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-xl font-bold text-gray-900">Follow-Up</h2>
        <p className="text-sm text-gray-500 mt-0.5">Declined leads — work the sequence to win them back.</p>
      </div>

      {leads.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <p className="text-gray-400">No declined leads. Good work.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <FollowUpLeadCard key={lead.id} lead={lead} onReopen={onReopen} onDelete={onDelete} />
          ))}
        </div>
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
  const { total, activeLeads, declinedLeads: declinedCount, sourceCounts, approvalRate, monthlyRevenue, onetimeRevenue, totalDogs, activeCount, pausedCount } = analytics;

  const sourceEntries = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]);
  const maxSource = sourceEntries.length > 0 ? sourceEntries[0][1] : 1;

  const funnel = [
    { label: 'All-Time Leads', count: total, color: 'bg-gray-400' },
    { label: 'Active Customers', count: activeCount, color: 'bg-green-500' },
    { label: 'Open Leads', count: activeLeads, color: 'bg-yellow-400' },
    { label: 'Declined', count: declinedCount, color: 'bg-red-400' },
  ];

  const avgRevenue = activeCount > 0 ? Math.round(monthlyRevenue / activeCount) : 0;

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-bold text-gray-900">Analytics</h2>

      {/* Key stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'All-Time Leads', value: total, sub: 'Total inquiries' },
          { label: 'Active Customers', value: activeCount, sub: pausedCount > 0 ? `${pausedCount} paused` : 'No paused' },
          { label: 'Monthly Revenue', value: `$${monthlyRevenue}`, sub: `Avg $${avgRevenue}/customer` },
          { label: 'Total Dogs', value: totalDogs, sub: 'Active customers' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="font-heading text-3xl font-bold text-brand-red mb-1">{s.value}</p>
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">{s.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-heading text-base font-bold text-gray-900 mb-4 uppercase tracking-wider">Revenue Breakdown</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="font-heading text-2xl font-bold text-brand-green">${monthlyRevenue}</p>
            <p className="text-xs text-gray-500 mt-0.5">Recurring / Month</p>
          </div>
          <div>
            <p className="font-heading text-2xl font-bold text-blue-500">${onetimeRevenue}</p>
            <p className="text-xs text-gray-500 mt-0.5">One-Time Jobs</p>
          </div>
          <div>
            <p className="font-heading text-2xl font-bold text-gray-900">${monthlyRevenue + onetimeRevenue}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total All Sources</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-1 text-xs text-gray-400">
          <span className="font-semibold text-gray-600">Close Rate:</span>
          <span>{approvalRate}%</span>
          <span className="ml-2 font-semibold text-gray-600">Active Customers:</span>
          <span>{activeCount}</span>
        </div>
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
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
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
          <h3 className="font-heading text-base font-bold text-gray-900 mb-4 uppercase tracking-wider">Pipeline Overview</h3>
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
            const count = customers.filter((c) => c.is_active && c.schedule_day === day && c.frequency !== 'onetime' && c.frequency !== 'deodorizing_only').length;
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
