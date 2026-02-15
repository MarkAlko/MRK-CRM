'use client';

import { useEffect, useState } from 'react';
import { usersApi } from '@/lib/api';
import { USER_ROLES } from '@/lib/constants';
import type { User, UserRole } from '@/lib/types';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function UsersSettingsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'qualifier' as UserRole,
    is_active: true,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const data = await usersApi.list();
      setUsers(data);
    } catch {
      setError('שגיאה בטעינת משתמשים');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({ name: '', email: '', password: '', role: 'qualifier', is_active: true });
    setEditingUser(null);
    setShowForm(false);
    setError('');
  }

  function startEdit(user: User) {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      is_active: user.is_active,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    try {
      if (editingUser) {
        const updateData: Record<string, unknown> = {
          name: formData.name,
          role: formData.role,
          is_active: formData.is_active,
        };
        if (formData.password) updateData.password = formData.password;
        await usersApi.update(editingUser.id, updateData as any);
      } else {
        if (!formData.password) {
          setError('סיסמה נדרשת ליצירת משתמש חדש');
          return;
        }
        await usersApi.create(formData as any);
      }
      resetForm();
      loadUsers();
    } catch (err: any) {
      setError(err.message || 'שגיאה בשמירת משתמש');
    }
  }

  const getRoleLabel = (role: string) => USER_ROLES.find((r) => r.key === role)?.label || role;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="ניהול משתמשים" onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-xl font-bold text-gray-900">משתמשים</h1>
              <button
                onClick={() => { resetForm(); setShowForm(true); }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
              >
                + משתמש חדש
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
                  {editingUser ? 'עריכת משתמש' : 'משתמש חדש'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">שם מלא</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">דוא״ל</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        disabled={!!editingUser}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {editingUser ? 'סיסמה חדשה (אופציונלי)' : 'סיסמה'}
                      </label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required={!editingUser}
                        minLength={6}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">תפקיד</label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {USER_ROLES.map((r) => (
                          <option key={r.key} value={r.key}>{r.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {editingUser && (
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="rounded"
                      />
                      <span>משתמש פעיל</span>
                    </label>
                  )}
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
                    >
                      {editingUser ? 'עדכן' : 'צור משתמש'}
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
                        <th className="text-right px-4 py-3 font-medium text-gray-600">שם</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-600">דוא״ל</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-600">תפקיד</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-600">סטטוס</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-600">פעולות</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3">{user.name}</td>
                          <td className="px-4 py-3 text-gray-500">{user.email}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {getRoleLabel(user.role)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {user.is_active ? 'פעיל' : 'לא פעיל'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => startEdit(user)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              עריכה
                            </button>
                          </td>
                        </tr>
                      ))}
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
