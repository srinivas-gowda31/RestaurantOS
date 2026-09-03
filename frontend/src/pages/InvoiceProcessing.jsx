import { useEffect, useState, useCallback, useRef } from 'react';
import { UploadCloud, FileDown, ScanLine, Eye, X, Trash2 } from 'lucide-react';
import api from '../api/client';
import InvoiceGallery from '../components/InvoiceGallery';

function StatusBadge({ status }) {
  const map = {
    processed: 'bg-green-100 text-green-700', failed: 'bg-red-100 text-red-700',
    processing: 'bg-amber-100 text-amber-700', reviewed: 'bg-blue-100 text-blue-700',
  };
  return <span className={`badge ${map[status] || 'bg-ink-100'}`}>{status}</span>;
}

export default function InvoiceProcessing() {
  const [invoices, setInvoices] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const load = useCallback(async () => {
    const { data } = await api.get('/invoices');
    setInvoices(data.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleFiles = async (files) => {
    if (!files.length) return;

    // Show preview of first file immediately
    if (files[0].type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(files[0]);
    }

    setUploading(true);
    try {
      let lastUploadedInvoice = null;
      for (const file of files) {
        const formData = new FormData();
        formData.append('invoice', file);
        const response = await api.post('/invoices/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        lastUploadedInvoice = response.data.invoice;
      }
      await load();
      setPreview(null); // Clear preview after successful upload
      // Auto-open the preview for the last uploaded invoice
      if (lastUploadedInvoice) {
        setTimeout(() => viewInvoice(lastUploadedInvoice), 300);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Upload/processing failed');
      setPreview(null); // Clear preview on error
    } finally {
      setUploading(false);
    }
  };

  const handleExport = () => {
    const token = localStorage.getItem('ros_token');
    const base = import.meta.env.VITE_API_BASE_URL || '/api';
    fetch(`${base}/invoices/export/excel`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'expense-register.xlsx';
        a.click();
      });
  };

  const viewInvoice = async (inv) => {
    const { data } = await api.get(`/invoices/${inv.id}`);
    setViewing(data);
  };

  const deleteInvoice = async (invId, fileName) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await api.delete(`/invoices/${invId}`);
      await load();
      alert('Invoice deleted successfully');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete invoice');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-brand-600" />
            <h1 className="text-xl font-bold text-ink-800">AI Invoice Processing</h1>
          </div>
          <p className="text-sm text-ink-500">Upload printed or handwritten supplier invoices — AI extracts the data automatically.</p>
        </div>
        <button className="btn-secondary" onClick={handleExport}><FileDown className="w-4 h-4" /> Export Expense Register (Excel)</button>
      </div>

      {/* Preview Section */}
      {preview && (
        <div className="card p-6 bg-blue-50 border-2 border-blue-200">
          <div className="flex items-start justify-between mb-4">
            <h3 className="font-semibold text-ink-800">Selected Invoice Preview</h3>
            <button onClick={() => setPreview(null)} className="text-ink-400 hover:text-ink-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <img src={preview} alt="Selected invoice" className="w-full max-h-80 object-contain rounded-lg border border-ink-200 mb-4" />
          <p className="text-sm text-ink-600 mb-3">Ready to upload? Click the button below to process this invoice.</p>
          <button className="btn-primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? 'Processing…' : '📤 Upload & Process'}
          </button>
        </div>
      )}

      <div
        className={`card p-10 flex flex-col items-center justify-center border-2 border-dashed transition-colors ${dragOver ? 'border-brand-500 bg-brand-50' : 'border-ink-200'}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(Array.from(e.dataTransfer.files)); }}
      >
        <UploadCloud className="w-10 h-10 text-brand-500 mb-3" />
        <p className="text-ink-600 font-medium">Drag & drop invoices here (PDF, JPG, PNG)</p>
        <p className="text-ink-400 text-sm mb-4">Printed and handwritten invoices are both supported.</p>
        <button className="btn-primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? 'Processing…' : 'Choose Files'}
        </button>
        <input ref={fileInputRef} type="file" multiple hidden accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={(e) => handleFiles(Array.from(e.target.files))} />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink-500 border-b border-ink-100 bg-ink-50">
              <th className="px-4 py-3">File</th>
              <th className="px-4 py-3">Invoice #</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-ink-400">No invoices processed yet.</td></tr>}
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-b border-ink-50 hover:bg-ink-50/60">
                <td className="px-4 py-3">{inv.file_name}</td>
                <td className="px-4 py-3">{inv.invoice_number || '—'}</td>
                <td className="px-4 py-3">{inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString('en-IN') : '—'}</td>
                <td className="px-4 py-3">{inv.supplier_name_matched || '—'}</td>
                <td className="px-4 py-3">{inv.total_amount ? `₹${parseFloat(inv.total_amount).toLocaleString('en-IN')}` : '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                <td className="px-4 py-3 text-right">
                  <button className="p-1.5 rounded-lg hover:bg-ink-100 text-ink-500" onClick={() => viewInvoice(inv)} title="View details"><Eye className="w-4 h-4" /></button>
                  <button className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 ml-1" onClick={() => deleteInvoice(inv.id, inv.file_name)} title="Delete invoice"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewing && (
        <div className="fixed inset-0 bg-ink-950/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
              <h3 className="font-semibold text-ink-800">{viewing.invoice.file_name}</h3>
              <button onClick={() => setViewing(null)} className="p-1 rounded-lg hover:bg-ink-100"><X className="w-5 h-5 text-ink-500" /></button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              {/* Image Preview */}
              {viewing.invoice.cloudinary_url && (
                <div className="mb-4">
                  <p className="text-ink-400 mb-2 font-medium">Invoice Image</p>
                  <img
                    src={viewing.invoice.cloudinary_url}
                    alt="Invoice preview"
                    className="w-full max-h-64 object-contain rounded-lg border border-ink-200"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-ink-400">Supplier (Extracted)</p><p className="font-medium">{viewing.invoice.raw_extraction?.supplier_name || '—'}</p></div>
                <div><p className="text-ink-400">Supplier (Matched)</p><p className="font-medium">{viewing.invoice.supplier_name_matched || '—'}</p></div>
                <div><p className="text-ink-400">Invoice #</p><p className="font-medium">{viewing.invoice.raw_extraction?.invoice_number || viewing.invoice.invoice_number || '—'}</p></div>
                <div><p className="text-ink-400">Date</p><p className="font-medium">{viewing.invoice.raw_extraction?.invoice_date || viewing.invoice.invoice_date || '—'}</p></div>
                <div><p className="text-ink-400">Total Amount</p><p className="font-medium">₹{viewing.invoice.raw_extraction?.total_amount || viewing.invoice.total_amount || '—'}</p></div>
                <div><p className="text-ink-400">Confidence</p><p className="font-medium">{(viewing.invoice.raw_extraction?.confidence * 100).toFixed(0)}%</p></div>
                <div className="col-span-2"><p className="text-ink-400">Status</p><StatusBadge status={viewing.invoice.status} /></div>
              </div>
              {viewing.invoice.raw_extraction?.notes && (
                <div className="bg-amber-50 text-amber-700 px-3 py-2 rounded-lg text-xs">📌 {viewing.invoice.raw_extraction.notes}</div>
              )}
              <div>
                <p className="font-medium text-ink-700 mb-2">Line Items</p>
                <table className="w-full text-xs border border-ink-100 rounded-lg overflow-hidden">
                  <thead className="bg-ink-50"><tr><th className="p-2 text-left">Description</th><th className="p-2 text-right">Qty</th><th className="p-2 text-right">Unit Price</th><th className="p-2 text-right">Total</th></tr></thead>
                  <tbody>
                    {viewing.line_items.map((li) => (
                      <tr key={li.id} className="border-t border-ink-50">
                        <td className="p-2">{li.description}</td>
                        <td className="p-2 text-right">{li.quantity}</td>
                        <td className="p-2 text-right">{li.unit_price}</td>
                        <td className="p-2 text-right">{li.line_total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Gallery with Cloudinary Previews */}
      <div className="border-t border-ink-200 pt-8">
        <InvoiceGallery />
      </div>
    </div>
  );
}
