import { Pencil, Trash2, Search } from 'lucide-react';

const statusColors = {
  available: 'bg-green-100 text-green-700', occupied: 'bg-red-100 text-red-700',
  reserved: 'bg-amber-100 text-amber-700', cleaning: 'bg-ink-100 text-ink-600',
  open: 'bg-blue-100 text-blue-700', preparing: 'bg-amber-100 text-amber-700',
  served: 'bg-purple-100 text-purple-700', paid: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700', pending: 'bg-amber-100 text-amber-700',
  ordered: 'bg-blue-100 text-blue-700', received: 'bg-green-100 text-green-700',
  in: 'bg-green-100 text-green-700', out: 'bg-red-100 text-red-700',
};

function CellValue({ col, row }) {
  const val = row[col.key];
  if (col.badge) {
    return <span className={`badge ${statusColors[val] || 'bg-ink-100 text-ink-600'}`}>{val}</span>;
  }
  if (col.bool) {
    return val ? <span className="text-green-600 font-medium">Yes</span> : <span className="text-ink-400">No</span>;
  }
  if (col.money) {
    return <span>₹{parseFloat(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>;
  }
  if (val === null || val === undefined || val === '') return <span className="text-ink-300">—</span>;
  return <span>{String(val)}</span>;
}

export default function DataTable({
  columns, rows, onEdit, onDelete, canEdit, canDelete,
  search, onSearchChange, pagination, onPageChange, loading,
}) {
  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-ink-100 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            className="input pl-9"
            placeholder="Search..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        {loading && <span className="text-xs text-ink-400">Loading…</span>}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink-500 border-b border-ink-100 bg-ink-50">
              {columns.map((c) => (
                <th key={c.key} className="px-4 py-3 font-medium whitespace-nowrap">{c.label}</th>
              ))}
              {(canEdit || canDelete) && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={columns.length + 1} className="px-4 py-10 text-center text-ink-400">No records found.</td></tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-ink-50 hover:bg-ink-50/60 transition-colors">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3 whitespace-nowrap"><CellValue col={c} row={row} /></td>
                ))}
                {(canEdit || canDelete) && (
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-1">
                      {canEdit && (
                        <button onClick={() => onEdit(row)} className="p-1.5 rounded-lg hover:bg-ink-100 text-ink-500" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => onDelete(row)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="p-3 border-t border-ink-100 flex items-center justify-between text-sm text-ink-500">
          <span>Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</span>
          <div className="flex gap-2">
            <button className="btn-secondary" disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)}>Previous</button>
            <button className="btn-secondary" disabled={pagination.page >= pagination.totalPages} onClick={() => onPageChange(pagination.page + 1)}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
