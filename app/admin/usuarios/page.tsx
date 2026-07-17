'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Shield, 
  Loader2, 
  Search, 
  Mail, 
  Calendar, 
  Edit, 
  Info, 
  CheckCircle, 
  AlertTriangle, 
  Ban, 
  X, 
  Filter, 
  Users, 
  RefreshCw, 
  Clock, 
  MessageSquare, 
  FileText,
  Camera
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { Profile, Role, UserStatus } from '@/types';
import { useAdminCache } from '../context/AdminCacheContext';

export default function AdminUsers() {
  const { profile: currentAdmin, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const { users, commentCounts, postCounts, usersLoading: loading, refreshUsers, setUsers } = useAdminCache();
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');

  // Modals & Action states
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editRole, setEditRole] = useState<Role>('user');
  const [editStatus, setEditStatus] = useState<UserStatus>('active');

  const [confirmAction, setConfirmAction] = useState<{
    type: 'role' | 'status';
    userId: string;
    targetValue: Role | UserStatus;
    message: string;
  } | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Secure route check
  useEffect(() => {
    if (!authLoading) {
      if (!currentAdmin) {
        router.push('/login');
      } else if (!isAdmin) {
        router.push('/admin'); // Redirect editors
      }
    }
  }, [currentAdmin, isAdmin, authLoading, router]);

  useEffect(() => {
    if (currentAdmin && isAdmin) {
      refreshUsers();
    }
  }, [currentAdmin, isAdmin]);

  const fetchUsersData = async () => {
    setFeedback(null);
    try {
      await refreshUsers();
    } catch (error: any) {
      console.error('Error fetching users data:', error);
      setFeedback({ type: 'error', message: 'Erro ao carregar dados dos usuários: ' + error.message });
    }
  };

  const handleUpdateRole = async (userId: string, newRole: Role) => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setFeedback({ type: 'success', message: 'Cargo atualizado com sucesso para: ' + getRoleLabel(newRole) });
      
      // Update local state if editing
      if (editingUser?.id === userId) {
        setEditRole(newRole);
      }
    } catch (error: any) {
      console.error('Error updating role:', error);
      setFeedback({ type: 'error', message: 'Erro ao atualizar cargo: ' + error.message });
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  const handleUpdateStatus = async (userId: string, newStatus: UserStatus) => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      setFeedback({ type: 'success', message: 'Status do usuário atualizado com sucesso para: ' + getStatusLabel(newStatus) });
      
      // Update local state if editing
      if (editingUser?.id === userId) {
        setEditStatus(newStatus);
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      setFeedback({ type: 'error', message: 'Erro ao atualizar status: ' + error.message });
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setActionLoading(true);
    setFeedback(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editName,
          avatar_url: editAvatar || null,
          role: editRole,
          status: editStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      setUsers(prev => prev.map(u => u.id === editingUser.id ? { 
        ...u, 
        full_name: editName, 
        avatar_url: editAvatar || null,
        role: editRole,
        status: editStatus,
        updated_at: new Date().toISOString()
      } : u));
      
      setFeedback({ type: 'success', message: 'Perfil de ' + editName + ' atualizado com sucesso!' });
      setIsEditOpen(false);
      setEditingUser(null);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      setFeedback({ type: 'error', message: 'Erro ao salvar alterações: ' + error.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEdit = (user: Profile) => {
    setEditingUser(user);
    setEditName(user.full_name || '');
    setEditAvatar(user.avatar_url || '');
    setEditRole(user.role);
    setEditStatus(user.status || 'active');
    setIsEditOpen(true);
  };

  const handleOpenDetails = (user: Profile) => {
    setSelectedUser(user);
    setIsDetailsOpen(true);
  };

  // Helper labels & colors
  const getRoleLabel = (role: Role) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'editor': return 'Editor';
      case 'user': return 'Leitor';
      default: return role;
    }
  };

  const getRoleBadgeClass = (role: Role) => {
    switch (role) {
      case 'admin': return 'bg-red-50 text-red-700 border-red-100';
      case 'editor': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'user': return 'bg-zinc-100 text-zinc-700 border-zinc-200';
      default: return 'bg-zinc-50 text-zinc-600';
    }
  };

  const getStatusLabel = (status: UserStatus | undefined) => {
    const s = status || 'active';
    switch (s) {
      case 'active': return 'Ativo';
      case 'suspended': return 'Suspenso';
      case 'blocked': return 'Bloqueado';
      default: return s;
    }
  };

  const getStatusBadgeClass = (status: UserStatus | undefined) => {
    const s = status || 'active';
    switch (s) {
      case 'active': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'suspended': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'blocked': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  };

  // Calculations for stats card
  const totalCount = users.length;
  const activeCount = users.filter(u => (u.status || 'active') === 'active').length;
  const suspendedCount = users.filter(u => u.status === 'suspended').length;
  const blockedCount = users.filter(u => u.status === 'blocked').length;

  // Filter & Sort implementation
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || (user.status || 'active') === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (sortBy === 'oldest') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    if (sortBy === 'name') {
      return (a.full_name || '').localeCompare(b.full_name || '');
    }
    return 0;
  });

  if (authLoading || (loading && users.length === 0)) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-red-600" size={40} />
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Carregando painel de usuários...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-100 pb-6">
        <div>
          <h2 className="text-2xl font-black tracking-tighter uppercase text-zinc-950">Controle de Usuários</h2>
          <p className="text-sm text-zinc-500">Gerencie permissões, cargos, fotos e restrições dos leitores e editores do portal.</p>
        </div>
        <button 
          onClick={fetchUsersData}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all border border-zinc-200"
        >
          <RefreshCw size={14} />
          Atualizar Dados
        </button>
      </div>

      {/* Toast Feedback */}
      {feedback && (
        <div className={cn(
          "p-4 rounded-xl flex items-center justify-between gap-3 text-sm font-bold animate-in slide-in-from-top duration-300",
          feedback.type === 'success' ? "bg-emerald-50 text-emerald-800 border border-emerald-100" : "bg-red-50 text-red-800 border border-red-100"
        )}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-zinc-400 hover:text-zinc-600">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-zinc-900 text-white flex items-center justify-center">
            <Users size={22} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-zinc-400">Total Geral</p>
            <p className="text-2xl font-black text-zinc-900">{totalCount}</p>
          </div>
        </div>

        <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
            <CheckCircle size={22} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-zinc-400">Ativos</p>
            <p className="text-2xl font-black text-emerald-600">{activeCount}</p>
          </div>
        </div>

        <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-zinc-400">Suspensos</p>
            <p className="text-2xl font-black text-amber-600">{suspendedCount}</p>
          </div>
        </div>

        <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500 text-white flex items-center justify-center">
            <Ban size={22} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-zinc-400">Bloqueados</p>
            <p className="text-2xl font-black text-rose-600">{blockedCount}</p>
          </div>
        </div>

      </div>

      {/* Filters and Controls */}
      <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200/60 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-zinc-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-red-600 outline-none transition-all"
          />
        </div>

        {/* Role Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 whitespace-nowrap hidden lg:inline">Cargo:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-600"
          >
            <option value="all">Todos os Cargos</option>
            <option value="admin">Administradores</option>
            <option value="editor">Editores</option>
            <option value="user">Leitores</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 whitespace-nowrap hidden lg:inline">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-600"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Ativos</option>
            <option value="suspended">Suspensos</option>
            <option value="blocked">Bloqueados</option>
          </select>
        </div>

        {/* Sorting */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 whitespace-nowrap hidden lg:inline">Ordem:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-600"
          >
            <option value="newest">Mais Recentes</option>
            <option value="oldest">Mais Antigos</option>
            <option value="name">Ordem Alfabética</option>
          </select>
        </div>

      </div>

      {/* Users Table / List */}
      {sortedUsers.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-zinc-100 rounded-3xl bg-zinc-50/50">
          <Users size={36} className="mx-auto text-zinc-400 mb-3" />
          <p className="text-zinc-600 font-bold">Nenhum usuário encontrado</p>
          <p className="text-zinc-400 text-xs mt-1">Experimente ajustar seus termos de busca ou filtros.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-100">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Usuário</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Email</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Cargo</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Atividades</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Cadastro</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {sortedUsers.map((user) => {
                  const commentsCountNum = commentCounts[user.id] || 0;
                  const postsCountNum = postCounts[user.id] || 0;
                  const uStatus = user.status || 'active';

                  return (
                    <tr key={user.id} className="hover:bg-zinc-50/50 transition-colors">
                      {/* Name & Avatar */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400 border border-zinc-200 flex-shrink-0">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <User size={18} />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-zinc-900 block truncate max-w-[180px]">
                              {user.full_name || 'Sem Nome'}
                            </span>
                            <span className="text-[10px] text-zinc-400 block font-mono">
                              ID: {user.id.substring(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-zinc-600 text-sm">
                          <Mail size={14} className="text-zinc-400 flex-shrink-0" />
                          <span className="truncate max-w-[180px]">{user.email}</span>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider",
                          getRoleBadgeClass(user.role)
                        )}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider",
                          getStatusBadgeClass(uStatus)
                        )}>
                          {getStatusLabel(uStatus)}
                        </span>
                      </td>

                      {/* Stats badges */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span 
                            title="Comentários APROVADOS enviados pelo usuário"
                            className="flex items-center gap-1 px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded text-xs font-semibold"
                          >
                            <MessageSquare size={12} className="text-zinc-400" />
                            {commentsCountNum === -1 ? 'Indisponível' : `${commentsCountNum} aprovados`}
                          </span>
                          {user.role !== 'user' && (
                            <span 
                              title="Total de matérias/notícias criadas por este autor (incluindo rascunhos)"
                              className="flex items-center gap-1 px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded text-xs font-semibold"
                            >
                              <FileText size={12} className="text-zinc-400" />
                              {postsCountNum === -1 ? 'Indisponível' : `${postsCountNum} criadas`}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-zinc-500 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-zinc-400 flex-shrink-0" />
                          <span>{formatDate(user.created_at)}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          
                          {/* Info Button */}
                          <button
                            onClick={() => handleOpenDetails(user)}
                            title="Inspecionar Detalhes"
                            className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-zinc-950 transition-colors"
                          >
                            <Info size={16} />
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => handleOpenEdit(user)}
                            title="Editar Perfil"
                            className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-red-600 transition-colors"
                          >
                            <Edit size={16} />
                          </button>

                          {/* Quick Ban / Unban actions */}
                          {uStatus === 'active' ? (
                            <button
                              onClick={() => setConfirmAction({
                                type: 'status',
                                userId: user.id,
                                targetValue: 'blocked',
                                message: `Tem certeza que deseja bloquear o usuário ${user.full_name || user.email}? Ele perderá o acesso a interações e painéis.`
                              })}
                              title="Bloquear Usuário"
                              className="p-1.5 hover:bg-rose-50 rounded-lg text-zinc-400 hover:text-rose-600 transition-colors"
                            >
                              <Ban size={16} />
                            </button>
                          ) : (
                            <button
                              onClick={() => setConfirmAction({
                                type: 'status',
                                userId: user.id,
                                targetValue: 'active',
                                message: `Deseja reativar a conta do usuário ${user.full_name || user.email}?`
                              })}
                              title="Ativar Usuário"
                              className="p-1.5 hover:bg-emerald-50 rounded-lg text-zinc-400 hover:text-emerald-600 transition-colors"
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* USER DETAILS MODAL */}
      {isDetailsOpen && selectedUser && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-zinc-100 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto space-y-6">
            
            <button 
              onClick={() => setIsDetailsOpen(false)}
              className="absolute right-4 top-4 p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-all"
            >
              <X size={20} />
            </button>

            {/* Modal Header */}
            <div className="text-center pb-4 border-b border-zinc-100">
              <div className="w-20 h-20 bg-zinc-100 rounded-full mx-auto flex items-center justify-center text-zinc-400 border-2 border-zinc-200 mb-3 overflow-hidden">
                {selectedUser.avatar_url ? (
                  <img src={selectedUser.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={36} />
                )}
              </div>
              <h3 className="text-lg font-black text-zinc-900">{selectedUser.full_name || 'Sem nome'}</h3>
              <p className="text-xs text-zinc-500 font-mono mt-1">{selectedUser.email}</p>
            </div>

            {/* Detailed Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-50 p-4 rounded-xl text-center">
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">Comentários Aprovados</p>
                <p className="text-lg font-black text-zinc-900">
                  {commentCounts[selectedUser.id] === -1 ? 'Indisponível' : (commentCounts[selectedUser.id] || 0)}
                </p>
                <p className="text-[10px] text-zinc-500 mt-1">
                  {commentCounts[selectedUser.id] === -1 
                    ? 'Falha na consulta' 
                    : (commentCounts[selectedUser.id] || 0) > 0 ? 'Participação ativa' : 'Nenhum aprovado'}
                </p>
              </div>
              <div className="bg-zinc-50 p-4 rounded-xl text-center">
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">Matérias Criadas</p>
                <p className="text-lg font-black text-zinc-900">
                  {postCounts[selectedUser.id] === -1 ? 'Indisponível' : (postCounts[selectedUser.id] || 0)}
                </p>
                <p className="text-[10px] text-zinc-500 mt-1">
                  {postCounts[selectedUser.id] === -1 
                    ? 'Falha na consulta' 
                    : selectedUser.role === 'user' ? 'Apenas leitor' : `${postCounts[selectedUser.id] || 0} criadas`}
                </p>
              </div>
            </div>

            {/* User Meta List */}
            <div className="space-y-3.5 text-sm">
              
              <div className="flex justify-between items-center py-2 border-b border-zinc-50">
                <span className="font-bold text-zinc-500 text-xs uppercase tracking-wider">ID Interno</span>
                <span className="font-mono text-xs text-zinc-900 select-all bg-zinc-50 px-2.5 py-1 rounded-lg">
                  {selectedUser.id}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-zinc-50">
                <span className="font-bold text-zinc-500 text-xs uppercase tracking-wider">Cargo</span>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider",
                  getRoleBadgeClass(selectedUser.role)
                )}>
                  {getRoleLabel(selectedUser.role)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-zinc-50">
                <span className="font-bold text-zinc-500 text-xs uppercase tracking-wider">Status da Conta</span>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider",
                  getStatusBadgeClass(selectedUser.status)
                )}>
                  {getStatusLabel(selectedUser.status)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-zinc-50">
                <span className="font-bold text-zinc-500 text-xs uppercase tracking-wider">Data de Criação</span>
                <span className="text-zinc-800 font-medium">
                  {formatDate(selectedUser.created_at)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-zinc-50">
                <span className="font-bold text-zinc-500 text-xs uppercase tracking-wider">Última Atualização</span>
                <span className="text-zinc-800 font-medium">
                  {selectedUser.updated_at ? formatDate(selectedUser.updated_at) : 'Nenhuma modificação'}
                </span>
              </div>

            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
              <button
                onClick={() => {
                  setIsDetailsOpen(false);
                  handleOpenEdit(selectedUser);
                }}
                className="flex-1 py-3 px-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all text-center"
              >
                Editar Perfil
              </button>
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="flex-1 py-3 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all text-center"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* EDIT USER PROFILE MODAL */}
      {isEditOpen && editingUser && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-zinc-100 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            
            <button 
              onClick={() => {
                setIsEditOpen(false);
                setEditingUser(null);
              }}
              className="absolute right-4 top-4 p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-all"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-black uppercase tracking-tighter text-zinc-900 mb-6">Editar Usuário</h3>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              
              {/* Photo preview and avatar_url input */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-zinc-400 block ml-1">Foto do Perfil (URL)</label>
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-16 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400 flex-shrink-0 overflow-hidden">
                    {editAvatar ? (
                      <img src={editAvatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Camera size={24} />
                    )}
                  </div>
                  <input
                    type="url"
                    value={editAvatar}
                    onChange={(e) => setEditAvatar(e.target.value)}
                    placeholder="https://exemplo.com/sua-foto.jpg"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-600 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-zinc-400 block ml-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nome do usuário"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-600 outline-none transition-all"
                />
              </div>

              {/* Email (Disabled, safety constraint) */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-zinc-400 block ml-1">E-mail (Não editável)</label>
                <input
                  type="email"
                  disabled
                  value={editingUser.email}
                  className="w-full bg-zinc-100 border border-zinc-200 text-zinc-400 rounded-xl px-4 py-3 text-sm outline-none cursor-not-allowed"
                />
              </div>

              {/* Role Select */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-zinc-400 block ml-1">Cargo</label>
                <select
                  value={editRole}
                  onChange={(e) => {
                    const targetRole = e.target.value as Role;
                    setEditRole(targetRole);
                  }}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-600 outline-none transition-all"
                >
                  <option value="user">Leitor</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              {/* Status Select */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-zinc-400 block ml-1">Status da Conta</label>
                <select
                  value={editStatus}
                  onChange={(e) => {
                    const targetStatus = e.target.value as UserStatus;
                    setEditStatus(targetStatus);
                  }}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-600 outline-none transition-all"
                >
                  <option value="active">Ativo</option>
                  <option value="suspended">Suspenso</option>
                  <option value="blocked">Bloqueado</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-4 px-6 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="animate-spin" size={16} /> : 'Salvar Alterações'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditOpen(false);
                    setEditingUser(null);
                  }}
                  className="py-4 px-6 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  Cancelar
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG */}
      {confirmAction && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl border border-zinc-100 shadow-2xl p-6 relative">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="text-base font-black uppercase tracking-tighter text-zinc-900">Confirmação Obrigatória</h4>
                <p className="text-zinc-600 text-sm mt-2 leading-relaxed">{confirmAction.message}</p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
              <button
                disabled={actionLoading}
                onClick={() => {
                  if (confirmAction.type === 'role') {
                    handleUpdateRole(confirmAction.userId, confirmAction.targetValue as Role);
                  } else if (confirmAction.type === 'status') {
                    handleUpdateStatus(confirmAction.userId, confirmAction.targetValue as UserStatus);
                  }
                }}
                className="py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="animate-spin" size={14} /> : 'Confirmar'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-black uppercase tracking-wider transition-all"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
