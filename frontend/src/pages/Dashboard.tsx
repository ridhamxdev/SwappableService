import { useEffect, useState } from 'react';
import api from '../api/client';

type Event = {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  status: 'BUSY' | 'SWAPPABLE' | 'SWAP_PENDING';
};

export default function Dashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    startTime: '',
    endTime: '',
    status: 'BUSY' as Event['status'],
  });

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get<Event[]>('/events');
      setEvents(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function createEvent() {
    try {
      if (!form.title.trim()) return alert('Please enter a title');
      const startISO = new Date(form.startTime).toISOString();
      const endISO = new Date(form.endTime).toISOString();
      await api.post('/events', {
        title: form.title.trim(),
        startTime: startISO,
        endTime: endISO,
        status: form.status === 'SWAPPABLE' ? 'SWAPPABLE' : 'BUSY',
      });
      setForm({ title: '', startTime: '', endTime: '', status: 'BUSY' });
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Failed to create event');
      console.error(err);
    }
  }

  async function toggleSwappable(e: Event) {
    if (e.status === 'SWAP_PENDING') return;
    const next = e.status === 'BUSY' ? 'SWAPPABLE' : 'BUSY';
    try {
      // status-only endpoint (no dates sent)
      await api.patch(`/events/${e.id}/status`, { status: next });
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Failed to update status');
    }
  }

  function fmt(dt: string) {
    return new Date(dt).toLocaleString();
  }

  return (
    <>
      {/* Create form */}
      <div className="card mt-16">
        <div className="card-body form-guidance">
          <div className="form-head">
            <div>
              <h3 className="card-title">Create event</h3>
              <p className="card-sub">Add a time slot. You can make it swappable later.</p>
            </div>
            <div className="progress">
              <span className="small">Step</span>
              <div className="dot active"></div>
              <div className="dot active"></div>
              <div className="dot"></div>
            </div>
          </div>

          <div className="helper">
            <b>Tip:</b> Use your local time. We’ll store it as ISO automatically.
          </div>

          <div className="field">
            <label className="label">Title</label>
            <input
              className="input"
              placeholder="e.g. Client stand-up"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label className="label">Start</label>
              <input
                type="datetime-local"
                className="input"
                value={form.startTime}
                onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
              />
              <div className="hint">Choose date and time</div>
            </div>
            <div className="field">
              <label className="label">End</label>
              <input
                type="datetime-local"
                className="input"
                value={form.endTime}
                onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
              />
            </div>
          </div>

          <div className="field">
            <label className="label">Status</label>
            <select
              className="select"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Event['status'] }))}
            >
              <option value="BUSY">Busy</option>
              <option value="SWAPPABLE">Swappable</option>
            </select>
          </div>

          <div className="flex mt-12">
            <button className="btn" onClick={createEvent}>Save slot</button>
            <button
              className="btn btn-outline"
              onClick={() => setForm({ title: '', startTime: '', endTime: '', status: 'BUSY' })}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Events list */}
      <div className="card mt-16">
        <div className="card-body">
          <h3 className="card-title">My events</h3>
          <p className="card-sub">Toggle Busy ⇄ Swappable. Pending swaps are locked.</p>

          {loading ? (
            <div className="small">Loading…</div>
          ) : events.length === 0 ? (
            <div className="helper">You have no events yet. Create one above.</div>
          ) : (
            <ul className="list">
              {events
                .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                .map((e) => (
                  <li key={e.id} className="item">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
                      <div>
                        <b>{e.title}</b>
                        <div className="small">
                          {fmt(e.startTime)} → {fmt(e.endTime)}
                        </div>
                        <div className="small">Status: {e.status}</div>
                      </div>
                      <div className="flex">
                        <button
                          className="btn btn-muted"
                          onClick={() => toggleSwappable(e)}
                          disabled={e.status === 'SWAP_PENDING'}
                          title={e.status === 'SWAP_PENDING' ? 'Swap request pending' : 'Toggle swappable'}
                        >
                          {e.status === 'SWAPPABLE' ? 'Make Busy' : 'Make Swappable'}
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
