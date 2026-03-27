'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Shield, Loader2, Search, Mail, Calendar } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { Profile } from '@/types';

export default function AdminUsers() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) console.error('Error fetching users:', error);
    else setUsers(data || []);
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'redator' | 'usuario') => {
    setUpdatingId(userId);
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);
    
    if (error) {
      console.error('Erro ao atualizar cargo do usuário:', error);
    } else {
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
    setUpdatingId(null);
  };

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black tracking-tighter uppercase">Usuários</h1>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
          <input
            type="text"
            placeholder="Buscar usuários..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-zinc-100 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-red-600 outline-none transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-red-600" size={32} />
          <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Carregando usuários...</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50 border-bottom border-zinc-100">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Usuário</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Email</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Cadastro</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Cargo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.full_name || ''} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <User size={20} />
                        )}
                      </div>
                      <span className="font-bold text-zinc-900">{user.full_name || 'Usuário sem nome'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-zinc-500">
                      <Mail size={14} />
                      <span className="text-sm">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-zinc-500">
                      <Calendar size={14} />
                      <span className="text-sm">
                        {formatDate(user.created_at)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <select
                        value={user.role}
                        disabled={updatingId === user.id}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                        className={cn(
                          "bg-zinc-100 border-none rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest outline-none transition-all cursor-pointer",
                          user.role === 'admin' ? "text-red-600 bg-red-50" : 
                          user.role === 'redator' ? "text-blue-600 bg-blue-50" : 
                          "text-zinc-500 bg-zinc-100"
                        )}
                      >
                        <option value="usuario">Leitor</option>
                        <option value="redator">Redator</option>
                        <option value="admin">Admin</option>
                      </select>
                      {updatingId === user.id && <Loader2 className="animate-spin text-zinc-400" size={14} />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
