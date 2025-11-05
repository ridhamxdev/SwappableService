import { useEffect, useState } from 'react';
import api from '../api/client';

type Event = {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
};

type SwapRequest = {
  id: number;
  status: 'PENDING'|'REJECTED'|'ACCEPTED';
  mySlot: Event;
  theirSlot: Event;
};

export default function Requests() {
  const [incoming, setIncoming] = useState<SwapRequest[]>([]);
  const [outgoing, setOutgoing] = useState<SwapRequest[]>([]);

  async function load() {
    const { data } = await api.get('/requests');
    setIncoming(data.incoming);
    setOutgoing(data.outgoing);
  }
  useEffect(()=>{ load(); },[]);

  async function respond(id: number, accept: boolean) {
    await api.post(`/swap-response/${id}`, { accept });
    load();
  }

  return (
    <div style={{ display:'grid', gap:16 }}>
      <section>
        <h3>Incoming Requests</h3>
        <ul style={{ display:'grid', gap:8 }}>
          {incoming.map(r => (
            <li key={r.id} style={{ border:'1px solid #ddd', padding:8, borderRadius:6 }}>
              Offer: <b>{r.theirSlot.title}</b> for your <b>{r.mySlot.title}</b> — <i>{r.status}</i>
              {r.status === 'PENDING' && (
                <div style={{ marginTop:8, display:'flex', gap:8 }}>
                  <button onClick={()=>respond(r.id, true)}>Accept</button>
                  <button onClick={()=>respond(r.id, false)}>Reject</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3>Outgoing Requests</h3>
        <ul style={{ display:'grid', gap:8 }}>
          {outgoing.map(r => (
            <li key={r.id} style={{ border:'1px solid #ddd', padding:8, borderRadius:6 }}>
              You offered <b>{r.mySlot.title}</b> for <b>{r.theirSlot.title}</b> — <i>{r.status}</i>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
