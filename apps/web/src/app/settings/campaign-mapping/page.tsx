'use client';

import { useEffect, useState } from 'react';
import { campaignMappingsApi } from '@/lib/api';
import { PROJECT_TYPES } from '@/lib/constants';
import type { CampaignMapping } from '@/lib/types';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function CampaignMappingPage() {
  const [mappings, setMappings] = useState<CampaignMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMapping, setEditingMapping] = useState<CampaignMapping | null>(null);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [formData, setFormData] = useState({
    contains_text: '',
    project_type_key: 'mamad',
    priority: 100,
  });

  useEffect(() => {
    loadMappings();
  }, []);

  async function loadMappings() {
    try {
      const data = await campaignMappingsApi.list();
      setMappings(data);
    } catch {
      setError('שגיאה בטעינת מיפויים');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({ contains_text: '', project_type_key: 'mamad', priority: 100 });
    setEditingMapping(null);
    setShowForm(false);
    setError('');
  }

  function startEdit(mapping: CampaignMapping) {
    setEditingMapping(mapping);
    setFormData({
      contains_text: mapping.contains_text,
      project_type_key: mapping.project_type_key,
      priority: mapping.priority,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    try {
      if (editingMapping) {
        await campaignMappingsApi.update(editingMapping.id, formData);
      } else {
        await campaignMappingsApi.create(formData);
      }
      resetForm();
      loadMappings();
    } catch (err: any) {
      setError(err.message || 'שגיאה בשמירת מיפוי');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('האם להשבית מיפוי זה?')) return;
    try {
      await campaignMappingsApi.delete(id);
      loadMappings();
    } catch (err: any) {
      setError(err.message || 'שגיאה במחיקת מיפוי');
    }
  }

  const getProjectLabel = (key: string) => PROJECT_TYPES.find((p) => p.key === key)?.label || key;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="מיפוי קמפיינים" onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-xl font-bold text-gray-900">מיפוי קמפיינים</h1>
                <p className="text-sm text-gray-500 mt-1">
                  מיפוי שמות קמפיינים מ-Meta לסוגי פרויקט
                </p>
              </div>
              <button
                onClick={() => { resetForm(); setShowForm(true); }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
              >
                + מיפוי חדש
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            {showForm && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">
                  {editingMapping ? 'עריכת מיפוי' : 'מיפוי חדש'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">טקסט לחיפוש</label>
                      <input
                        type="text"
                        value={formData.contains_text}
                        onChange={(e) => setFormData({ ...formData, contains_text: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="לדוגמה: ממ״דים"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">סוג פרויקט</label>
                      <select
                        value={formData.project_type_key}
                        onChange={(e) => setFormData({ ...formData, project_type_key: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {PROJECT_TYPES.map((pt) => (
                          <option key={pt.key} value={pt.key}>{pt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">עדיפות</label>
                      <input
                        type="number"
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 100 })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min={1}
                        max={10000}
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
                    >
                      {editingMapping ? 'עדכן' : 'צור מיפוי'}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 transition"
                    >
                      ביטול
                    </button>
                  </div>
                </form>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="text-right px-4 py-3 font-medium text-gray-600">טקסט חיפוש</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-600">סוג פרויקט</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-600">עדיפות</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-600">פעולות</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mappings.map((mapping) => (
                        <tr key={mapping.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{mapping.contains_text}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {getProjectLabel(mapping.project_type_key)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500">{mapping.priority}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-3">
                              <button
                                onClick={() => startEdit(mapping)}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                עריכה
                              </button>
                              <button
                                onClick={() => handleDelete(mapping.id)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                השבת
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {mappings.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                            אין מיפויים פעילים
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
