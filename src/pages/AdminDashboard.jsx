import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LogOut, Plus, Trash2, Pencil, X, Check, Wallet, TrendingUp, TrendingDown,
  Receipt, Tag, FileText, Image as ImageIcon, Save, Bell, Send, Loader2,
  RefreshCw,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { sendPushToAll } from '../lib/pushNotifications'
import ExpenseForm from '../components/ExpenseForm'
import IncomeForm from '../components/IncomeForm'
import StudentPaymentManager from '../components/StudentPaymentManager'

// ─── Helper ────────────────────────────────────────────────────────────────────
const calcTotalCash = (incomes = [], expenses = []) =>
  incomes.reduce((s, r) => s + (r.amount ?? 0), 0) -
  expenses.reduce((s, r) => s + (r.amount ?? 0), 0)

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.95 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-2xl border border-green-500/30 bg-dark-secondary/95 backdrop-blur-md"
    >
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20 shrink-0">
        <Check size={14} className="text-green-400" />
      </span>
      <span className="text-sm font-medium text-white">{message}</span>
    </motion.div>
  )
}

// ─── Expense Detail Modal ──────────────────────────────────────────────────────
function ExpenseDetailModal({ expense, onClose, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [draft, setDraft]         = useState({
    name: expense.name || '', description: expense.description || '',
    category: expense.category || '', amount: expense.amount ?? 0,
  })

  const handleSave = async () => {
    const num = parseFloat(String(draft.amount).replace(/[^0-9.-]/g, ''))
    if (isNaN(num)) return
    setSaving(true)
    await onUpdate(expense.id, { ...draft, amount: num })
    setSaving(false)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setDraft({ name: expense.name || '', description: expense.description || '', category: expense.category || '', amount: expense.amount ?? 0 })
    setIsEditing(false)
  }

  return (
    <AnimatePresence>
      <motion.div key="exp-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
      <motion.div key="exp-modal"
        initial={{ opacity: 0, scale: 0.92, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 24 }} transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-lg glass rounded-2xl overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}>

          {/* Header */}
          <div className="relative px-6 pt-6 pb-4 border-b border-white/10">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent to-accent-light" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/20">
                  <Receipt size={20} className="text-accent" />
                </div>
                <div>
                  <h2 className="text-lg font-display font-bold text-white">Detail Pengeluaran</h2>
                  <p className="text-xs text-white/40">
                    {expense.created_at
                      ? new Date(expense.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                      : '-'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={handleCancel} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                      <X size={16} className="text-white/50" />
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={handleSave} disabled={saving}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-dark-primary rounded-lg text-sm font-bold hover:opacity-90 disabled:opacity-50">
                      <Save size={14} />{saving ? 'Menyimpan...' : 'Simpan'}
                    </motion.button>
                  </>
                ) : (
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }} onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 glass hover:bg-white/10 rounded-lg text-sm font-medium">
                    <Pencil size={14} className="text-accent" /><span className="text-white/80">Edit</span>
                  </motion.button>
                )}
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }} onClick={onClose}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition-colors">
                  <X size={18} className="text-white/60 hover:text-red-400" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <label className="flex items-center gap-1.5 text-xs text-white/40 mb-1.5"><FileText size={12} /> Nama Pengeluaran</label>
              {isEditing ? (
                <input type="text" value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                  className="w-full bg-white/10 border border-accent/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent transition-colors" />
              ) : <p className="text-white font-semibold text-base">{expense.name || '-'}</p>}
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs text-white/40 mb-1.5"><Tag size={12} /> Kategori</label>
              {isEditing ? (
                <input type="text" value={draft.category} onChange={(e) => setDraft((p) => ({ ...p, category: e.target.value }))}
                  className="w-full bg-white/10 border border-accent/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent transition-colors" />
              ) : expense.category
                ? <span className="inline-block px-2.5 py-1 bg-accent/10 border border-accent/20 text-accent text-xs rounded-full font-medium">{expense.category}</span>
                : <p className="text-white/40 text-sm">Tidak ada kategori</p>}
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs text-white/40 mb-1.5"><Wallet size={12} /> Jumlah</label>
              {isEditing ? (
                <input type="number" value={draft.amount} onChange={(e) => setDraft((p) => ({ ...p, amount: e.target.value }))}
                  className="w-full bg-white/10 border border-accent/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent transition-colors" />
              ) : <p className="text-2xl font-display font-bold text-accent">−Rp {Number(expense.amount).toLocaleString('id-ID')}</p>}
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs text-white/40 mb-1.5"><FileText size={12} /> Deskripsi</label>
              {isEditing ? (
                <textarea rows={3} value={draft.description} onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
                  className="w-full bg-white/10 border border-accent/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent transition-colors resize-none" />
              ) : <p className="text-white/70 text-sm leading-relaxed">{expense.description || <span className="text-white/30 italic">Tidak ada deskripsi</span>}</p>}
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs text-white/40 mb-2"><ImageIcon size={12} /> Bukti Pembayaran</label>
              {expense.proof_image_url ? (
                <div className="rounded-xl overflow-hidden border border-white/10">
                  <img src={`https://fxxjfkcjtuuxbrxhfrph.supabase.co/storage/v1/object/public/expense-proofs/${expense.proof_image_url}`}
                    alt="Bukti pembayaran" className="w-full object-contain max-h-72 bg-black/20"
                    onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex' }} />
                  <div style={{ display: 'none' }} className="flex-col items-center justify-center py-8 text-white/30">
                    <ImageIcon size={28} className="mb-2 opacity-40" /><p className="text-sm">Gagal memuat gambar</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 rounded-xl border border-dashed border-white/15 text-white/30">
                  <ImageIcon size={28} className="mb-2 opacity-40" /><p className="text-sm">Tidak ada bukti pembayaran</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/10 flex justify-end">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onClose}
              className="px-5 py-2 glass hover:bg-white/10 rounded-lg text-sm text-white/70 font-medium transition-colors">
              Tutup
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Income Detail Modal ───────────────────────────────────────────────────────
function IncomeDetailModal({ income, onClose, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [draft, setDraft]         = useState({
    name: income.name || '', description: income.description || '',
    source: income.source || '', amount: income.amount ?? 0,
  })

  const handleSave = async () => {
    const num = parseFloat(String(draft.amount).replace(/[^0-9.-]/g, ''))
    if (isNaN(num)) return
    setSaving(true)
    await onUpdate(income.id, { ...draft, amount: num })
    setSaving(false)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setDraft({ name: income.name || '', description: income.description || '', source: income.source || '', amount: income.amount ?? 0 })
    setIsEditing(false)
  }

  return (
    <AnimatePresence>
      <motion.div key="inc-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
      <motion.div key="inc-modal"
        initial={{ opacity: 0, scale: 0.92, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 24 }} transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-lg glass rounded-2xl overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}>

          {/* Header */}
          <div className="relative px-6 pt-6 pb-4 border-b border-white/10">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-emerald-500" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <TrendingUp size={20} className="text-green-400" />
                </div>
                <div>
                  <h2 className="text-lg font-display font-bold text-white">Detail Pemasukan</h2>
                  <p className="text-xs text-white/40">
                    {income.created_at
                      ? new Date(income.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                      : '-'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={handleCancel} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                      <X size={16} className="text-white/50" />
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={handleSave} disabled={saving}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-bold hover:opacity-90 disabled:opacity-50">
                      <Save size={14} />{saving ? 'Menyimpan...' : 'Simpan'}
                    </motion.button>
                  </>
                ) : (
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }} onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 glass hover:bg-white/10 rounded-lg text-sm font-medium">
                    <Pencil size={14} className="text-green-400" /><span className="text-white/80">Edit</span>
                  </motion.button>
                )}
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }} onClick={onClose}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition-colors">
                  <X size={18} className="text-white/60 hover:text-red-400" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <label className="flex items-center gap-1.5 text-xs text-white/40 mb-1.5"><FileText size={12} /> Nama Pemasukan</label>
              {isEditing ? (
                <input type="text" value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                  className="w-full bg-white/10 border border-green-500/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-400 transition-colors" />
              ) : <p className="text-white font-semibold text-base">{income.name || '-'}</p>}
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs text-white/40 mb-1.5"><Tag size={12} /> Sumber</label>
              {isEditing ? (
                <input type="text" value={draft.source} onChange={(e) => setDraft((p) => ({ ...p, source: e.target.value }))}
                  className="w-full bg-white/10 border border-green-500/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-400 transition-colors" />
              ) : income.source
                ? <span className="inline-block px-2.5 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded-full font-medium">{income.source}</span>
                : <p className="text-white/40 text-sm">Tidak ada sumber</p>}
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs text-white/40 mb-1.5"><Wallet size={12} /> Jumlah</label>
              {isEditing ? (
                <input type="number" value={draft.amount} onChange={(e) => setDraft((p) => ({ ...p, amount: e.target.value }))}
                  className="w-full bg-white/10 border border-green-500/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-400 transition-colors" />
              ) : <p className="text-2xl font-display font-bold text-green-400">+Rp {Number(income.amount).toLocaleString('id-ID')}</p>}
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs text-white/40 mb-1.5"><FileText size={12} /> Deskripsi</label>
              {isEditing ? (
                <textarea rows={3} value={draft.description} onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
                  className="w-full bg-white/10 border border-green-500/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-400 transition-colors resize-none" />
              ) : <p className="text-white/70 text-sm leading-relaxed">{income.description || <span className="text-white/30 italic">Tidak ada deskripsi</span>}</p>}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/10 flex justify-end">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onClose}
              className="px-5 py-2 glass hover:bg-white/10 rounded-lg text-sm text-white/70 font-medium transition-colors">
              Tutup
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Send Notification Modal ───────────────────────────────────────────────────
function SendNotificationModal({ onClose }) {
  const [title, setTitle]   = useState('')
  const [body, setBody]     = useState('')
  const [status, setStatus] = useState('idle')
  const [errMsg, setErrMsg] = useState('')

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) return
    setStatus('sending')
    try {
      await sendPushToAll({ title: title.trim(), body: body.trim() })
      setStatus('success')
      setTimeout(() => onClose(), 1500)
    } catch (err) {
      setErrMsg(err?.message || 'Gagal mengirim notifikasi')
      setStatus('error')
    }
  }

  return (
    <AnimatePresence>
      <motion.div key="notif-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
      <motion.div key="notif-modal"
        initial={{ opacity: 0, scale: 0.92, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 24 }} transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-md glass rounded-2xl overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}>
          <div className="relative px-6 pt-6 pb-4 border-b border-white/10">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-purple-500" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/20"><Bell size={20} className="text-violet-400" /></div>
                <div>
                  <h2 className="text-lg font-display font-bold text-white">Kirim Notifikasi</h2>
                  <p className="text-xs text-white/40">Ke semua student yang sudah izinkan notifikasi</p>
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.9 }} onClick={onClose} className="p-2 hover:bg-red-500/20 rounded-lg transition-colors">
                <X size={18} className="text-white/60 hover:text-red-400" />
              </motion.button>
            </div>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Judul Notifikasi</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Pengingat Iuran Bulan Ini" maxLength={80}
                disabled={status === 'sending' || status === 'success'}
                className="w-full bg-white/10 border border-white/15 focus:border-violet-400/60 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none transition-colors disabled:opacity-50" />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Deskripsi</label>
              <textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)}
                placeholder="Contoh: Harap segera lakukan pembayaran sebelum tanggal 15." maxLength={200}
                disabled={status === 'sending' || status === 'success'}
                className="w-full bg-white/10 border border-white/15 focus:border-violet-400/60 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none transition-colors resize-none disabled:opacity-50" />
              <p className="text-right text-xs text-white/25 mt-1">{body.length}/200</p>
            </div>
            {status === 'error' && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                ⚠ {errMsg}
              </motion.p>
            )}
            <motion.button
              whileHover={{ scale: status === 'idle' ? 1.02 : 1 }}
              whileTap={{ scale: status === 'idle' ? 0.98 : 1 }}
              onClick={handleSend}
              disabled={!title.trim() || !body.trim() || status === 'sending' || status === 'success'}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                ${status === 'success' ? 'bg-green-500 text-white'
                : 'bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400 text-white shadow-lg shadow-violet-500/25'}`}>
              {status === 'sending' ? <><Loader2 size={16} className="animate-spin" /> Mengirim...</>
                : status === 'success' ? <>✓ Berhasil Dikirim!</>
                : <><Send size={16} /> Kirim Notifikasi</>}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Inline edit card ──────────────────────────────────────────────────────────
function EditableCard({ icon: Icon, title, value, subtext, accentClass, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState('')
  const [saving, setSaving]   = useState(false)

  const startEdit = () => { setDraft(String(value)); setEditing(true) }
  const cancel    = () => setEditing(false)
  const save = async () => {
    const num = parseFloat(draft.replace(/[^0-9.-]/g, ''))
    if (isNaN(num)) return
    setSaving(true)
    await onSave(num)
    setSaving(false)
    setEditing(false)
  }

  return (
    <div className="glass p-6 rounded-2xl relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accentClass}`} />
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${accentClass} bg-opacity-20`}>
          <Icon size={20} className="text-white" />
        </div>
        {!editing ? (
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={startEdit}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <Pencil size={15} className="text-white/50 hover:text-accent" />
          </motion.button>
        ) : (
          <div className="flex gap-1">
            <motion.button whileTap={{ scale: 0.9 }} onClick={cancel} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
              <X size={15} className="text-white/50" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={save} disabled={saving}
              className="p-1.5 hover:bg-green-500/20 rounded-lg transition-colors">
              <Check size={15} className="text-green-400" />
            </motion.button>
          </div>
        )}
      </div>
      <p className="text-white/60 text-sm mb-1">{title}</p>
      <AnimatePresence mode="wait">
        {editing ? (
          <motion.input key="input" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            type="number" value={draft} onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel() }} autoFocus
            className="w-full bg-white/10 border border-accent/40 rounded-lg px-3 py-1.5 text-white text-lg font-bold focus:outline-none focus:border-accent" />
        ) : (
          <motion.p key="value" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="text-xl font-display font-bold text-white">
            Rp {Number(value).toLocaleString('id-ID')}
          </motion.p>
        )}
      </AnimatePresence>
      <p className="text-white/40 text-xs mt-1">{subtext}</p>
    </div>
  )
}

// ─── Read-only stat card ────────────────────────────────────────────────────────
function StatCard({ icon: Icon, title, value, subtext, accentClass }) {
  return (
    <div className="glass p-6 rounded-2xl relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accentClass}`} />
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${accentClass} bg-opacity-20`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
      <p className="text-white/60 text-sm mb-1">{title}</p>
      <p className="text-xl font-display font-bold text-white">{value}</p>
      <p className="text-white/40 text-xs mt-1">{subtext}</p>
    </div>
  )
}

const monthNames = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate()
  const { logout } = useAuthStore()

  const [expenses, setExpenses]                 = useState([])
  const [incomes, setIncomes]                   = useState([])
  const [financialSummary, setFinancialSummary] = useState({ mini_bank: 0, treasurer: 0 })
  const [summaryId, setSummaryId]               = useState(null)
  const [showExpenseForm, setShowExpenseForm]   = useState(false)
  const [showIncomeForm, setShowIncomeForm]     = useState(false)
  const [showNotifForm, setShowNotifForm]       = useState(false)
  const [activeTab, setActiveTab]               = useState('overview')
  const [isLoading, setIsLoading]               = useState(true)
  const [selectedExpense, setSelectedExpense]   = useState(null)
  const [selectedIncome, setSelectedIncome]     = useState(null)
  const [lastUpdated, setLastUpdated]           = useState(null)
  const [toast, setToast]                       = useState(null)

  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1)
  const [selectedYear, setSelectedYear]   = useState(currentDate.getFullYear())

  const [unpaidStudents, setUnpaidStudents]     = useState([])
  const [paymentSelection, setPaymentSelection] = useState({
    selectedCount: 0, pendingPaid: 0, pendingUnpaid: 0,
    isSaving: false, saveChanges: null, cancelChanges: null,
  })
  const [showMonthModal, setShowMonthModal]                 = useState(false)
  const [selectedPaymentStudent, setSelectedPaymentStudent] = useState(null)
  const [studentMonthStatus, setStudentMonthStatus]         = useState({})
  const [selectedMonths, setSelectedMonths]                 = useState(new Set())
  const [isMonthModalLoading, setIsMonthModalLoading]       = useState(false)
  const [isSavingMonths, setIsSavingMonths]                 = useState(false)

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchAdminData = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true)

      const [expenseRes, incomeRes, summaryRes, studentsRes, monthlyPaymentsRes] = await Promise.all([
        supabase.from('expenses').select('*').order('created_at', { ascending: false }),
        supabase.from('income').select('*').order('created_at', { ascending: false }),
        supabase.from('financial_summary').select('*').limit(1).maybeSingle(),
        supabase.from('students').select('id, name'),
        supabase.from('payment_status').select('student_id, paid').eq('month', selectedMonth).eq('year', selectedYear),
      ])

      setExpenses(expenseRes.data || [])
      setIncomes(incomeRes.data  || [])

      const allStudents     = studentsRes.data || []
      const monthlyPayments = monthlyPaymentsRes.data || []

      setUnpaidStudents(
        allStudents.filter((student) => {
          const payment = monthlyPayments.find((p) => p.student_id === student.id)
          return !payment || payment.paid === false
        })
      )

      if (summaryRes.data) {
        setFinancialSummary({ mini_bank: summaryRes.data.mini_bank ?? 0, treasurer: summaryRes.data.treasurer ?? 0 })
        setSummaryId(summaryRes.data.id)
      }

      setLastUpdated(new Date())
    } catch (err) {
      console.error('Failed to fetch admin data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [selectedMonth, selectedYear])

  useEffect(() => {
    fetchAdminData(false)
  }, [fetchAdminData])

  // ── Derived ─────────────────────────────────────────────────────────────────
  const totalClassCash = calcTotalCash(incomes, expenses)

  // ── Refresh with toast ──────────────────────────────────────────────────────
  const handleRefresh = async () => {
    await fetchAdminData(true)
    setToast('Data berhasil diperbarui!')
  }

  // ── Summary update ──────────────────────────────────────────────────────────
  const updateSummaryField = async (field, value) => {
    try {
      if (summaryId) {
        const { error } = await supabase.from('financial_summary').update({ [field]: value }).eq('id', summaryId)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('financial_summary').insert([{ [field]: value }]).select().single()
        if (error) throw error
        setSummaryId(data.id)
      }
      setFinancialSummary((prev) => ({ ...prev, [field]: value }))
    } catch (err) {
      console.error(`Failed to update ${field}:`, err)
    }
  }

  // ── Update expense ──────────────────────────────────────────────────────────
  const handleUpdateExpense = async (id, updatedData) => {
    try {
      const { error } = await supabase.from('expenses').update(updatedData).eq('id', id)
      if (error) throw error
      setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...updatedData } : e)))
      setSelectedExpense((prev) => (prev?.id === id ? { ...prev, ...updatedData } : prev))
    } catch (err) {
      console.error('Failed to update expense:', err)
    }
  }

  // ── Update income ───────────────────────────────────────────────────────────
  const handleUpdateIncome = async (id, updatedData) => {
    try {
      const { error } = await supabase.from('income').update(updatedData).eq('id', id)
      if (error) throw error
      setIncomes((prev) => prev.map((inc) => (inc.id === id ? { ...inc, ...updatedData } : inc)))
      setSelectedIncome((prev) => (prev?.id === id ? { ...prev, ...updatedData } : prev))
    } catch (err) {
      console.error('Failed to update income:', err)
    }
  }

  // ── CRUD ────────────────────────────────────────────────────────────────────
  const handleLogout = () => { logout(); navigate('/login') }

  const handleAddExpense = async (expenseData) => {
    try {
      const { error } = await supabase.from('expenses').insert([expenseData])
      if (error) throw error
      setShowExpenseForm(false)
      fetchAdminData(true)
    } catch (err) { console.error('Failed to add expense:', err) }
  }

  const handleAddIncome = async (incomeData) => {
    try {
      const { error } = await supabase.from('income').insert([incomeData])
      if (error) throw error
      setShowIncomeForm(false)
      fetchAdminData(true)
    } catch (err) { console.error('Failed to add income:', err) }
  }

  const handleDeleteExpense = async (id) => {
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) throw error
      setExpenses((prev) => prev.filter((e) => e.id !== id))
      if (selectedExpense?.id === id) setSelectedExpense(null)
    } catch (err) { console.error('Failed to delete expense:', err) }
  }

  const handleDeleteIncome = async (id) => {
    try {
      const { error } = await supabase.from('income').delete().eq('id', id)
      if (error) throw error
      setIncomes((prev) => prev.filter((inc) => inc.id !== id))
      if (selectedIncome?.id === id) setSelectedIncome(null)
    } catch (err) { console.error('Failed to delete income:', err) }
  }

  const handlePaymentSelectionUpdate = ({ selectedCount, pendingPaid, pendingUnpaid, isSaving, saveChanges, cancelChanges }) => {
    setPaymentSelection({ selectedCount, pendingPaid, pendingUnpaid, isSaving, saveChanges, cancelChanges })
  }

  const handlePaymentCancel = () => { paymentSelection.cancelChanges?.() }
  const handlePaymentSave   = () => { paymentSelection.saveChanges?.() }

  // ── Month Modal Handlers ────────────────────────────────────────────────────
  const fetchStudentMonths = async (studentId) => {
    try {
      setIsMonthModalLoading(true)
      const year = new Date().getFullYear()
      const { data, error } = await supabase
        .from('payment_status').select('month, paid').eq('student_id', studentId).eq('year', year)
      if (error) throw error
      const monthMap = {}
      data?.forEach((item) => { monthMap[item.month] = item.paid })
      setStudentMonthStatus(monthMap)
    } catch (err) {
      console.error('Failed to fetch student months:', err)
      setStudentMonthStatus({})
    } finally {
      setIsMonthModalLoading(false)
    }
  }

  const handleOpenMonthModal = async (student) => {
    setSelectedPaymentStudent(student)
    setSelectedMonths(new Set())
    setShowMonthModal(true)
    await fetchStudentMonths(student.id)
  }

  const handleToggleMonth = (month) => {
    if (studentMonthStatus[month]) return
    const next = new Set(selectedMonths)
    if (next.has(month)) next.delete(month); else next.add(month)
    setSelectedMonths(next)
  }

  const handleSaveMonthSelection = async () => {
    if (!selectedPaymentStudent || selectedMonths.size === 0) return
    setIsSavingMonths(true)
    const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
    try {
      const year        = new Date().getFullYear()
      const studentId   = selectedPaymentStudent.id
      const studentName = selectedPaymentStudent.name

      for (const month of Array.from(selectedMonths).sort((a, b) => a - b)) {
        const { data: existingPayment, error } = await supabase
          .from('payment_status').select('*').eq('student_id', studentId).eq('month', month).eq('year', year).maybeSingle()
        if (error) throw error

        if (existingPayment) {
          if (!existingPayment.paid) {
            await supabase.from('payment_status')
              .update({ paid: true, updated_at: new Date().toISOString() }).eq('id', existingPayment.id)
          }
        } else {
          await supabase.from('payment_status')
            .insert([{ student_id: studentId, month, year, paid: true, updated_at: new Date().toISOString() }])
        }

        await supabase.from('income').insert([{
          name: `${studentName} - ${MONTHS[month - 1]} Payment`,
          amount: 10000, source: 'Student Contributions',
          description: `Payment from ${studentName}`,
          created_at: new Date().toISOString(),
        }])
      }

      setShowMonthModal(false)
      setSelectedPaymentStudent(null)
      setSelectedMonths(new Set())
      setStudentMonthStatus({})
      await fetchAdminData(true)
    } catch (err) {
      console.error('Failed to save month selection:', err)
      alert('Gagal menyimpan perubahan. Silakan coba lagi.')
    } finally {
      setIsSavingMonths(false)
    }
  }

  // ── Variants ────────────────────────────────────────────────────────────────
  const containerVariants = {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
  }
  const itemVariants = {
    hidden:  { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-primary via-dark-secondary to-dark-primary">

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      </AnimatePresence>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 glass border-b border-accent/10 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-white">Admin Panel</h1>
            <p className="text-sm text-white/60">by Nopal</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              disabled={isLoading}
              className="mt-2 group relative overflow-hidden px-3 py-2 rounded-xl glass border border-white/10 hover:border-accent/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/10 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center gap-2">
                <RefreshCw
                  size={16}
                  className={`text-accent transition-transform duration-500 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180'}`}
                />
                <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                  {isLoading ? 'Refreshing...' : 'Refresh'}
                </span>
              </div>
            </motion.button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {isLoading ? (
                <RefreshCw size={13} className="text-accent animate-spin" />
              ) : (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
              )}
              <span className="text-xs text-white/30 hidden sm:inline">
                {lastUpdated
                  ? `Update ${lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                  : 'Memuat...'}
              </span>
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setShowNotifForm(true)}
              className="flex items-center gap-2 px-4 py-2 glass hover:bg-violet-500/20 transition-colors rounded-lg">
              <Bell size={18} className="text-violet-400" />
              <span className="text-sm font-medium text-white/80 hidden sm:inline">Notifikasi</span>
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 glass hover:bg-red-500/20 transition-colors rounded-lg">
              <LogOut size={18} className="text-accent" />
              <span className="text-sm font-medium">Logout</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Navigation tabs */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {['overview', 'expenses', 'income', 'payments'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                activeTab === tab ? 'bg-accent text-dark-primary' : 'glass hover:bg-white/10'
              }`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Content */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-6">

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <motion.div variants={itemVariants} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard icon={Wallet} title="Total Kas Kelas"
                value={`Rp ${totalClassCash.toLocaleString('id-ID')}`}
                subtext="Pemasukan − Pengeluaran (real-time)" accentClass="from-accent to-accent-light" />
              <EditableCard icon={TrendingUp} title="Mini Bank" value={financialSummary.mini_bank}
                subtext="Savings account - tap ✏ to edit" accentClass="from-green-500 to-emerald-500"
                onSave={(val) => updateSummaryField('mini_bank', val)} />
              <EditableCard icon={TrendingDown} title="Bendahara" value={financialSummary.treasurer}
                subtext="With treasurer - tap ✏ to edit" accentClass="from-blue-500 to-cyan-500"
                onSave={(val) => updateSummaryField('treasurer', val)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setShowExpenseForm(true)}
                className="glass p-8 text-center hover:bg-white/20 transition-colors rounded-2xl">
                <Plus size={32} className="mx-auto mb-3 text-accent" />
                <p className="text-lg font-display font-bold text-white">Add Expense</p>
                <p className="text-sm text-white/60">Record class expenses with proof</p>
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setShowIncomeForm(true)}
                className="glass p-8 text-center hover:bg-white/20 transition-colors rounded-2xl">
                <Plus size={32} className="mx-auto mb-3 text-accent" />
                <p className="text-lg font-display font-bold text-white">Add Income</p>
                <p className="text-sm text-white/60">Record class income/collections</p>
              </motion.button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="glass p-6 rounded-2xl">
                <h3 className="text-lg font-display font-bold text-white mb-4">Pengeluaran Terakhir</h3>
                <div className="space-y-3 max-h-96 overflow-auto">
                  {expenses.slice(0, 5).map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                      <div>
                        <p className="text-white font-medium">{expense.name}</p>
                        <p className="text-xs text-white/50">{expense.category}</p>
                      </div>
                      <p className="text-accent font-bold">-Rp {expense.amount.toLocaleString('id-ID')}</p>
                    </div>
                  ))}
                  {expenses.length === 0 && <p className="text-white/30 text-sm text-center py-4">Belum ada data.</p>}
                </div>
              </div>
              <div className="glass p-6 rounded-2xl">
                <h3 className="text-lg font-display font-bold text-white mb-4">Pemasukan Terakhir</h3>
                <div className="space-y-3 max-h-96 overflow-auto">
                  {incomes.slice(0, 5).map((income) => (
                    <div key={income.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                      <div>
                        <p className="text-white font-medium">{income.name}</p>
                        <p className="text-xs text-white/50">{income.source}</p>
                      </div>
                      <p className="text-green-500 font-bold">+Rp {income.amount.toLocaleString('id-ID')}</p>
                    </div>
                  ))}
                  {incomes.length === 0 && <p className="text-white/30 text-sm text-center py-4">Belum ada data.</p>}
                </div>
              </div>

              <div className="glass p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-4 gap-3">
                  <div>
                    <h3 className="text-lg font-display font-bold text-white">Yang belum bayar</h3>
                    <p className="text-xs text-white/40 mt-0.5">{monthNames[selectedMonth - 1]} {selectedYear}</p>
                  </div>
                  <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent">
                    {monthNames.map((month, index) => (
                      <option key={index} value={index + 1} className="bg-dark-secondary">{month}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-3 max-h-96 overflow-auto">
                  {unpaidStudents.length > 0 ? (
                    unpaidStudents.map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                        <span className="text-white text-sm">{student.name}</span>
                        <span className="px-2.5 py-1 bg-red-500/20 border border-red-500/40 text-red-300 text-xs rounded-full">❌ Unpaid</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-white/40 text-sm text-center py-6">Semua siswa sudah bayar ✅</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── EXPENSES ── */}
        {activeTab === 'expenses' && (
          <motion.div variants={itemVariants}>
            <div className="glass p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-bold text-white">All Expenses</h2>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setShowExpenseForm(true)}
                  className="px-4 py-2 bg-accent text-dark-primary font-bold rounded-lg hover:shadow-lg transition-shadow">
                  + Add Expense
                </motion.button>
              </div>
              <div className="space-y-3 max-h-[600px] overflow-auto">
                {expenses.map((expense) => (
                  <motion.div key={expense.id} whileHover={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                    onClick={() => setSelectedExpense(expense)}
                    className="flex items-center justify-between p-4 rounded-lg bg-white/5 transition-colors cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{expense.name}</p>
                      <p className="text-xs text-white/50 truncate">{expense.description}</p>
                      {expense.category && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-accent/10 border border-accent/20 text-accent text-xs rounded-full">
                          {expense.category}
                        </span>
                      )}
                    </div>
                    <p className="text-accent font-bold mx-4 shrink-0">-Rp {expense.amount.toLocaleString('id-ID')}</p>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteExpense(expense.id) }}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors shrink-0">
                      <Trash2 size={18} className="text-white/60" />
                    </button>
                  </motion.div>
                ))}
                {expenses.length === 0 && <p className="text-white/40 text-sm text-center py-8">No expenses recorded yet.</p>}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── INCOME ── */}
        {activeTab === 'income' && (
          <motion.div variants={itemVariants}>
            <div className="glass p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-bold text-white">All Income</h2>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setShowIncomeForm(true)}
                  className="px-4 py-2 bg-accent text-dark-primary font-bold rounded-lg hover:shadow-lg transition-shadow">
                  + Add Income
                </motion.button>
              </div>
              <div className="space-y-3 max-h-[600px] overflow-auto">
                {incomes.map((income) => (
                  <motion.div key={income.id} whileHover={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                    onClick={() => setSelectedIncome(income)}
                    className="flex items-center justify-between p-4 rounded-lg bg-white/5 transition-colors cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{income.name}</p>
                      <p className="text-xs text-white/50 truncate">{income.description}</p>
                      {income.source && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded-full">
                          {income.source}
                        </span>
                      )}
                    </div>
                    <p className="text-green-500 font-bold mx-4 shrink-0">+Rp {income.amount.toLocaleString('id-ID')}</p>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteIncome(income.id) }}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors shrink-0">
                      <Trash2 size={18} className="text-white/60" />
                    </button>
                  </motion.div>
                ))}
                {incomes.length === 0 && <p className="text-white/40 text-sm text-center py-8">No income recorded yet.</p>}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── PAYMENTS ── */}
        {activeTab === 'payments' && (
          <motion.div variants={itemVariants} className="pb-28">
            <StudentPaymentManager
              onOpenMonthModal={handleOpenMonthModal}
              onSelectionUpdate={handlePaymentSelectionUpdate}
            />
          </motion.div>
        )}

        {/* ── MODALS ── */}
        {showExpenseForm && <ExpenseForm onClose={() => setShowExpenseForm(false)} onSubmit={handleAddExpense} />}
        {showIncomeForm  && <IncomeForm  onClose={() => setShowIncomeForm(false)}  onSubmit={handleAddIncome}  />}
        {showNotifForm   && <SendNotificationModal onClose={() => setShowNotifForm(false)} />}

        {selectedExpense && (
          <ExpenseDetailModal expense={selectedExpense} onClose={() => setSelectedExpense(null)} onUpdate={handleUpdateExpense} />
        )}
        {selectedIncome && (
          <IncomeDetailModal income={selectedIncome} onClose={() => setSelectedIncome(null)} onUpdate={handleUpdateIncome} />
        )}

        {activeTab === 'payments' && paymentSelection.selectedCount > 0 && (
          <div className="fixed inset-x-0 bottom-0 z-50 bg-dark-secondary/95 backdrop-blur-md border-t border-accent/30 shadow-2xl px-4 py-3 sm:px-6">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">
                  {paymentSelection.selectedCount} student{paymentSelection.selectedCount !== 1 ? 's' : ''} selected
                </p>
                <p className="text-xs text-white/60 mt-1">
                  {paymentSelection.pendingPaid} akan Bayar, {paymentSelection.pendingUnpaid} akan Belum Bayar
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button onClick={handlePaymentCancel}
                  className="w-full sm:w-auto px-4 py-2 glass text-white font-semibold rounded-lg hover:bg-white/20 transition-colors">
                  Cancel
                </button>
                <button onClick={handlePaymentSave} disabled={paymentSelection.isSaving}
                  className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-accent to-accent-light text-dark-primary font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50">
                  {paymentSelection.isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MONTH SELECTION MODAL ── */}
        <AnimatePresence>
          {showMonthModal && (
            <>
              <motion.div key="month-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowMonthModal(false)} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
              <motion.div key="month-modal"
                initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }} transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div className="pointer-events-auto w-full max-w-lg glass rounded-2xl border border-white/10 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}>
                  <div className="relative flex items-center justify-between p-5 border-b border-white/10">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent to-accent-light" />
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-accent/20">
                        <Check size={20} className="text-accent" />
                      </div>
                      <div>
                        <h2 className="text-lg font-display font-bold text-white">Detail Bulan Pembayaran</h2>
                        <p className="text-xs text-white/40 mt-0.5">
                          {selectedPaymentStudent?.name || 'Student'} - {new Date().getFullYear()}
                        </p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setShowMonthModal(false)}
                      className="w-9 h-9 rounded-full bg-white/5 hover:bg-red-500/20 border border-white/10 flex items-center justify-center text-white transition-colors flex-shrink-0">
                      ✕
                    </button>
                  </div>
                  <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
                    <p className="text-sm text-white/50">
                      Klik bulan untuk memilih pembayaran yang ingin disetujui. Bulan yang sudah dibayar tidak dapat diubah.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {monthNames.map((month, idx) => {
                        const monthIndex = idx + 1
                        const paid       = Boolean(studentMonthStatus[monthIndex])
                        const selected   = selectedMonths.has(monthIndex)
                        return (
                          <button key={month} type="button" onClick={() => handleToggleMonth(monthIndex)} disabled={paid}
                            className={`rounded-2xl border px-4 py-3 text-left font-medium transition-all ${
                              paid     ? 'bg-slate-700 text-white border-black cursor-not-allowed'
                              : selected ? 'bg-orange-500 text-white border-black'
                              : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
                            }`}>
                            <div className="flex items-center justify-between gap-2">
                              <span>{month}</span>
                              {paid ? <Check size={16} className="text-white" /> : selected ? <span className="text-white">✓</span> : null}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
                      <p className="text-sm text-white/60">
                        {isMonthModalLoading ? 'Loading month status...'
                          : selectedMonths.size > 0 ? `${selectedMonths.size} bulan dipilih untuk approve.`
                          : 'Pilih bulan untuk disetujui.'}
                      </p>
                      <div className="flex gap-3">
                        <button type="button" onClick={() => setShowMonthModal(false)}
                          className="px-5 py-3 glass text-white rounded-lg hover:bg-white/10 transition-colors">
                          Tutup
                        </button>
                        <button type="button" onClick={handleSaveMonthSelection}
                          disabled={selectedMonths.size === 0 || isSavingMonths}
                          className="px-5 py-3 bg-gradient-to-r from-accent to-accent-light text-dark-primary font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50">
                          {isSavingMonths ? 'Saving...' : 'Approve Selected'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}