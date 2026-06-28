import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LogOut, Plus, Trash2, Pencil, X, Check, Wallet, TrendingUp, TrendingDown,
  Receipt, Tag, FileText, Image as ImageIcon, Save, Bell, Send, Loader2,
  RefreshCw, LayoutDashboard, CreditCard, ChevronLeft, ChevronRight, Search,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { sendPushToAll } from '../lib/pushNotifications'
import ExpenseForm from '../components/ExpenseForm'
import IncomeForm from '../components/IncomeForm'
import StudentPaymentManager from '../components/StudentPaymentManager'

// ─── Design tokens — black / white / orange minimalist ────────────────────────
const T = {
  bg:        '#0c0c0c',
  bg2:       '#141414',
  bg3:       '#1c1c1c',
  border:    'rgba(255,255,255,0.08)',
  borderMd:  'rgba(255,255,255,0.14)',
  text1:     '#f5f5f5',
  text2:     'rgba(245,245,245,0.55)',
  text3:     'rgba(245,245,245,0.28)',
  orange:    '#f97316',
  orangeD:   'rgba(249,115,22,0.12)',
  orangeBdr: 'rgba(249,115,22,0.28)',
  green:     '#4ade80',
  greenD:    'rgba(74,222,128,0.10)',
  greenBdr:  'rgba(74,222,128,0.22)',
  red:       '#f87171',
  redD:      'rgba(248,113,113,0.10)',
  redBdr:    'rgba(248,113,113,0.22)',
  blue:      '#60a5fa',
  blueD:     'rgba(96,165,250,0.10)',
  blueBdr:   'rgba(96,165,250,0.22)',
}

const card = {
  background:   T.bg2,
  border:       `1px solid ${T.border}`,
  borderRadius: '12px',
}

const input = {
  background:   T.bg3,
  border:       `1px solid ${T.border}`,
  borderRadius: '8px',
  color:        T.text1,
  outline:      'none',
  fontFamily:   "'Inter', sans-serif",
  fontSize:     '13px',
  padding:      '9px 13px',
  width:        '100%',
  boxSizing:    'border-box',
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const calcTotalCash = (incomes = [], expenses = []) =>
  incomes.reduce((s, r) => s + (r.amount ?? 0), 0) -
  expenses.reduce((s, r) => s + (r.amount ?? 0), 0)

const monthNames = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
]

