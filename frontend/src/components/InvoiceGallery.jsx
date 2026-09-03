import { useState, useEffect } from 'react';
import { Download, Trash2, Eye, Loader } from 'lucide-react';
import api from '../api/client';

export default function InvoiceGallery() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/invoices/gallery/previews');
      setInvoices(data.data || []);
    } catch (err) {
      console.error('Failed to fetch invoice gallery:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (invoiceId, cloudinaryId) => {
    if (!window.confirm('Delete this invoice from Cloudinary?')) return;

    try {
      setDeleting(invoiceId);
      await api.delete(`/invoices/${invoiceId}/cloudinary`);
      setInvoices(invoices.filter(inv => inv.id !== invoiceId));
      setSelectedInvoice(null);
    } catch (err) {
      alert('Failed to delete invoice: ' + err.message);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">📸 Invoice Gallery</h2>
        <p className="text-gray-600">Cloudinary-hosted invoice previews</p>
      </div>

      {invoices.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No invoices uploaded yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="relative group cursor-pointer"
              onClick={() => setSelectedInvoice(invoice)}
            >
              <div className="bg-gradient-to-br from-orange-100 to-red-100 rounded-lg overflow-hidden aspect-square shadow-md hover:shadow-lg transition">
                {invoice.thumbnail ? (
                  <img
                    src={invoice.thumbnail}
                    alt={invoice.file_name}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-200"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-4xl">📄</span>
                  </div>
                )}
              </div>

              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Eye className="w-6 h-6 text-white" />
              </div>

              <p className="text-xs text-gray-600 mt-2 truncate">{invoice.file_name}</p>
              <p className="text-xs text-gray-500">₹{parseFloat(invoice.total_amount).toLocaleString('en-IN', {maximumFractionDigits: 2})}</p>
            </div>
          ))}
        </div>
      )}

      {/* Invoice Preview Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-96 overflow-auto">
            <div className="sticky top-0 bg-gray-50 border-b p-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">{selectedInvoice.file_name}</h3>
              <div className="flex gap-2">
                <a
                  href={selectedInvoice.preview}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
                <button
                  onClick={() => handleDelete(selectedInvoice.id, selectedInvoice.cloudinary_id)}
                  disabled={deleting === selectedInvoice.id}
                  className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleting === selectedInvoice.id ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-3 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition text-sm"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-6">
              {selectedInvoice.preview && (
                <img
                  src={selectedInvoice.preview}
                  alt={selectedInvoice.file_name}
                  className="w-full rounded-lg"
                />
              )}

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Invoice Number</p>
                  <p className="font-semibold text-gray-900">{selectedInvoice.invoice_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Invoice Date</p>
                  <p className="font-semibold text-gray-900">
                    {selectedInvoice.invoice_date
                      ? new Date(selectedInvoice.invoice_date).toLocaleDateString('en-IN')
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Amount</p>
                  <p className="font-semibold text-gray-900 text-lg text-green-600">
                    ₹{parseFloat(selectedInvoice.total_amount).toLocaleString('en-IN', {maximumFractionDigits: 2})}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Status</p>
                  <p className={`font-semibold text-sm px-2 py-1 rounded-full inline-block ${
                    selectedInvoice.status === 'processed'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {selectedInvoice.status}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
