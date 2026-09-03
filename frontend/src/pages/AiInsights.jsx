import { useState } from 'react';
import { Sparkles, RefreshCw, AlertTriangle, PackageSearch, DollarSign, Timer, Trash2 } from 'lucide-react';
import api from '../api/client';

function Section({ title, icon: Icon, onRun, loading, children }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-brand-600" />
          <h2 className="font-semibold text-ink-700">{title}</h2>
        </div>
        <button className="btn-secondary" onClick={onRun} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> {loading ? 'Analyzing…' : 'Run AI'}
        </button>
      </div>
      {children}
    </div>
  );
}

const riskColor = { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-green-100 text-green-700' };

export default function AiInsights() {
  const [shortages, setShortages] = useState(null);
  const [reorders, setReorders] = useState(null);
  const [waste, setWaste] = useState(null);
  const [loading, setLoading] = useState({});

  const run = async (key, fn) => {
    setLoading((p) => ({ ...p, [key]: true }));
    try {
      await fn();
    } catch (err) {
      alert(err.response?.data?.error || 'AI request failed');
    } finally {
      setLoading((p) => ({ ...p, [key]: false }));
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-brand-600" />
        <div>
          <h1 className="text-xl font-bold text-ink-800">AI Insights</h1>
          <p className="text-sm text-ink-500">AI-powered predictions across inventory, pricing and waste, backed by Claude.</p>
        </div>
      </div>

      <Section title="Predict Ingredient Shortages" icon={AlertTriangle} loading={loading.shortages}
        onRun={() => run('shortages', async () => { const { data } = await api.get('/ai/predict-shortages'); setShortages(data.predictions); })}>
        {!shortages && <p className="text-sm text-ink-400">Run AI to forecast which ingredients may run out this week.</p>}
        {shortages && (
          <div className="space-y-2">
            {shortages.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-3 py-2 bg-ink-50 rounded-lg text-sm">
                <div>
                  <span className="font-medium text-ink-700">{p.name}</span>
                  <p className="text-xs text-ink-400">{p.reasoning}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <span className={`badge ${riskColor[p.risk] || 'bg-ink-100'}`}>{p.risk}</span>
                  <p className="text-xs text-ink-400 mt-1">{p.days_until_stockout}d left</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Recommend Stock Reorder Quantities" icon={PackageSearch} loading={loading.reorders}
        onRun={() => run('reorders', async () => { const { data } = await api.get('/ai/reorder-recommendations'); setReorders(data.recommendations); })}>
        {!reorders && <p className="text-sm text-ink-400">Run AI to get suggested reorder quantities for low-stock products.</p>}
        {reorders && reorders.length === 0 && <p className="text-sm text-ink-400">Nothing needs reordering right now.</p>}
        {reorders && reorders.length > 0 && (
          <div className="space-y-2">
            {reorders.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-3 py-2 bg-ink-50 rounded-lg text-sm">
                <div>
                  <span className="font-medium text-ink-700">{r.name}</span>
                  <p className="text-xs text-ink-400">{r.justification}</p>
                </div>
                <span className="font-semibold text-brand-600">{r.recommended_order_qty} {r.unit}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Analyze Ingredient Waste" icon={Trash2} loading={loading.waste}
        onRun={() => run('waste', async () => { const { data } = await api.get('/ai/waste-analysis'); setWaste(data); })}>
        {!waste && <p className="text-sm text-ink-400">Run AI to analyze 30-day stock-out patterns for waste.</p>}
        {waste && (
          <div className="space-y-3 text-sm">
            <p className="text-ink-700">Estimated waste rate: <span className="font-semibold text-red-600">{waste.waste_pct_estimate}%</span></p>
            {waste.top_waste_items?.length > 0 && (
              <div className="space-y-1">
                {waste.top_waste_items.map((w, i) => (
                  <div key={i} className="flex justify-between px-3 py-1.5 bg-ink-50 rounded-lg">
                    <span>{w.name}</span><span className="text-ink-500">{w.total_out} — {w.likely_reason}</span>
                  </div>
                ))}
              </div>
            )}
            <ul className="list-disc list-inside text-ink-600 space-y-1">
              {waste.recommendations?.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}
      </Section>

      <MenuPricingCard />
      <PrepTimeCard />
    </div>
  );
}

function MenuPricingCard() {
  const [menuItemId, setMenuItemId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!menuItemId) return alert('Paste a menu item ID (copy from the Menu Management table row).');
    setLoading(true);
    try {
      const { data } = await api.post('/ai/menu-pricing', { menu_item_id: menuItemId });
      setResult(data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    } finally { setLoading(false); }
  };

  return (
    <Section title="Suggest Menu Pricing" icon={DollarSign} loading={loading} onRun={run}>
      <input className="input mb-3" placeholder="Menu item ID" value={menuItemId} onChange={(e) => setMenuItemId(e.target.value)} />
      {result && (
        <div className="text-sm space-y-1 bg-ink-50 p-3 rounded-lg">
          <p><strong>{result.item.name}</strong> — current price ₹{result.item.current_price}</p>
          <p>Suggested: <span className="font-semibold text-brand-600">₹{result.suggested_price}</span> (range ₹{result.min_price}–₹{result.max_price})</p>
          <p className="text-ink-500">{result.reasoning}</p>
        </div>
      )}
    </Section>
  );
}

function PrepTimeCard() {
  const [orderId, setOrderId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!orderId) return alert('Paste an order ID (copy from the Order Management table row).');
    setLoading(true);
    try {
      const { data } = await api.post('/ai/prep-time-estimate', { order_id: orderId });
      setResult(data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    } finally { setLoading(false); }
  };

  return (
    <Section title="Estimate Food Preparation Time" icon={Timer} loading={loading} onRun={run}>
      <input className="input mb-3" placeholder="Order ID" value={orderId} onChange={(e) => setOrderId(e.target.value)} />
      {result && (
        <div className="text-sm space-y-1 bg-ink-50 p-3 rounded-lg">
          <p>Estimated time: <span className="font-semibold text-brand-600">{result.estimated_minutes} minutes</span></p>
          <p>Bottleneck item: {result.bottleneck_item}</p>
          <p className="text-ink-500">{result.notes}</p>
        </div>
      )}
    </Section>
  );
}