// ─── Tab config ────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'overview',  label: 'Overview',    icon: LayoutDashboard },
  { key: 'expenses',  label: 'Pengeluaran', icon: TrendingDown    },
  { key: 'income',    label: 'Pemasukan',   icon: TrendingUp      },
  { key: 'payments',  label: 'Pembayaran',  icon: CreditCard      },
]

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
      style={{
        position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
        zIndex: 9999, display: 'flex', alignItems: 'center', gap: '10px',
        padding: '12px 20px', borderRadius: '14px',
        background: T.bg2, border: `1px solid ${T.greenBdr}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: T.greenD, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Check size={13} color={T.green} />
      </span>
      <span style={{ fontSize: '13px', fontWeight: 600, color: T.text1 }}>{message}</span>
    </motion.div>
  )
}

// ─── Pagination Controls ───────────────────────────────────────────────────────
function Pagination({ page, total, onPrev, onNext }) {
  if (total <= 1) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', gap: '12px' }}>
      <button
        disabled={page === 1}
        onClick={onPrev}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
          borderRadius: '8px', border: `1px solid ${T.border}`, background: page === 1 ? T.bg3 : T.orangeD,
          color: page === 1 ? T.text3 : T.orange, cursor: page === 1 ? 'not-allowed' : 'pointer',
          fontSize: '12px', fontWeight: 700, fontFamily: "'Inter', sans-serif",
        }}
      >
        <ChevronLeft size={14} /> Prev
      </button>
      <span style={{ fontSize: '12px', color: T.text2, fontWeight: 600 }}>
        Hal. {page} / {total}
      </span>
      <button
        disabled={page === total}
        onClick={onNext}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
          borderRadius: '8px', border: `1px solid ${T.border}`, background: page === total ? T.bg3 : T.orangeD,
          color: page === total ? T.text3 : T.orange, cursor: page === total ? 'not-allowed' : 'pointer',
          fontSize: '12px', fontWeight: 700, fontFamily: "'Inter', sans-serif",
        }}
      >
        Next <ChevronRight size={14} />
      </button>
    </div>
  )
}

// ─── Search + Rows-per-page toolbar ───────────────────────────────────────────
function TableToolbar({ search, onSearch, rowsPerPage, onRowsPerPage, placeholder }) {
  return (
    <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
        <Search size={14} color={T.text3} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <input
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder={placeholder || 'Cari...'}
          style={{ ...input, paddingLeft: '36px' }}
        />
      </div>
      <select
        value={rowsPerPage}
        onChange={e => onRowsPerPage(Number(e.target.value))}
        style={{ ...input, width: 'auto', minWidth: '80px', cursor: 'pointer' }}
      >
        {[10, 25, 50, 100].map(n => <option key={n} value={n} style={{ background: T.bg2 }}>{n}</option>)}
      </select>
    </div>
  )
}

// ─── Section label ──────────────────────────────────────────────────────────────
function Label({ children }) {
  return (
    <p style={{ fontSize: '10px', fontWeight: 700, color: T.text3, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
      {children}
    </p>
  )
}

// ─── Pill tag ──────────────────────────────────────────────────────────────────
function Pill({ color, dim, bdr, children }) {
  return (
    <span style={{ display: 'inline-block', padding: '2px 10px', background: dim, border: `1px solid ${bdr}`, color, borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>
      {children}
    </span>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={{ height: '58px', borderRadius: '10px', background: T.bg3, animation: 'pulse 1.5s ease-in-out infinite' }} />
  )
}

// ─── Stat / Editable cards ─────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, accentColor, accentDim, accentBdr }) {
  return (
    <div style={{ ...card, padding: '20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: accentColor }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <div style={{ padding: '8px', borderRadius: '9px', background: accentDim }}>
          <Icon size={18} color={accentColor} />
        </div>
        <span style={{ fontSize: '11px', fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{label}</span>
      </div>
      <p style={{ fontSize: '22px', fontWeight: 900, color: T.text1, margin: 0 }}>{value}</p>
      <p style={{ fontSize: '11px', color: T.text3, margin: '5px 0 0' }}>{sub}</p>
    </div>
  )
}

function EditableCard({ icon: Icon, label, value, sub, accentColor, accentDim, accentBdr, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState('')
  const [saving, setSaving]   = useState(false)

  const startEdit = () => { setDraft(String(value)); setEditing(true) }
  const cancel    = () => setEditing(false)
  const save = async () => {
    const num = parseFloat(String(draft).replace(/[^0-9.-]/g, ''))
    if (isNaN(num)) return
    setSaving(true)
    await onSave(num)
    setSaving(false)
    setEditing(false)
  }

  return (
    <div style={{ ...card, padding: '20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: accentColor }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '8px', borderRadius: '9px', background: accentDim }}>
            <Icon size={18} color={accentColor} />
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{label}</span>
        </div>
        {!editing ? (
          <motion.button whileTap={{ scale: 0.9 }} onClick={startEdit}
            style={{ padding: '6px', borderRadius: '7px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}>
            <Pencil size={14} color={T.text3} />
          </motion.button>
        ) : (
          <div style={{ display: 'flex', gap: '4px' }}>
            <motion.button whileTap={{ scale: 0.9 }} onClick={cancel}
              style={{ padding: '6px', borderRadius: '7px', background: T.bg3, border: 'none', cursor: 'pointer', display: 'flex' }}>
              <X size={14} color={T.text2} />
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={save} disabled={saving}
              style={{ padding: '6px', borderRadius: '7px', background: T.greenD, border: 'none', cursor: 'pointer', display: 'flex', opacity: saving ? 0.5 : 1 }}>
              <Check size={14} color={T.green} />
            </motion.button>
          </div>
        )}
      </div>
      <AnimatePresence mode="wait">
        {editing ? (
          <motion.input key="inp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            type="number" value={draft} onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel() }}
            autoFocus style={{ ...input, fontSize: '18px', fontWeight: 800 }} />
        ) : (
          <motion.p key="val" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ fontSize: '22px', fontWeight: 900, color: T.text1, margin: 0 }}>
            Rp {Number(value).toLocaleString('id-ID')}
          </motion.p>
        )}
      </AnimatePresence>
      <p style={{ fontSize: '11px', color: T.text3, margin: '6px 0 0' }}>{sub}</p>
    </div>
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

  return (
    <AnimatePresence>
      <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} />
      <motion.div key="md" initial={{ opacity: 0, scale: 0.93, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 24 }} transition={{ type: 'spring', damping: 24, stiffness: 320 }}
        style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', pointerEvents: 'none' }}>
        <div onClick={e => e.stopPropagation()}
          style={{ pointerEvents: 'auto', width: '100%', maxWidth: '500px', background: T.bg2, border: `1px solid ${T.border}`, borderRadius: '16px', overflow: 'hidden' }}>
          {/* header */}
          <div style={{ position: 'relative', padding: '18px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: T.orange }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '8px', background: T.orangeD, borderRadius: '9px' }}>
                <Receipt size={18} color={T.orange} />
              </div>
              <div>
                <p style={{ fontWeight: 800, fontSize: '15px', color: T.text1, margin: 0 }}>Detail Pengeluaran</p>
                <p style={{ fontSize: '11px', color: T.text3, margin: '2px 0 0' }}>
                  {expense.created_at ? new Date(expense.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {isEditing ? (
                <>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsEditing(false)}
                    style={{ padding: '7px', borderRadius: '8px', background: T.bg3, border: 'none', cursor: 'pointer', display: 'flex' }}>
                    <X size={15} color={T.text2} />
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={handleSave} disabled={saving}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', background: T.orange, border: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '12px', color: '#000', opacity: saving ? 0.5 : 1 }}>
                    <Save size={13} /> {saving ? '...' : 'Simpan'}
                  </motion.button>
                </>
              ) : (
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsEditing(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 13px', borderRadius: '8px', background: T.orangeD, border: `1px solid ${T.orangeBdr}`, cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '12px', color: T.orange }}>
                  <Pencil size={13} /> Edit
                </motion.button>
              )}
              <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
                style={{ padding: '7px', borderRadius: '8px', background: T.bg3, border: `1px solid ${T.border}`, cursor: 'pointer', display: 'flex' }}>
                <X size={15} color={T.text2} />
              </motion.button>
            </div>
          </div>
          {/* body */}
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '65vh', overflowY: 'auto' }}>
            <div>
              <Label><FileText size={10} /> Nama Pengeluaran</Label>
              {isEditing ? <input style={input} value={draft.name} onChange={e => setDraft(p => ({ ...p, name: e.target.value }))} />
                : <p style={{ fontWeight: 700, fontSize: '16px', color: T.text1, margin: 0 }}>{expense.name || '-'}</p>}
            </div>
            <div>
              <Label><Tag size={10} /> Kategori</Label>
              {isEditing ? <input style={input} value={draft.category} onChange={e => setDraft(p => ({ ...p, category: e.target.value }))} />
                : expense.category ? <Pill color={T.orange} dim={T.orangeD} bdr={T.orangeBdr}>{expense.category}</Pill>
                : <p style={{ fontSize: '13px', color: T.text3 }}>—</p>}
            </div>
            <div>
              <Label><Wallet size={10} /> Jumlah</Label>
              {isEditing ? <input style={input} type="number" value={draft.amount} onChange={e => setDraft(p => ({ ...p, amount: e.target.value }))} />
                : <p style={{ fontSize: '24px', fontWeight: 900, color: T.orange, margin: 0 }}>−Rp {Number(expense.amount).toLocaleString('id-ID')}</p>}
            </div>
            <div>
              <Label><FileText size={10} /> Deskripsi</Label>
              {isEditing ? <textarea rows={3} style={{ ...input, resize: 'none' }} value={draft.description} onChange={e => setDraft(p => ({ ...p, description: e.target.value }))} />
                : <p style={{ fontSize: '13px', color: T.text2, lineHeight: 1.6, margin: 0 }}>{expense.description || <span style={{ color: T.text3 }}>—</span>}</p>}
            </div>
            <div>
              <Label><ImageIcon size={10} /> Bukti Pembayaran</Label>
              {expense.proof_image_url ? (
                <div style={{ borderRadius: '10px', overflow: 'hidden', border: `1px solid ${T.border}` }}>
                  <img src={`https://fxxjfkcjtuuxbrxhfrph.supabase.co/storage/v1/object/public/expense-proofs/${expense.proof_image_url}`}
                    alt="Bukti" style={{ width: '100%', maxHeight: '240px', objectFit: 'contain', background: T.bg3 }} />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '28px', border: `1px dashed ${T.border}`, borderRadius: '10px', color: T.text3, gap: '8px' }}>
                  <ImageIcon size={24} />
                  <p style={{ fontSize: '12px', margin: 0 }}>Tidak ada bukti</p>
                </div>
              )}
            </div>
          </div>
          <div style={{ padding: '14px 20px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: '8px', background: T.bg3, border: `1px solid ${T.border}`, color: T.text2, cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '13px' }}>Tutup</button>
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

  return (
    <AnimatePresence>
      <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} />
      <motion.div key="md" initial={{ opacity: 0, scale: 0.93, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 24 }} transition={{ type: 'spring', damping: 24, stiffness: 320 }}
        style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', pointerEvents: 'none' }}>
        <div onClick={e => e.stopPropagation()}
          style={{ pointerEvents: 'auto', width: '100%', maxWidth: '500px', background: T.bg2, border: `1px solid ${T.border}`, borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ position: 'relative', padding: '18px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: T.green }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '8px', background: T.greenD, borderRadius: '9px' }}>
                <TrendingUp size={18} color={T.green} />
              </div>
              <div>
                <p style={{ fontWeight: 800, fontSize: '15px', color: T.text1, margin: 0 }}>Detail Pemasukan</p>
                <p style={{ fontSize: '11px', color: T.text3, margin: '2px 0 0' }}>
                  {income.created_at ? new Date(income.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {isEditing ? (
                <>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsEditing(false)}
                    style={{ padding: '7px', borderRadius: '8px', background: T.bg3, border: 'none', cursor: 'pointer', display: 'flex' }}>
                    <X size={15} color={T.text2} />
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={handleSave} disabled={saving}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', background: T.green, border: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '12px', color: '#000', opacity: saving ? 0.5 : 1 }}>
                    <Save size={13} /> {saving ? '...' : 'Simpan'}
                  </motion.button>
                </>
              ) : (
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsEditing(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 13px', borderRadius: '8px', background: T.greenD, border: `1px solid ${T.greenBdr}`, cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '12px', color: T.green }}>
                  <Pencil size={13} /> Edit
                </motion.button>
              )}
              <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
                style={{ padding: '7px', borderRadius: '8px', background: T.bg3, border: `1px solid ${T.border}`, cursor: 'pointer', display: 'flex' }}>
                <X size={15} color={T.text2} />
              </motion.button>
            </div>
          </div>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '65vh', overflowY: 'auto' }}>
            <div>
              <Label><FileText size={10} /> Nama Pemasukan</Label>
              {isEditing ? <input style={input} value={draft.name} onChange={e => setDraft(p => ({ ...p, name: e.target.value }))} />
                : <p style={{ fontWeight: 700, fontSize: '16px', color: T.text1, margin: 0 }}>{income.name || '-'}</p>}
            </div>
            <div>
              <Label><Tag size={10} /> Sumber</Label>
              {isEditing ? <input style={input} value={draft.source} onChange={e => setDraft(p => ({ ...p, source: e.target.value }))} />
                : income.source ? <Pill color={T.green} dim={T.greenD} bdr={T.greenBdr}>{income.source}</Pill>
                : <p style={{ fontSize: '13px', color: T.text3 }}>—</p>}
            </div>
            <div>
              <Label><Wallet size={10} /> Jumlah</Label>
              {isEditing ? <input style={input} type="number" value={draft.amount} onChange={e => setDraft(p => ({ ...p, amount: e.target.value }))} />
                : <p style={{ fontSize: '24px', fontWeight: 900, color: T.green, margin: 0 }}>+Rp {Number(income.amount).toLocaleString('id-ID')}</p>}
            </div>
            <div>
              <Label><FileText size={10} /> Deskripsi</Label>
              {isEditing ? <textarea rows={3} style={{ ...input, resize: 'none' }} value={draft.description} onChange={e => setDraft(p => ({ ...p, description: e.target.value }))} />
                : <p style={{ fontSize: '13px', color: T.text2, lineHeight: 1.6, margin: 0 }}>{income.description || <span style={{ color: T.text3 }}>—</span>}</p>}
            </div>
          </div>
          <div style={{ padding: '14px 20px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: '8px', background: T.bg3, border: `1px solid ${T.border}`, color: T.text2, cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '13px' }}>Tutup</button>
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
      setTimeout(onClose, 1500)
    } catch (err) {
      setErrMsg(err?.message || 'Gagal mengirim notifikasi')
      setStatus('error')
    }
  }

  return (
    <AnimatePresence>
      <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} />
      <motion.div key="md" initial={{ opacity: 0, scale: 0.93, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 24 }} transition={{ type: 'spring', damping: 24, stiffness: 320 }}
        style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', pointerEvents: 'none' }}>
        <div onClick={e => e.stopPropagation()}
          style={{ pointerEvents: 'auto', width: '100%', maxWidth: '440px', background: T.bg2, border: `1px solid ${T.border}`, borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ position: 'relative', padding: '18px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: T.orange }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '8px', background: T.orangeD, borderRadius: '9px' }}>
                <Bell size={18} color={T.orange} />
              </div>
              <div>
                <p style={{ fontWeight: 800, fontSize: '15px', color: T.text1, margin: 0 }}>Kirim Notifikasi</p>
                <p style={{ fontSize: '11px', color: T.text3, margin: '2px 0 0' }}>Ke semua student yang subscribed</p>
              </div>
            </div>
            <button onClick={onClose} style={{ padding: '7px', borderRadius: '8px', background: T.bg3, border: `1px solid ${T.border}`, cursor: 'pointer', display: 'flex' }}>
              <X size={15} color={T.text2} />
            </button>
          </div>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <Label>Judul</Label>
              <input style={input} value={title} onChange={e => setTitle(e.target.value)} placeholder="Contoh: Pengingat Iuran" maxLength={80}
                disabled={status === 'sending' || status === 'success'} />
            </div>
            <div>
              <Label>Pesan</Label>
              <textarea rows={4} style={{ ...input, resize: 'none' }} value={body} onChange={e => setBody(e.target.value)}
                placeholder="Isi pesan notifikasi..." maxLength={200} disabled={status === 'sending' || status === 'success'} />
              <p style={{ textAlign: 'right', fontSize: '11px', color: T.text3, margin: '4px 0 0' }}>{body.length}/200</p>
            </div>
            {status === 'error' && (
              <p style={{ fontSize: '12px', color: T.red, background: T.redD, border: `1px solid ${T.redBdr}`, borderRadius: '8px', padding: '10px 12px', margin: 0 }}>⚠ {errMsg}</p>
            )}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSend}
              disabled={!title.trim() || !body.trim() || status === 'sending' || status === 'success'}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: '13px',
                background: status === 'success' ? T.green : T.orange,
                color: '#000', opacity: (!title.trim() || !body.trim() || status === 'sending') ? 0.5 : 1,
                transition: 'all 0.2s',
              }}
            >
              {status === 'sending' ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Mengirim...</>
                : status === 'success' ? <>✓ Berhasil!</>
                : <><Send size={15} /> Kirim Notifikasi</>}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Mini row (overview recent list) ──────────────────────────────────────────
function MiniRow({ name, sub, amount, amountColor }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '9px', background: T.bg3 }}>
      <div style={{ minWidth: 0, marginRight: '10px' }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: T.text1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
        {sub && <p style={{ fontSize: '11px', color: T.text3, margin: '1px 0 0' }}>{sub}</p>}
      </div>
      <p style={{ fontSize: '13px', fontWeight: 800, color: amountColor, margin: 0, flexShrink: 0 }}>{amount}</p>
    </div>
  )
}

// ─── Expense row ───────────────────────────────────────────────────────────────
function ExpenseRow({ expense, onClick, onDelete }) {
  return (
    <motion.div
      whileHover={{ background: 'rgba(255,255,255,0.04)' }}
      onClick={() => onClick(expense)}
      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '10px', background: T.bg3, cursor: 'pointer', transition: 'background 0.15s' }}
    >
      <div style={{ padding: '8px', background: T.orangeD, borderRadius: '9px', flexShrink: 0 }}>
        <TrendingDown size={16} color={T.orange} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: T.text1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{expense.name}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '3px', alignItems: 'center' }}>
          {expense.category && <Pill color={T.orange} dim={T.orangeD} bdr={T.orangeBdr}>{expense.category}</Pill>}
          <span style={{ fontSize: '11px', color: T.text3 }}>{expense.created_at ? new Date(expense.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</span>
        </div>
      </div>
      <p style={{ fontSize: '13px', fontWeight: 800, color: T.orange, flexShrink: 0, margin: 0 }}>−Rp {expense.amount.toLocaleString('id-ID')}</p>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={e => { e.stopPropagation(); onDelete(expense.id) }}
        style={{ padding: '7px', borderRadius: '8px', background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0, display: 'flex' }}
      >
        <Trash2 size={15} color={T.text3} />
      </motion.button>
    </motion.div>
  )
}

