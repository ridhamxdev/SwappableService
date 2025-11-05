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
  const [form, setForm] = useState({ title: '', startTime: '', endTime: '', status: 'BUSY' as Event['status'] });

  async function load() {
    const { data } = await api.get('/events');
    setEvents(data);
  }
  useEffect(() => { load(); }, []);

  async function createEvent() {
    const startISO = new Date(form.startTime).toISOString();
    const endISO = new Date(form.endTime).toISOString();
    await api.post('/events', { ...form, startTime: startISO, endTime: endISO });
    setForm({ title: '', startTime: '', endTime: '', status: 'BUSY' });
    load();
  }

  async function toggleSwappable(e: Event) {
    const next = e.status === 'BUSY' ? 'SWAPPABLE' : 'BUSY';
    await api.put(`/events/${e.id}`, { ...e, status: next });
    load();
  }

  return (
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
          <input className="input" placeholder="e.g. Client stand-up" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        </div>

        <div className="field-row">
          <div className="field">
            <label className="label">Start</label>
            <input type="datetime-local" className="input" value={form.startTime}
              onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
            <div className="hint">Choose date and time</div>
          </div>
          <div className="field">
            <label className="label">End</label>
            <input type="datetime-local" className="input" value={form.endTime}
              onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
          </div>
        </div>

        <div className="field">
          <label className="label">Status</label>
          <select className="select" value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}>
            <option value="BUSY">Busy</option>
            <option value="SWAPPABLE">Swappable</option>
          </select>
        </div>

        <div className="flex mt-12">
          <button className="btn" onClick={createEvent}>Save slot</button>
          <button className="btn btn-outline" onClick={() => setForm({ title: '', startTime: '', endTime: '', status: 'BUSY' })}>
            Reset
          </button>
        </div>
      </div>
    </div>

  );
}
