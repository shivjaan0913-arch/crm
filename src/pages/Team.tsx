import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Shield, ShieldAlert, User, Plus, Trash2 } from 'lucide-react';

type ProfileRecord = Record<string, unknown>;
type WhitelistRecord = Record<string, unknown>;

export default function Team() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [whitelistedEmails, setWhitelistedEmails] = useState<WhitelistRecord[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [profilesRes, whitelistRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('whitelist').select('*').order('created_at', { ascending: false })
    ]);
    
    if (profilesRes.error) setError(profilesRes.error.message);
    else setProfiles(profilesRes.data as ProfileRecord[]);
    
    if (whitelistRes.data) setWhitelistedEmails(whitelistRes.data as WhitelistRecord[]);
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, currentRole: string) => {
    if (!isAdmin) return;
    const newRole = currentRole === 'admin' ? 'employee' : 'admin';
    if (window.confirm(`Are you sure you want to change this user to ${newRole}?`)) {
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
      if (error) alert(`Error updating role: ${error.message}`);
      else fetchData();
    }
  };

  const handleAddWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !newEmail) return;
    const { error } = await supabase.from('whitelist').insert([{ email: newEmail }]);
    if (error) alert(`Error adding email: ${error.message}`);
    else {
      setNewEmail('');
      fetchData();
    }
  };

  const handleRemoveWhitelist = async (id: string) => {
    if (!isAdmin) return;
    if (window.confirm('Remove this email from the whitelist?')) {
      const { error } = await supabase.from('whitelist').delete().eq('id', id);
      if (error) alert(`Error removing email: ${error.message}`);
      else fetchData();
    }
  };

  return (
    <div className="space-y-8">
      {/* Team Members Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">Team Members</h1>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm border border-red-200 mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-gray-500">Loading team members...</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {profiles.map((p) => {
                const profileId = p.id as string;
                const role = p.role as string;
                const fullName = p.full_name as string;
                const email = p.email as string;

                return (
                  <li key={profileId} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{fullName}</p>
                        <p className="text-sm text-gray-500">{email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {role === 'admin' ? <ShieldAlert className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                        {role.toUpperCase()}
                      </span>
                      
                      {isAdmin && profileId !== profile?.id && (
                        <button
                          onClick={() => handleRoleChange(profileId, role)}
                          className="text-sm text-blue-600 hover:text-blue-900 font-medium"
                        >
                          Make {role === 'admin' ? 'Employee' : 'Admin'}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Whitelist Section */}
      {isAdmin && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Sign-up Whitelist</h2>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500 mb-4">
              Only emails listed below will be able to create an account in the CRM.
            </p>
            <form onSubmit={handleAddWhitelist} className="flex gap-4 mb-6">
              <input
                type="email"
                required
                placeholder="Enter email to authorize..."
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Authorize Email
              </button>
            </form>

            <div className="border border-gray-200 rounded-md">
              <ul className="divide-y divide-gray-200">
                {whitelistedEmails.length === 0 ? (
                  <li className="px-4 py-3 text-sm text-gray-500">No emails whitelisted yet. (Current admins can still login).</li>
                ) : (
                  whitelistedEmails.map((item) => (
                    <li key={item.id as string} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                      <span className="text-sm text-gray-900">{item.email as string}</span>
                      <button
                        onClick={() => handleRemoveWhitelist(item.id as string)}
                        className="text-red-600 hover:text-red-900"
                        title="Remove from whitelist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}