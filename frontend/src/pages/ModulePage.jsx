import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import api from '../api/client';
import { findModule } from '../config/modules';
import DataTable from '../components/DataTable';
import RecordFormModal from '../components/RecordFormModal';
import { useAuth } from '../context/AuthContext';

export default function ModulePage() {
  const { moduleKey } = useParams();
  const module = findModule(moduleKey);
  const { hasRole } = useAuth();

  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const load = useCallback(async () => {
    if (!module) return;
    setLoading(true);
    try {
      const { data } = await api.get(module.endpoint, { params: { page, limit: 15, search: search || undefined } });
      setRows(data.data);
      setPagination(data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [module, page, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [moduleKey]);

  if (!module) return <div className="p-6">Module not found.</div>;

  const canCreate = !module.roles || hasRole(...module.roles);
  const canEdit = canCreate;
  const canDelete = canCreate;

  const handleDelete = async (row) => {
    if (!confirm(`Delete this ${module.label.toLowerCase()} record?`)) return;
    try {
      await api.delete(`${module.endpoint}/${row.id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-ink-800">{module.label}</h1>
          <p className="text-sm text-ink-500">Manage {module.label.toLowerCase()} records.</p>
        </div>
        {canCreate && (
          <button className="btn-primary" onClick={() => { setEditingRecord(null); setModalOpen(true); }}>
            <Plus className="w-4 h-4" /> New
          </button>
        )}
      </div>

      <DataTable
        columns={module.columns}
        rows={rows}
        loading={loading}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        pagination={pagination}
        onPageChange={setPage}
        canEdit={canEdit}
        canDelete={canDelete}
        onEdit={(row) => { setEditingRecord(row); setModalOpen(true); }}
        onDelete={handleDelete}
      />

      {modalOpen && (
        <RecordFormModal
          module={module}
          record={editingRecord}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); load(); }}
        />
      )}
    </div>
  );
}