// ─── Income row ────────────────────────────────────────────────────────────────
function IncomeRow({ income, onClick, onDelete }) {
  return (
    <motion.div
      whileHover={{ background: 'rgba(255,255,255,0.04)' }}
      onClick={() => onClick(income)}
      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '10px', background: T.bg3, cursor: 'pointer', transition: 'background 0.15s' }}
    >
      <div style={{ padding: '8px', background: T.greenD, borderRadius: '9px', flexShrink: 0 }}>
        <TrendingUp size={16} color={T.green} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: T.text1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{income.name}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '3px', alignItems: 'center' }}>
          {income.source && <Pill color={T.green} dim={T.greenD} bdr={T.greenBdr}>{income.source}</Pill>}
          <span style={{ fontSize: '11px', color: T.text3 }}>{income.created_at ? new Date(income.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</span>
        </div>
      </div>
      <p style={{ fontSize: '13px', fontWeight: 800, color: T.green, flexShrink: 0, margin: 0 }}>+Rp {income.amount.toLocaleString('id-ID')}</p>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={e => { e.stopPropagation(); onDelete(income.id) }}
        style={{ padding: '7px', borderRadius: '8px', background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0, display: 'flex' }}
      >
        <Trash2 size={15} color={T.text3} />
      </motion.button>
    </motion.div>
  )
}

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

  // Expense table state
  const [expSearch, setExpSearch]           = useState('')
  const [expRows, setExpRows]               = useState(10)
  const [expPage, setExpPage]               = useState(1)

  // Income table state
  const [incSearch, setIncSearch]           = useState('')
  const [incRows, setIncRows]               = useState(10)
  const [incPage, setIncPage]               = useState(1)

  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1)
  const [selectedYear, setSelectedYear]   = useState(currentDate.getFullYear())

  const [unpaidStudents, setUnpaidStudents]     = useState([])
  const [paymentSelection, setPaymentSelection] = useState({
    selectedCount: 0, pendingPaid: 0, pendingUnpaid: 0, isSaving: false, saveChanges: null, cancelChanges: null,
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
      setUnpaidStudents(allStudents.filter(s => {
        const p = monthlyPayments.find(m => m.student_id === s.id)
        return !p || p.paid === false
      }))
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

  useEffect(() => { fetchAdminData(false) }, [fetchAdminData])

  // Reset pages on search/rows change
  useEffect(() => { setExpPage(1) }, [expSearch, expRows])
  useEffect(() => { setIncPage(1) }, [incSearch, incRows])

  // ── Derived ─────────────────────────────────────────────────────────────────
  const totalClassCash = calcTotalCash(incomes, expenses)

  // Expense filter
  const filteredExp = expenses.filter(e => {
    const kw = expSearch.toLowerCase()
    return e.name?.toLowerCase().includes(kw) || e.category?.toLowerCase().includes(kw) || e.description?.toLowerCase().includes(kw)
  })
  const totalExpPages = Math.ceil(filteredExp.length / expRows)
  const pagedExp = filteredExp.slice((expPage - 1) * expRows, expPage * expRows)

  // Income filter
  const filteredInc = incomes.filter(i => {
    const kw = incSearch.toLowerCase()
    return i.name?.toLowerCase().includes(kw) || i.source?.toLowerCase().includes(kw) || i.description?.toLowerCase().includes(kw)
  })
  const totalIncPages = Math.ceil(filteredInc.length / incRows)
  const pagedInc = filteredInc.slice((incPage - 1) * incRows, incPage * incRows)

  const totalIncome  = incomes.reduce((s, r) => s + (r.amount ?? 0), 0)
  const totalExpense = expenses.reduce((s, r) => s + (r.amount ?? 0), 0)

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleRefresh = async () => { await fetchAdminData(true); setToast('Data berhasil diperbarui!') }
  const handleLogout  = () => { logout(); navigate('/login') }

  const updateSummaryField = async (field, value) => {
    try {
      if (summaryId) {
        await supabase.from('financial_summary').update({ [field]: value }).eq('id', summaryId)
      } else {
        const { data } = await supabase.from('financial_summary').insert([{ [field]: value }]).select().single()
        setSummaryId(data.id)
      }
      setFinancialSummary(prev => ({ ...prev, [field]: value }))
    } catch (err) { console.error(err) }
  }

  const handleUpdateExpense = async (id, data) => {
    try {
      await supabase.from('expenses').update(data).eq('id', id)
      setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...data } : e))
      setSelectedExpense(prev => prev?.id === id ? { ...prev, ...data } : prev)
    } catch (err) { console.error(err) }
  }

  const handleUpdateIncome = async (id, data) => {
    try {
      await supabase.from('income').update(data).eq('id', id)
      setIncomes(prev => prev.map(i => i.id === id ? { ...i, ...data } : i))
      setSelectedIncome(prev => prev?.id === id ? { ...prev, ...data } : prev)
    } catch (err) { console.error(err) }
  }

  const handleAddExpense = async (data) => {
    try { await supabase.from('expenses').insert([data]); setShowExpenseForm(false); fetchAdminData(true) }
    catch (err) { console.error(err) }
  }

  const handleAddIncome = async (data) => {
    try { await supabase.from('income').insert([data]); setShowIncomeForm(false); fetchAdminData(true) }
    catch (err) { console.error(err) }
  }

  const handleDeleteExpense = async (id) => {
    try {
      await supabase.from('expenses').delete().eq('id', id)
      setExpenses(prev => prev.filter(e => e.id !== id))
      if (selectedExpense?.id === id) setSelectedExpense(null)
    } catch (err) { console.error(err) }
  }

  const handleDeleteIncome = async (id) => {
    try {
      await supabase.from('income').delete().eq('id', id)
      setIncomes(prev => prev.filter(i => i.id !== id))
      if (selectedIncome?.id === id) setSelectedIncome(null)
    } catch (err) { console.error(err) }
  }

  const handlePaymentSelectionUpdate = (sel) => setPaymentSelection(sel)

  // Month modal
  const fetchStudentMonths = async (studentId) => {
    try {
      setIsMonthModalLoading(true)
      const year = new Date().getFullYear()
      const { data } = await supabase.from('payment_status').select('month, paid').eq('student_id', studentId).eq('year', year)
      const map = {}
      data?.forEach(item => { map[item.month] = item.paid })
      setStudentMonthStatus(map)
    } catch (err) { setStudentMonthStatus({}) }
    finally { setIsMonthModalLoading(false) }
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
      const year = new Date().getFullYear()
      const { id: studentId, name: studentName } = selectedPaymentStudent
      for (const month of Array.from(selectedMonths).sort((a, b) => a - b)) {
        const { data: existing } = await supabase.from('payment_status').select('*').eq('student_id', studentId).eq('month', month).eq('year', year).maybeSingle()
        if (existing) {
          if (!existing.paid) await supabase.from('payment_status').update({ paid: true, updated_at: new Date().toISOString() }).eq('id', existing.id)
        } else {
          await supabase.from('payment_status').insert([{ student_id: studentId, month, year, paid: true, updated_at: new Date().toISOString() }])
        }
        await supabase.from('income').insert([{
          name: `${studentName} - ${MONTHS[month - 1]} Payment`,
          amount: 10000, source: 'Student Contributions',
          description: `Payment from ${studentName}`, created_at: new Date().toISOString(),
        }])
      }
      setShowMonthModal(false)
      setSelectedPaymentStudent(null)
      setSelectedMonths(new Set())
      setStudentMonthStatus({})
      await fetchAdminData(true)
      setToast('Pembayaran berhasil disimpan!')
    } catch (err) {
      console.error(err)
      alert('Gagal menyimpan. Silakan coba lagi.')
    } finally {
      setIsSavingMonths(false)
    }
  }

  const cV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.05 } } }
  const iV = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Inter', sans-serif", position: 'relative', overflowX: 'hidden' }}>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      </AnimatePresence>

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
        style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(12,12,12,0.92)', borderBottom: `1px solid ${T.border}`, backdropFilter: 'blur(20px)' }}>
        <div className="adm-header">
          {/* Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 900, margin: 0, color: T.text1, letterSpacing: '-0.3px' }}>Admin Panel</h1>
              <p style={{ fontSize: '10px', color: T.text3, margin: '1px 0 0', textTransform: 'uppercase', letterSpacing: '1.2px' }}>by nopal</p>
            </div>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={handleRefresh} disabled={isLoading}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '8px',
                background: T.orangeD, border: `1px solid ${T.orangeBdr}`, color: T.orange,
                fontSize: '12px', fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer',
                fontFamily: "'Inter', sans-serif", opacity: isLoading ? 0.5 : 1, whiteSpace: 'nowrap',
              }}>
              <RefreshCw size={13} color={T.orange} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
              <span className="adm-refresh-label">{isLoading ? 'Refreshing...' : 'Refresh'}</span>
            </motion.button>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              {isLoading
                ? <RefreshCw size={11} color={T.orange} style={{ animation: 'spin 1s linear infinite' }} />
                : <span style={{ position: 'relative', display: 'inline-flex', width: '7px', height: '7px' }}>
                    <span className="adm-ping" />
                    <span style={{ position: 'relative', width: '7px', height: '7px', borderRadius: '50%', background: T.green, display: 'block' }} />
                  </span>}
              <span className="adm-last-updated" style={{ fontSize: '11px', color: T.text3 }}>
                {lastUpdated ? lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Memuat...'}
              </span>
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setShowNotifForm(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '8px', background: T.bg3, border: `1px solid ${T.border}`, color: T.text2, fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
              <Bell size={14} color={T.orange} />
              <span className="adm-notif-label">Notifikasi</span>
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '8px', background: T.redD, border: `1px solid ${T.redBdr}`, color: T.red, fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
              <LogOut size={14} />
              <span className="adm-logout-label">Logout</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* ── Desktop Tabs ── */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '20px 16px 0' }}>
        <div className="adm-tabs-row" style={{ display: 'flex', gap: '6px', marginBottom: '20px', overflowX: 'auto' }}>
          {TABS.map(({ key, label }) => (
            <motion.button key={key} whileTap={{ scale: 0.96 }}
              onClick={() => setActiveTab(key)}
              style={{
                padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: "'Inter', sans-serif", transition: 'all 0.18s',
                ...(activeTab === key
                  ? { background: T.orange, color: '#000', border: 'none' }
                  : { background: 'transparent', color: T.text3, border: `1px solid ${T.border}` }),
              }}>
              {label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <motion.div variants={cV} initial="hidden" animate="visible"
        className="adm-content"
        style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px 60px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <>
            <motion.div variants={iV} className="adm-stat-grid">
              <StatCard icon={Wallet} label="Total Kas Kelas"
                value={`Rp ${totalClassCash.toLocaleString('id-ID')}`} sub="Pemasukan − Pengeluaran"
                accentColor={T.orange} accentDim={T.orangeD} accentBdr={T.orangeBdr} />
              <EditableCard icon={TrendingUp} label="Mini Bank" value={financialSummary.mini_bank}
                sub="Tekan ✏ untuk edit" accentColor={T.green} accentDim={T.greenD} accentBdr={T.greenBdr}
                onSave={val => updateSummaryField('mini_bank', val)} />
              <EditableCard icon={TrendingDown} label="Bendahara" value={financialSummary.treasurer}
                sub="Tekan ✏ untuk edit" accentColor={T.blue} accentDim={T.blueD} accentBdr={T.blueBdr}
                onSave={val => updateSummaryField('treasurer', val)} />
            </motion.div>

            <motion.div variants={iV} className="adm-action-grid">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => setShowExpenseForm(true)}
                style={{ ...card, padding: '28px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', cursor: 'pointer', border: `1px dashed ${T.orangeBdr}` }}>
                <div style={{ padding: '12px', background: T.orangeD, borderRadius: '12px' }}>
                  <Plus size={22} color={T.orange} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontWeight: 800, fontSize: '14px', color: T.text1, margin: 0 }}>Tambah Pengeluaran</p>
                  <p style={{ fontSize: '12px', color: T.text3, margin: '3px 0 0' }}>Catat pengeluaran kelas</p>
                </div>
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => setShowIncomeForm(true)}
                style={{ ...card, padding: '28px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', cursor: 'pointer', border: `1px dashed ${T.greenBdr}` }}>
                <div style={{ padding: '12px', background: T.greenD, borderRadius: '12px' }}>
                  <Plus size={22} color={T.green} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontWeight: 800, fontSize: '14px', color: T.text1, margin: 0 }}>Tambah Pemasukan</p>
                  <p style={{ fontSize: '12px', color: T.text3, margin: '3px 0 0' }}>Catat pemasukan / iuran</p>
                </div>
              </motion.button>
            </motion.div>

            <motion.div variants={iV} className="adm-recent-grid">
              <div style={{ ...card, padding: '18px 20px' }}>
                <p style={{ fontWeight: 800, fontSize: '14px', color: T.text1, margin: '0 0 12px' }}>Pengeluaran Terakhir</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {expenses.slice(0, 5).map(e => <MiniRow key={e.id} name={e.name} sub={e.category} amount={`−Rp ${e.amount.toLocaleString('id-ID')}`} amountColor={T.orange} />)}
                  {expenses.length === 0 && <p style={{ fontSize: '12px', color: T.text3, textAlign: 'center', padding: '16px 0' }}>Belum ada data</p>}
                </div>
              </div>
              <div style={{ ...card, padding: '18px 20px' }}>
                <p style={{ fontWeight: 800, fontSize: '14px', color: T.text1, margin: '0 0 12px' }}>Pemasukan Terakhir</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {incomes.slice(0, 5).map(i => <MiniRow key={i.id} name={i.name} sub={i.source} amount={`+Rp ${i.amount.toLocaleString('id-ID')}`} amountColor={T.green} />)}
                  {incomes.length === 0 && <p style={{ fontSize: '12px', color: T.text3, textAlign: 'center', padding: '16px 0' }}>Belum ada data</p>}
                </div>
              </div>
              <div style={{ ...card, padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px', gap: '8px', flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: '14px', color: T.text1, margin: 0 }}>Belum Bayar</p>
                    <p style={{ fontSize: '11px', color: T.text3, margin: '2px 0 0' }}>{monthNames[selectedMonth - 1]} {selectedYear}</p>
                  </div>
                  <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}
                    style={{ ...input, width: 'auto', padding: '6px 10px', fontSize: '12px' }}>
                    {monthNames.map((m, i) => <option key={i} value={i + 1} style={{ background: T.bg2 }}>{m}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto' }}>
                  {unpaidStudents.length > 0
                    ? unpaidStudents.map(s => (
                      <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderRadius: '9px', background: T.bg3 }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: T.text1 }}>{s.name}</span>
                        <span style={{ padding: '2px 10px', background: T.redD, border: `1px solid ${T.redBdr}`, color: T.red, borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>Belum</span>
                      </div>
                    ))
                    : <p style={{ fontSize: '12px', color: T.text3, textAlign: 'center', padding: '16px 0' }}>Semua sudah bayar ✅</p>}
                </div>
              </div>
            </motion.div>
          </>
        )}

        {/* ── EXPENSES ── */}
        {activeTab === 'expenses' && (
          <motion.div variants={iV}>
            <div style={{ ...card, padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 900, color: T.text1, margin: 0 }}>Pengeluaran</h2>
                  <p style={{ fontSize: '12px', color: T.text3, margin: '4px 0 0' }}>
                    {filteredExp.length} transaksi &bull; <span style={{ color: T.orange, fontWeight: 700 }}>−Rp {totalExpense.toLocaleString('id-ID')}</span>
                  </p>
                </div>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={() => setShowExpenseForm(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '9px', background: T.orange, border: 'none', color: '#000', fontWeight: 800, fontSize: '13px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                  <Plus size={15} /> Tambah
                </motion.button>
              </div>
              <TableToolbar search={expSearch} onSearch={setExpSearch} rowsPerPage={expRows} onRowsPerPage={setExpRows} placeholder="Cari pengeluaran..." />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '560px', overflowY: 'auto' }}>
                {isLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} />)
                  : pagedExp.length > 0 ? pagedExp.map(e => <ExpenseRow key={e.id} expense={e} onClick={setSelectedExpense} onDelete={handleDeleteExpense} />)
                  : <p style={{ fontSize: '13px', color: T.text3, textAlign: 'center', padding: '32px 0' }}>Tidak ada data.</p>}
              </div>
              <Pagination page={expPage} total={totalExpPages} onPrev={() => setExpPage(p => p - 1)} onNext={() => setExpPage(p => p + 1)} />
            </div>
          </motion.div>
        )}

        {/* ── INCOME ── */}
        {activeTab === 'income' && (
          <motion.div variants={iV}>
            <div style={{ ...card, padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 900, color: T.text1, margin: 0 }}>Pemasukan</h2>
                  <p style={{ fontSize: '12px', color: T.text3, margin: '4px 0 0' }}>
                    {filteredInc.length} transaksi &bull; <span style={{ color: T.green, fontWeight: 700 }}>+Rp {totalIncome.toLocaleString('id-ID')}</span>
                  </p>
                </div>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={() => setShowIncomeForm(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '9px', background: T.green, border: 'none', color: '#000', fontWeight: 800, fontSize: '13px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                  <Plus size={15} /> Tambah
                </motion.button>
              </div>
              <TableToolbar search={incSearch} onSearch={setIncSearch} rowsPerPage={incRows} onRowsPerPage={setIncRows} placeholder="Cari pemasukan..." />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '560px', overflowY: 'auto' }}>
                {isLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} />)
                  : pagedInc.length > 0 ? pagedInc.map(i => <IncomeRow key={i.id} income={i} onClick={setSelectedIncome} onDelete={handleDeleteIncome} />)
                  : <p style={{ fontSize: '13px', color: T.text3, textAlign: 'center', padding: '32px 0' }}>Tidak ada data.</p>}
              </div>
              <Pagination page={incPage} total={totalIncPages} onPrev={() => setIncPage(p => p - 1)} onNext={() => setIncPage(p => p + 1)} />
            </div>
          </motion.div>
        )}

        {/* ── PAYMENTS ── */}
        {activeTab === 'payments' && (
          <motion.div variants={iV} style={{ paddingBottom: '100px' }}>
            <StudentPaymentManager onOpenMonthModal={handleOpenMonthModal} onSelectionUpdate={handlePaymentSelectionUpdate} />
          </motion.div>
        )}
      </motion.div>

      {/* ── Mobile Bottom Navigation ── */}
      <div className="adm-bottom-nav">
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key
          const iconColor = isActive
            ? key === 'income'   ? T.green
            : key === 'expenses' ? T.orange
            : key === 'payments' ? T.blue
            : T.orange
            : T.text3

          return (
            <motion.button
              key={key}
              whileTap={{ scale: 0.86 }}
              onClick={() => setActiveTab(key)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: '5px', padding: '10px 4px 6px',
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontFamily: "'Inter', sans-serif", position: 'relative',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="adm-nav-indicator"
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    exit={{ opacity: 0, scaleX: 0 }}
                    style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '28px', height: '2px', borderRadius: '0 0 4px 4px', background: iconColor }}
                  />
                )}
              </AnimatePresence>
              <motion.div
                animate={{ background: isActive ? `${iconColor}18` : 'transparent', scale: isActive ? 1 : 0.9 }}
                transition={{ duration: 0.2 }}
                style={{ padding: '6px 12px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon size={20} color={iconColor} strokeWidth={isActive ? 2.5 : 1.8} />
              </motion.div>
              <span style={{ fontSize: '10px', fontWeight: isActive ? 800 : 500, color: iconColor, transition: 'color 0.2s', letterSpacing: '0.1px' }}>
                {label}
              </span>
            </motion.button>
          )
        })}
      </div>

      {/* ── Floating action add buttons (mobile) ── */}

      {/* ── Modals ── */}
      {showExpenseForm && <ExpenseForm onClose={() => setShowExpenseForm(false)} onSubmit={handleAddExpense} />}
      {showIncomeForm  && <IncomeForm  onClose={() => setShowIncomeForm(false)}  onSubmit={handleAddIncome}  />}
      {showNotifForm   && <SendNotificationModal onClose={() => setShowNotifForm(false)} />}

      {selectedExpense && <ExpenseDetailModal expense={selectedExpense} onClose={() => setSelectedExpense(null)} onUpdate={handleUpdateExpense} />}
      {selectedIncome  && <IncomeDetailModal  income={selectedIncome}   onClose={() => setSelectedIncome(null)}  onUpdate={handleUpdateIncome}  />}

      {/* Payment selection bar */}
      <AnimatePresence>
        {activeTab === 'payments' && paymentSelection.selectedCount > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
style={{
  position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 50,
              background: 'rgba(20,20,20,0.97)', borderTop: `1px solid ${T.orangeBdr}`,
              backdropFilter: 'blur(16px)', padding: '14px 20px', paddingBottom: 'env(safe-area-inset-bottom, 14px)',
            }}
          >
            <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 700, color: T.text1, margin: 0 }}>
                  {paymentSelection.selectedCount} student dipilih
                </p>
                <p style={{ fontSize: '11px', color: T.text3, margin: '2px 0 0' }}>
                  {paymentSelection.pendingPaid} akan bayar, {paymentSelection.pendingUnpaid} akan batal
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => paymentSelection.cancelChanges?.()}
                  style={{ padding: '9px 18px', borderRadius: '8px', background: T.bg3, border: `1px solid ${T.border}`, color: T.text2, cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '13px' }}>
                  Batal
                </button>
                <button onClick={() => paymentSelection.saveChanges?.()} disabled={paymentSelection.isSaving}
                  style={{ padding: '9px 18px', borderRadius: '8px', background: T.orange, border: 'none', color: '#000', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: '13px', opacity: paymentSelection.isSaving ? 0.6 : 1 }}>
                  {paymentSelection.isSaving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Month Modal */}
      <AnimatePresence>
        {showMonthModal && (
          <>
            <motion.div key="mm-bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowMonthModal(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)' }} />
            <motion.div key="mm-md" initial={{ opacity: 0, scale: 0.93, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 24 }} transition={{ type: 'spring', damping: 24, stiffness: 320 }}
              style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', pointerEvents: 'none' }}>
              <div onClick={e => e.stopPropagation()}
                style={{ pointerEvents: 'auto', width: '100%', maxWidth: '500px', background: T.bg2, border: `1px solid ${T.border}`, borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ position: 'relative', padding: '18px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: T.orange }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', background: T.orangeD, borderRadius: '9px' }}>
                      <Check size={18} color={T.orange} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 800, fontSize: '15px', color: T.text1, margin: 0 }}>Detail Pembayaran</p>
                      <p style={{ fontSize: '11px', color: T.text3, margin: '2px 0 0' }}>{selectedPaymentStudent?.name} — {new Date().getFullYear()}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowMonthModal(false)}
                    style={{ padding: '7px', borderRadius: '8px', background: T.bg3, border: `1px solid ${T.border}`, cursor: 'pointer', display: 'flex' }}>
                    <X size={15} color={T.text2} />
                  </button>
                </div>
                <div style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <p style={{ fontSize: '12px', color: T.text3, margin: 0, lineHeight: 1.6 }}>
                    Pilih bulan yang ingin disetujui. Bulan yang sudah dibayar tidak dapat diubah.
                  </p>
                  {isMonthModalLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                      <Loader2 size={20} color={T.orange} style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      {monthNames.map((m, idx) => {
                        const mn       = idx + 1
                        const paid     = Boolean(studentMonthStatus[mn])
                        const selected = selectedMonths.has(mn)
                        return (
                          <button key={m} onClick={() => handleToggleMonth(mn)} disabled={paid}
                            style={{
                              padding: '12px 10px', borderRadius: '10px', border: `1px solid ${paid ? 'transparent' : selected ? T.orange : T.border}`,
                              background: paid ? T.bg3 : selected ? T.orangeD : T.bg3,
                              color: paid ? T.text3 : selected ? T.orange : T.text2,
                              cursor: paid ? 'not-allowed' : 'pointer',
                              fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '12px',
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', transition: 'all 0.15s',
                            }}>
                            <span>{m}</span>
                            {paid ? <Check size={13} color={T.green} /> : selected ? <span style={{ color: T.orange }}>✓</span> : null}
                          </button>
                        )
                      })}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                    <p style={{ fontSize: '12px', color: T.text3, margin: 0 }}>
                      {selectedMonths.size > 0 ? `${selectedMonths.size} bulan dipilih` : 'Pilih bulan untuk disetujui'}
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => setShowMonthModal(false)}
                        style={{ padding: '9px 18px', borderRadius: '8px', background: T.bg3, border: `1px solid ${T.border}`, color: T.text2, cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '13px' }}>
                        Tutup
                      </button>
                      <button onClick={handleSaveMonthSelection} disabled={selectedMonths.size === 0 || isSavingMonths}
                        style={{ padding: '9px 18px', borderRadius: '8px', background: T.orange, border: 'none', color: '#000', cursor: selectedMonths.size === 0 || isSavingMonths ? 'not-allowed' : 'pointer', fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: '13px', opacity: selectedMonths.size === 0 || isSavingMonths ? 0.5 : 1 }}>
                        {isSavingMonths ? 'Menyimpan...' : 'Approve'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }

        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:.3}50%{opacity:.65} }
        @keyframes ping  { 0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(1.8);opacity:0} }

        .adm-ping {
          position: absolute; inset: 0; border-radius: 50%;
          background: ${T.green}; opacity: .7;
          animation: ping 1.6s ease-in-out infinite;
        }

        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.14); border-radius: 4px; }

        .adm-header {
          max-width: 1280px; margin: 0 auto; padding: 13px 16px;
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
        }

        .adm-stat-grid   { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .adm-action-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .adm-recent-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }

        .adm-tabs-row { -ms-overflow-style: none; scrollbar-width: none; }
        .adm-tabs-row::-webkit-scrollbar { display: none; }

        /* Bottom nav hidden on desktop */
        .adm-bottom-nav { display: none; }

        @media (max-width: 768px) {
          .adm-stat-grid   { grid-template-columns: 1fr; }
          .adm-action-grid { grid-template-columns: 1fr; }
          .adm-recent-grid { grid-template-columns: 1fr; }
          .adm-notif-label { display: none; }
          .adm-logout-label { display: none; }
          .adm-last-updated { display: none; }
          .adm-refresh-label { display: none; }

          /* Hide desktop tabs */
          .adm-tabs-row { display: none !important; }

          /* Pad content above bottom nav */
          .adm-content { padding-bottom: 90px !important; }

          /* Show bottom nav */
          .adm-bottom-nav {
            display: flex;
            position: fixed; bottom: 0; left: 0; right: 0; z-index: 40;
            background: rgba(12,12,12,0.97);
            border-top: 1px solid ${T.border};
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            padding-bottom: env(safe-area-inset-bottom, 0px);
          }
        }

        @media (max-width: 480px) {
          .adm-header { padding: 11px 14px; }
        }
      `}</style>
    </div>
  )
}