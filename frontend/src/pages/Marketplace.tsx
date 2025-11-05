import { useEffect, useState } from 'react';
import api from '../api/client';

type Event = {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  status: 'BUSY' | 'SWAPPABLE' | 'SWAP_PENDING';
  owner: { id: number; name: string; email: string };
};

export default function Marketplace() {
  const [their, setTheir] = useState<Event[]>([]);
  const [mine, setMine] = useState<Event[]>([]);
  const [offerFor, setOfferFor] = useState<number | null>(null);
  const [myChoice, setMyChoice] = useState<number | null>(null);

  async function load() {
    const s1 = await api.get('/swappable-slots');
    setTheir(s1.data);
    const s2 = await api.get('/events');
    setMine(s2.data.filter((e: any) => e.status === 'SWAPPABLE'));
  }
  useEffect(() => { load(); }, []);

  async function requestSwap() {
    if (!offerFor || !myChoice) return;
    await api.post('/swap-request', { mySlotId: myChoice, theirSlotId: offerFor });
    setOfferFor(null); setMyChoice(null);
    load();
  }

  return (
    <div>
      <h3>Marketplace</h3>
      <ul className="list">
        {their.map(e => (
          <li key={e.id} className="item">
            <b>{e.title}</b> by {e.owner.name} — {new Date(e.startTime).toLocaleString()}
            <button className="btn btn-muted right" onClick={() => setOfferFor(e.id)}>Request swap</button>
          </li>
        ))}
      </ul>


      {offerFor && (
        <div className="card mt-16">
          <div className="card-body form-guidance">
            <div className="form-head">
              <div>
                <h4 className="card-title">Propose a swap</h4>
                <p className="card-sub">Pick one of your swappable slots to offer.</p>
              </div>
              <div className="progress">
                <div className="dot active"></div>
                <div className="dot"></div>
              </div>
            </div>

            {mine.length === 0 ? (
              <div className="helper">
                You don’t have any <b>SWAPPABLE</b> slots yet. Go to <a href="/dashboard">Dashboard</a> and mark one.
              </div>
            ) : (
              <div className="field">
                <label className="label">Your offer</label>
                <select className="select" value={myChoice ?? ''} onChange={e => setMyChoice(parseInt(e.target.value, 10))}>
                  <option value="" disabled>Pick your slot</option>
                  {mine.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.title} — {new Date(m.startTime).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex mt-12">
              <button className="btn" onClick={requestSwap} disabled={!myChoice}>Send request</button>
              <button className="btn btn-outline" onClick={() => { setOfferFor(null); setMyChoice(null); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
