import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import api from '../api/client';

export default function RecordFormModal({ module, record, onClose, onSaved }) {
  const isEdit = Boolean(record?.id);
  const [form, setForm] = useState(() => {
    const initial = {};
    module.fields.forEach((f) => {
      initial[f.key] = record?.[f.key] ?? (f.type === 'checkbox' ? false : '');
    });
    return initial;
  });
  const [fkOptions, setFkOptions] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fkFields = module.fields.filter((f) => f.type === 'foreignKey');
    fkFields.forEach(async (f) => {
      try {
        const { data } = await api.get(f.fk.endpoint, { params: { limit: 200 } });
        setFkOptions((prev) => ({ ...prev, [f.key]: data.data || [] }));
      } catch {
        setFkOptions((prev) => ({ ...prev, [f.key]: [] }));
      }
    });
  }, [module]);

  const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = { ...form };
      Object.keys(payload).forEach((k) => {
        if (payload[k] === '') payload[k] = null;
      });
      if (isEdit) {
        await api.put(`${module.endpoint}/${record.id}`, payload);
      } else {
        await api.post(module.endpoint, payload);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save record');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-ink-950/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
          <h3 className="font-semibold text-ink-800">{isEdit ? `Edit ${module.label}` : `New ${module.label}`}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-ink-100"><X className="w-5 h-5 text-ink-500" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}

          {module.fields.map((f) => (
            <div key={f.key}>
              <label className="label">{f.label}{f.required && <span className="text-red-500"> *</span>}</label>

              {f.type === 'textarea' && (
                <textarea className="input" rows={3} value={form[f.key] || ''} required={f.required}
                  onChange={(e) => handleChange(f.key, e.target.value)} />
              )}

              {f.type === 'select' && (
                <select className="input" value={form[f.key] || ''} required={f.required}
                  onChange={(e) => handleChange(f.key, e.target.value)}>
                  <option value="">Select…</option>
                  {f.options.map((opt) => <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>)}
                </select>
              )}

              {f.type === 'foreignKey' && (
                <select className="input" value={form[f.key] || ''} required={f.required}
                  onChange={(e) => handleChange(f.key, e.target.value)}>
                  <option value="">Select…</option>
                  {(fkOptions[f.key] || []).map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt[f.fk.labelKey]}</option>
                  ))}
                </select>
              )}

              {f.type === 'checkbox' && (
                <input type="checkbox" className="w-4 h-4" checked={Boolean(form[f.key])}
                  onChange={(e) => handleChange(f.key, e.target.checked)} />
              )}

              {['text', 'number', 'date'].includes(f.type) && (
                <input
                  type={f.type}
                  step={f.step}
                  className="input"
                  value={form[f.key] ?? ''}
                  required={f.required}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                />
              )}
            </div>
          ))}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
