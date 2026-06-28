import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, TrendingDown, Wallet, ArrowDownCircle, ArrowUpCircle,
  ExternalLink, Bell, BellOff, BellRing, CheckCircle2, XCircle, Loader2,
  RefreshCw, FileText, Tag, LayoutDashboard, CreditCard,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import {
  getNotificationPermission,
  subscribeToPush,
  isSubscribed,
} from '../lib/pushNotifications'

import Toast from '../components/Toast'
import DashboardCard from '../components/DashboardCard'
import PaymentStatusTable from '../components/PaymentStatusTable'
import TransactionList from '../components/TransactionList'

// ─── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

const monthNames = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
]

const formatDateDetailed = (dateStr) => {
  if (!dateStr) return '-'
  const utcDate = new Date(dateStr)
  const wibDate = new Date(utcDate.getTime() + 7 * 60 * 60 * 1000)
  const days = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu']
  const dayName = days[wibDate.getUTCDay()]
  const dd   = String(wibDate.getUTCDate()).padStart(2, '0')
  const mm   = String(wibDate.getUTCMonth() + 1).padStart(2, '0')
  const yyyy = wibDate.getUTCFullYear()
  const hh   = String(wibDate.getUTCHours()).padStart(2, '0')
  const min  = String(wibDate.getUTCMinutes()).padStart(2, '0')
  return `${dd}-${mm}-${yyyy} (${dayName}) ${hh}:${min}`
}

const getProofUrl = (path) => {
  if (!path) return ''
  return `https://fxxjfkcjtuuxbrxhfrph.supabase.co/storage/v1/object/public/expense-proofs/${path}`
}

// ─── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:         '#0a0a0a',
  surface:    'rgba(255,255,255,0.04)',
  surfaceHov: 'rgba(255,255,255,0.07)',
  border:     'rgba(255,255,255,0.09)',
  borderStr:  'rgba(255,255,255,0.16)',
  text1:      '#f0f0f0',
  text2:      'rgba(240,240,240,0.65)',
  text3:      'rgba(240,240,240,0.38)',
  accent:     '#8b5cf6',
  accentDim:  'rgba(139,92,246,0.12)',
  accentBdr:  'rgba(139,92,246,0.25)',
  green:      '#4ade80',
  greenDim:   'rgba(74,222,128,0.10)',
  greenBdr:   'rgba(74,222,128,0.22)',
  orange:     '#fb923c',
  orangeDim:  'rgba(251,146,60,0.10)',
  orangeBdr:  'rgba(251,146,60,0.22)',
  red:        '#f87171',
  redDim:     'rgba(248,113,113,0.10)',
  redBdr:     'rgba(248,113,113,0.22)',
  blue:       '#60a5fa',
  blueDim:    'rgba(96,165,250,0.10)',
  blueBdr:    'rgba(96,165,250,0.22)',
}

const glass = {
  background:     C.surface,
  border:         `1px solid ${C.border}`,
  backdropFilter: 'blur(16px)',
  borderRadius:   '14px',
}

// ─── Notification Card ─────────────────────────────────────────────────────────
function NotificationCard({ studentId }) {
  const [status, setStatus] = useState('idle')

  const syncStatus = useCallback(async () => {
    const perm = getNotificationPermission()
    if (perm === 'unsupported') { setStatus('unsupported'); return }
    if (perm === 'denied')      { setStatus('denied');      return }
    if (perm === 'granted') {
      const sub = await isSubscribed()
      setStatus(sub ? 'granted' : 'default')
      return
    }
    setStatus('default')
  }, [])

  useEffect(() => { syncStatus() }, [syncStatus])

  const handleEnable = async () => {
    if (!studentId) return
    setStatus('loading')
    try {
      if (Notification.permission === 'denied') {
        alert('Notifikasi diblokir.\n\nSilakan klik icon gembok di browser lalu izinkan notifikasi untuk website ini.')
        setStatus('denied'); return
      }
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setStatus('denied'); return }
      await subscribeToPush(studentId)
      setStatus('granted')
    } catch (err) {
      console.error(err)
      setStatus(Notification.permission === 'denied' ? 'denied' : 'default')
    }
  }

  const unsubscribePush = async () => {
    try {
      setStatus('loading')
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) await sub.unsubscribe()
      setStatus('default')
    } catch (err) {
      console.error('Failed to unsubscribe:', err)
      setStatus('granted')
    }
  }

  const isGranted     = status === 'granted'
  const isDenied      = status === 'denied'
  const isLoading     = status === 'loading'
  const isUnsupported = status === 'unsupported'

  const barColor = isGranted ? C.green : isDenied ? C.red : C.borderStr

  return (
    <div style={{ ...glass, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1.5px', background: barColor, transition: 'background 0.4s' }} />
      <div className="notif-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
            background: isGranted ? C.greenDim : isDenied ? C.redDim : C.surface,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.3s',
          }}>
            {isLoading
              ? <Loader2 size={18} color={C.text3} className="spin" />
              : isGranted ? <BellRing size={18} color={C.green} />
              : isDenied  ? <BellOff  size={18} color={C.red}   />
              : <Bell size={18} color={C.text3} />}
          </div>
          <div>
            <p style={{ color: C.text1, fontWeight: 700, fontSize: '14px', margin: 0 }}>Notifikasi</p>
            <p style={{ fontSize: '12px', marginTop: '2px', color: isGranted ? C.green : isDenied ? C.red : C.text3 }}>
              {isLoading ? 'Memproses...'
                : isGranted ? 'Aktif — kamu akan menerima notifikasi'
                : isDenied  ? 'Diblokir browser'
                : isUnsupported ? 'Browser tidak mendukung'
                : 'Belum diaktifkan'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <motion.div key={status} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            {isGranted ? <CheckCircle2 size={18} color={C.green} />
              : isDenied ? <XCircle size={18} color={C.red} /> : null}
          </motion.div>
          {!isUnsupported && (
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={isGranted ? unsubscribePush : handleEnable}
              disabled={isLoading}
              style={{
                padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.4 : 1,
                fontFamily: "'Inter', sans-serif", transition: 'all 0.2s', whiteSpace: 'nowrap',
                ...(isGranted
                  ? { background: C.redDim,   border: `1px solid ${C.redBdr}`,   color: C.red   }
                  : { background: C.greenDim, border: `1px solid ${C.greenBdr}`, color: C.green }),
              }}
            >
              {isLoading ? '...' : isGranted ? 'Nonaktifkan' : isDenied ? 'Izinkan Lagi' : 'Aktifkan'}
            </motion.button>
          )}
        </div>
      </div>
      {isDenied && (
        <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          style={{ marginTop: '10px', fontSize: '12px', color: C.text3, lineHeight: 1.6 }}>
          Buka <strong style={{ color: C.text2 }}>Pengaturan → Privasi → Notifikasi</strong> lalu izinkan website ini dan refresh halaman.
        </motion.p>
      )}
    </div>
  )
}

// ─── Modal shell ───────────────────────────────────────────────────────────────
function Modal({ onClose, accentColor, accentDim, icon, title, subtitle, children }) {
  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      />
      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.93, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 24 }}
        transition={{ type: 'spring', damping: 24, stiffness: 320 }}
        style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0', pointerEvents: 'none' }}
        className="modal-wrapper"
      >
        <div onClick={e => e.stopPropagation()} style={{
          pointerEvents: 'auto', width: '100%', maxWidth: '480px',
          background: '#111', border: `1px solid ${C.border}`,
          borderRadius: '20px 20px 0 0', overflow: 'hidden',
        }} className="modal-card">
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1.5px', background: accentColor }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '8px', borderRadius: '10px', background: accentDim }}>
                {icon}
              </div>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 800, color: C.text1, margin: 0 }}>{title}</h2>
                <p style={{ fontSize: '11px', color: C.text3, margin: '2px 0 0' }}>{subtitle}</p>
              </div>
            </div>
            <button onClick={onClose} style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: C.surface, border: `1px solid ${C.border}`,
              color: C.text2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px',
            }}>✕</button>
          </div>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '72vh', overflowY: 'auto' }}>
            {children}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Income Detail Modal ────────────────────────────────────────────────────────
function IncomeDetailModal({ income, onClose }) {
  return (
    <Modal onClose={onClose} accentColor={C.green} accentDim={C.greenDim}
      icon={<ArrowUpCircle size={18} color={C.green} />}
      title="Detail Pemasukan" subtitle="Informasi lengkap transaksi pemasukan">
      <ModalField label="Nama Pemasukan" icon={<FileText size={11} />}>
        <p style={{ fontSize: '17px', fontWeight: 700, color: C.text1, margin: 0 }}>{income.name}</p>
      </ModalField>
      <ModalField label="Jumlah" icon={<Wallet size={11} />}>
        <p style={{ fontSize: '24px', fontWeight: 900, color: C.green, margin: 0 }}>+Rp {Number(income.amount).toLocaleString('id-ID')}</p>
      </ModalField>
      {income.source && (
        <ModalField label="Sumber" icon={<Tag size={11} />}>
          <Pill color={C.green} dim={C.greenDim} bdr={C.greenBdr}>{income.source}</Pill>
        </ModalField>
      )}
      {income.description && (
        <ModalField label="Deskripsi" icon={<FileText size={11} />}>
          <p style={{ fontSize: '13px', color: C.text2, lineHeight: 1.6, margin: 0 }}>{income.description}</p>
        </ModalField>
      )}
      <ModalField label="Tanggal & Waktu">
        <p style={{ fontSize: '13px', fontWeight: 600, color: C.text1, margin: 0 }}>{formatDateDetailed(income.created_at)}</p>
      </ModalField>
      <button onClick={onClose} style={{
        width: '100%', padding: '13px', borderRadius: '10px', marginTop: '4px',
        background: C.greenDim, border: `1px solid ${C.greenBdr}`,
        color: C.green, fontWeight: 800, fontSize: '14px', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
      }}>Tutup</button>
    </Modal>
  )
}

// ─── Expense Detail Modal ───────────────────────────────────────────────────────
function ExpenseDetailModal({ expense, onClose }) {
  return (
    <Modal onClose={onClose} accentColor={C.orange} accentDim={C.orangeDim}
      icon={<ArrowDownCircle size={18} color={C.orange} />}
      title="Detail Pengeluaran" subtitle="Lihat bukti bayar dan detail transaksi">
      {expense.proof_image_url && (
        <div style={{ borderRadius: '10px', overflow: 'hidden', border: `1px solid ${C.border}` }}>
          <img src={getProofUrl(expense.proof_image_url)} alt="Bukti pembayaran" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
        </div>
      )}
      <ModalField label="Nama Pengeluaran" icon={<FileText size={11} />}>
        <p style={{ fontSize: '17px', fontWeight: 700, color: C.text1, margin: 0 }}>{expense.name}</p>
      </ModalField>
      <ModalField label="Jumlah" icon={<Wallet size={11} />}>
        <p style={{ fontSize: '24px', fontWeight: 900, color: C.orange, margin: 0 }}>-Rp {Number(expense.amount).toLocaleString('id-ID')}</p>
      </ModalField>
      {expense.category && (
        <ModalField label="Kategori" icon={<Tag size={11} />}>
          <Pill color={C.orange} dim={C.orangeDim} bdr={C.orangeBdr}>{expense.category}</Pill>
        </ModalField>
      )}
      {expense.description && (
        <ModalField label="Deskripsi" icon={<FileText size={11} />}>
          <p style={{ fontSize: '13px', color: C.text2, lineHeight: 1.6, margin: 0 }}>{expense.description}</p>
        </ModalField>
      )}
      <ModalField label="Tanggal & Waktu">
        <p style={{ fontSize: '13px', fontWeight: 600, color: C.text1, margin: 0 }}>{formatDateDetailed(expense.created_at)}</p>
      </ModalField>
      <div style={{ marginTop: '4px' }}>
        {expense.proof_image_url ? (
          <a href={getProofUrl(expense.proof_image_url)} target="_blank" rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '13px', borderRadius: '10px', background: C.orange,
              color: '#000', fontWeight: 800, fontSize: '14px', textDecoration: 'none', fontFamily: "'Inter', sans-serif",
            }}>
            <ExternalLink size={16} /> Lihat Bukti Bayar
          </a>
        ) : (
          <button disabled style={{
            width: '100%', padding: '13px', borderRadius: '10px',
            background: C.surface, border: `1px solid ${C.border}`,
            color: C.text3, cursor: 'not-allowed', fontFamily: "'Inter', sans-serif",
          }}>Tidak Ada Bukti Pembayaran</button>
        )}
      </div>
    </Modal>
  )
}

// ─── Small helpers ─────────────────────────────────────────────────────────────
function ModalField({ label, icon, children }) {
  return (
    <div>
      <p style={{ fontSize: '11px', color: C.text3, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
        {icon} {label}
      </p>
      {children}
    </div>
  )
}

function Pill({ color, dim, bdr, children }) {
  return (
    <span style={{ display: 'inline-block', padding: '4px 12px', background: dim, border: `1px solid ${bdr}`, color, borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
      {children}
    </span>
  )
}

// ─── Income Row ─────────────────────────────────────────────────────────────────
function IncomeRow({ income, onClick }) {
  return (
    <motion.button whileHover={{ background: C.surfaceHov }} whileTap={{ scale: 0.99 }}
      onClick={() => onClick(income)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', borderRadius: '12px', background: C.surface,
        border: `1px solid ${C.border}`, gap: '12px', textAlign: 'left', cursor: 'pointer',
        fontFamily: "'Inter', sans-serif", transition: 'background 0.15s',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
        <div style={{ padding: '8px', background: C.greenDim, borderRadius: '9px', flexShrink: 0 }}>
          <ArrowUpCircle size={16} color={C.green} />
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ color: C.text1, fontWeight: 600, fontSize: '14px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{income.name}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
            {income.source && <Pill color={C.green} dim={C.greenDim} bdr={C.greenBdr}>{income.source}</Pill>}
            <span style={{ fontSize: '11px', color: C.text3 }}>{formatDate(income.created_at)}</span>
          </div>
        </div>
      </div>
      <p style={{ color: C.green, fontWeight: 800, fontSize: '14px', flexShrink: 0, margin: 0 }}>+Rp {income.amount.toLocaleString('id-ID')}</p>
    </motion.button>
  )
}

// ─── Expense Row ────────────────────────────────────────────────────────────────
function ExpenseRow({ expense, onClick }) {
  return (
    <motion.button whileHover={{ background: C.surfaceHov }} whileTap={{ scale: 0.99 }}
      onClick={() => onClick(expense)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', borderRadius: '12px', background: C.surface,
        border: `1px solid ${C.border}`, gap: '12px', textAlign: 'left', cursor: 'pointer',
        fontFamily: "'Inter', sans-serif", transition: 'background 0.15s',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
        <div style={{ padding: '8px', background: C.orangeDim, borderRadius: '9px', flexShrink: 0 }}>
          <ArrowDownCircle size={16} color={C.orange} />
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ color: C.text1, fontWeight: 600, fontSize: '14px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{expense.name}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
            {expense.category && <Pill color={C.orange} dim={C.orangeDim} bdr={C.orangeBdr}>{expense.category}</Pill>}
            <span style={{ fontSize: '11px', color: C.text3 }}>{formatDate(expense.created_at)}</span>
          </div>
        </div>
      </div>
      <p style={{ color: C.orange, fontWeight: 800, fontSize: '14px', flexShrink: 0, margin: 0 }}>-Rp {expense.amount.toLocaleString('id-ID')}</p>
    </motion.button>
  )
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color, dim, bdr }) {
  return (
    <div style={{ background: dim, border: `1px solid ${bdr}`, borderRadius: '14px', padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '14px' }}>
        <div style={{ padding: '7px', borderRadius: '9px', background: `${dim}cc` }}>
          {icon}
        </div>
        <span style={{ fontSize: '11px', fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{label}</span>
      </div>
      <p style={{ fontSize: '20px', fontWeight: 900, color: C.text1, margin: 0, letterSpacing: '-0.5px' }}>{value}</p>
      <p style={{ fontSize: '11px', color: C.text3, margin: '5px 0 0' }}>{sub}</p>
    </div>
  )
}

// ─── Tab config ────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'overview',  label: 'Overview',    icon: LayoutDashboard },
  { key: 'income',    label: 'Pemasukan',   icon: TrendingUp      },
  { key: 'expenses',  label: 'Pengeluaran', icon: TrendingDown    },
  { key: 'payments',  label: 'Pembayaran',  icon: CreditCard      },
]

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function UserDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const [stats, setStats]                     = useState({ miniBank: 0, treasurer: 0 })
  const [transactions, setTransactions]       = useState([])
  const [paymentStatus, setPaymentStatus]     = useState([])
  const [unpaidStudents, setUnpaidStudents]   = useState([])
  const [incomes, setIncomes]                 = useState([])
  const [expenses, setExpenses]               = useState([])
  const [activeTab, setActiveTab]             = useState('overview')
  const [isLoading, setIsLoading]             = useState(true)
  const [studentName, setStudentName]         = useState('')
  const [studentId, setStudentId]             = useState(null)
  const [selectedIncome, setSelectedIncome]   = useState(null)
  const [selectedExpense, setSelectedExpense] = useState(null)
  const [lastUpdated, setLastUpdated]         = useState(null)
  const [toast, setToast]                     = useState(null)

  // Income table
  const [incomeSearch, setIncomeSearch]         = useState('')
  const [incomeRowsPerPage, setIncomeRowsPerPage] = useState(10)
  const [incomePage, setIncomePage]             = useState(1)

  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1)
  const [selectedYear, setSelectedYear]   = useState(currentDate.getFullYear())

  const handleRefresh = async () => {
    await fetchDashboardData(true)
    setToast('Data berhasil diperbarui!')
  }

  const studentIdRef = useRef(null)

  const fetchDashboardData = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true)

      let sid  = studentIdRef.current
      let name = studentName

      if (!sid) {
        const { data: studentRow } = await supabase
          .from('students').select('id, name').eq('id', user?.student_id).maybeSingle()
        sid  = studentRow?.id   ?? null
        name = studentRow?.name ?? ''
        setStudentName(name)
        setStudentId(sid)
        studentIdRef.current = sid
      }

      const [finRes, transRes, paymentRes, studentsRes, monthlyPaymentsRes, incomeRes, expenseRes] = await Promise.all([
        supabase.from('financial_summary').select('*').single(),
        supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(10),
        sid
          ? supabase.from('payment_status').select('*').eq('student_id', sid).order('month', { ascending: true })
          : Promise.resolve({ data: [] }),
        supabase.from('students').select('id, name'),
        supabase.from('payment_status').select('student_id, paid').eq('month', selectedMonth).eq('year', selectedYear),
        supabase.from('income').select('*').order('created_at', { ascending: false }),
        supabase.from('expenses').select('*').order('created_at', { ascending: false }),
      ])

      setStats({ miniBank: finRes.data?.mini_bank ?? 0, treasurer: finRes.data?.treasurer ?? 0 })
      setTransactions(transRes.data    || [])
      setPaymentStatus(paymentRes.data || [])
      setIncomes(incomeRes.data        || [])
      setExpenses(expenseRes.data      || [])

      const allStudents     = studentsRes.data        || []
      const monthlyPayments = monthlyPaymentsRes.data || []
      setUnpaidStudents(
        allStudents.filter((s) => {
          const p = monthlyPayments.find((m) => m.student_id === s.id)
          return !p || p.paid === false
        })
      )
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [user?.student_id, selectedMonth, selectedYear])

  useEffect(() => { fetchDashboardData(false) }, [fetchDashboardData])

  const totalCash    = incomes.reduce((s, r) => s + (r.amount ?? 0), 0) - expenses.reduce((s, r) => s + (r.amount ?? 0), 0)
  const totalIncome  = incomes.reduce((s, r) => s + (r.amount ?? 0), 0)
  const totalExpense = expenses.reduce((s, r) => s + (r.amount ?? 0), 0)

  // Income filter + pagination
  const filteredIncome = incomes.filter((item) => {
    const keyword = incomeSearch.toLowerCase()
    return (
      item.name?.toLowerCase().includes(keyword) ||
      item.source?.toLowerCase().includes(keyword) ||
      item.description?.toLowerCase().includes(keyword)
    )
  })

  const totalIncomePages = Math.ceil(filteredIncome.length / incomeRowsPerPage)
  const paginatedIncome  = filteredIncome.slice(
    (incomePage - 1) * incomeRowsPerPage,
    incomePage * incomeRowsPerPage
  )

  useEffect(() => { setIncomePage(1) }, [incomeSearch, incomeRowsPerPage])

  const handleLogout = () => { logout(); navigate('/login') }

  const containerVariants = {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
  }
  const itemVariants = {
    hidden:  { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Inter', sans-serif", position: 'relative', overflowX: 'hidden' }}>

      {/* Subtle purple glow */}
      <div style={{ position: 'fixed', top: '-120px', right: '-120px', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '5%', left: '-80px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      </AnimatePresence>

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(10,10,10,0.88)', borderBottom: `1px solid ${C.border}`, backdropFilter: 'blur(20px)' }}>
        <div className="header-inner">
          {/* Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 900, margin: 0, color: C.text1, letterSpacing: '-0.4px' }}>
                Dashboard
              </h1>
              <p style={{ fontSize: '10px', color: C.text3, margin: '2px 0 0', letterSpacing: '1.2px', textTransform: 'uppercase' }}>by nopal</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={handleRefresh} disabled={isLoading}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '7px 13px', borderRadius: '8px',
                background: C.accentDim, border: `1px solid ${C.accentBdr}`,
                color: C.text2, fontSize: '12px', fontWeight: 700,
                cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.5 : 1,
                fontFamily: "'Inter', sans-serif", transition: 'all 0.2s', whiteSpace: 'nowrap',
              }}>
              <RefreshCw size={13} color={C.accent} className={isLoading ? 'spin' : ''} />
              <span className="refresh-label">{isLoading ? 'Refreshing...' : 'Refresh'}</span>
            </motion.button>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              {isLoading
                ? <RefreshCw size={11} color={C.accent} className="spin" />
                : (
                  <span style={{ position: 'relative', display: 'inline-flex', width: '7px', height: '7px' }}>
                    <span className="ping-dot" />
                    <span style={{ position: 'relative', width: '7px', height: '7px', borderRadius: '50%', background: C.green, display: 'block' }} />
                  </span>
                )}
              <span className="last-updated" style={{ fontSize: '11px', color: C.text3 }}>
                {lastUpdated ? `${lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Memuat...'}
              </span>
            </div>
            <div style={{
              width: '33px', height: '33px', borderRadius: '50%',
              background: C.accentDim, border: `1px solid ${C.accentBdr}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: 800, color: C.accent, flexShrink: 0,
            }}>
              {(studentName || user?.name || 'S').charAt(0).toUpperCase()}
            </div>
            <span className="username-label" style={{ fontSize: '13px', fontWeight: 700, color: C.text1 }}>
              {studentName || user?.name || 'Student'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── Desktop Tabs ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        style={{ maxWidth: '1280px', margin: '0 auto', padding: '20px 16px 0' }}>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '2px' }}
          className="tabs-row">
          {TABS.map(({ key, label }) => (
            <motion.button key={key} whileTap={{ scale: 0.96 }}
              onClick={() => setActiveTab(key)}
              style={{
                padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: "'Inter', sans-serif", transition: 'all 0.18s',
                ...(activeTab === key
                  ? { background: C.text1, color: C.bg, border: 'none' }
                  : { background: 'transparent', color: C.text3, border: `1px solid ${C.border}` }),
              }}>
              {label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ── Content ── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="content-wrapper"
        style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px 60px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', zIndex: 1 }}
      >

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <>
            <motion.div variants={itemVariants}>
              <NotificationCard studentId={studentId} />
            </motion.div>

            <motion.div variants={itemVariants} className="stats-grid">
              <StatCard icon={<Wallet size={16} color={C.orange} />} label="Total Kas Kelas"
                value={`Rp ${totalCash.toLocaleString('id-ID')}`} sub="Kas akumulasi"
                color={C.orange} dim={C.orangeDim} bdr={C.orangeBdr} />
              <StatCard icon={<TrendingUp size={16} color={C.green} />} label="Bank Mini"
                value={`Rp ${stats.miniBank.toLocaleString('id-ID')}`} sub="Uang di bank mini"
                color={C.green} dim={C.greenDim} bdr={C.greenBdr} />
              <StatCard icon={<TrendingDown size={16} color={C.blue} />} label="Bendahara"
                value={`Rp ${stats.treasurer.toLocaleString('id-ID')}`} sub="Uang di bendahara"
                color={C.blue} dim={C.blueDim} bdr={C.blueBdr} />
            </motion.div>

            <motion.div variants={itemVariants} className="bottom-grid">
              {/* Pengeluaran terakhir */}
              <div style={{ ...glass, padding: '18px 20px' }}>
                <SectionHeader title="Pengeluaran Terakhir" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {expenses.slice(0, 5).map((e) => (
                    <MiniRow key={e.id} name={e.name} sub={e.category}
                      amount={`-Rp ${e.amount.toLocaleString('id-ID')}`} amountColor={C.orange} />
                  ))}
                </div>
              </div>

              {/* Pemasukan terakhir */}
              <div style={{ ...glass, padding: '18px 20px' }}>
                <SectionHeader title="Pemasukan Terakhir" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {incomes.slice(0, 5).map((i) => (
                    <MiniRow key={i.id} name={i.name} sub={i.source}
                      amount={`+Rp ${i.amount.toLocaleString('id-ID')}`} amountColor={C.green} />
                  ))}
                </div>
              </div>

              {/* Yang belum bayar */}
              <div style={{ ...glass, padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px', gap: '10px', flexWrap: 'wrap' }}>
                  <div>
                    <SectionHeader title="Yang belum bayar" noMargin />
                    <p style={{ fontSize: '11px', color: C.text3, margin: '3px 0 0' }}>{monthNames[selectedMonth - 1]} {selectedYear}</p>
                  </div>
                  <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}
                    style={{
                      background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px',
                      padding: '7px 10px', fontSize: '12px', color: C.text1, outline: 'none',
                      cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontWeight: 600,
                    }}>
                    {monthNames.map((m, i) => (
                      <option key={i} value={i + 1} style={{ background: '#111' }}>{m}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '260px', overflowY: 'auto' }}>
                  {unpaidStudents.length > 0
                    ? unpaidStudents.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '9px', background: C.surface }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: C.text1 }}>{item.name}</span>
                          <span style={{ padding: '3px 10px', background: C.redDim, border: `1px solid ${C.redBdr}`, color: C.red, borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>Belum Bayar</span>
                        </div>
                      ))
                    : <p style={{ fontSize: '13px', color: C.text3, textAlign: 'center', padding: '20px 0' }}>Semua sudah bayar ✅</p>}
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <PaymentStatusTable payments={paymentStatus} isLoading={isLoading} />
            </motion.div>
          </>
        )}

        {/* ── INCOME ── */}
        {activeTab === 'income' && (
          <motion.div variants={itemVariants}>
            <div style={{ ...glass, padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 900, color: C.text1, margin: 0 }}>Pemasukan</h2>
                  <p style={{ fontSize: '12px', color: C.text3, marginTop: '4px' }}>
                    {filteredIncome.length} transaksi •
                    <span style={{ color: C.green, fontWeight: 700, marginLeft: 4 }}>
                      +Rp {totalIncome.toLocaleString('id-ID')}
                    </span>
                  </p>
                </div>
                <div style={{ padding: '10px', background: C.greenDim, borderRadius: '12px' }}>
                  <ArrowUpCircle size={20} color={C.green} />
                </div>
              </div>

              {/* Toolbar */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
                <input
                  placeholder="Cari pemasukan..."
                  value={incomeSearch}
                  onChange={(e) => setIncomeSearch(e.target.value)}
                  style={{
                    flex: 1, minWidth: 220, padding: '10px 14px', borderRadius: '10px',
                    border: `1px solid ${C.border}`, background: C.surface, color: C.text1,
                    outline: 'none', fontFamily: "'Inter', sans-serif",
                  }}
                />
                <select
                  value={incomeRowsPerPage}
                  onChange={(e) => setIncomeRowsPerPage(Number(e.target.value))}
                  style={{
                    padding: '10px', borderRadius: '10px', border: `1px solid ${C.border}`,
                    background: C.surface, color: C.text1, fontFamily: "'Inter', sans-serif",
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {/* List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '600px', overflowY: 'auto' }}>
                {isLoading
                  ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} />)
                  : paginatedIncome.length > 0
                    ? paginatedIncome.map((income) => <IncomeRow key={income.id} income={income} onClick={setSelectedIncome} />)
                    : <EmptyState text="Data tidak ditemukan." />}
              </div>

              {/* Pagination */}
              {!isLoading && totalIncomePages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                  <button
                    disabled={incomePage === 1}
                    onClick={() => setIncomePage((p) => p - 1)}
                    style={{
                      padding: '10px 16px', borderRadius: '10px', border: `1px solid ${C.border}`,
                      background: incomePage === 1 ? C.surface : C.greenDim,
                      color: incomePage === 1 ? C.text3 : C.green,
                      cursor: incomePage === 1 ? 'not-allowed' : 'pointer',
                      fontFamily: "'Inter', sans-serif", fontWeight: 700,
                    }}
                  >Prev</button>
                  <span style={{ color: C.text2, fontSize: '13px', fontWeight: 600 }}>
                    Halaman {incomePage} dari {totalIncomePages}
                  </span>
                  <button
                    disabled={incomePage === totalIncomePages}
                    onClick={() => setIncomePage((p) => p + 1)}
                    style={{
                      padding: '10px 16px', borderRadius: '10px', border: `1px solid ${C.border}`,
                      background: incomePage === totalIncomePages ? C.surface : C.greenDim,
                      color: incomePage === totalIncomePages ? C.text3 : C.green,
                      cursor: incomePage === totalIncomePages ? 'not-allowed' : 'pointer',
                      fontFamily: "'Inter', sans-serif", fontWeight: 700,
                    }}
                  >Next</button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── EXPENSES ── */}
        {activeTab === 'expenses' && (
          <motion.div variants={itemVariants}>
            <div style={{ ...glass, padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 900, color: C.text1, margin: 0 }}>Pengeluaran</h2>
                  <p style={{ fontSize: '12px', color: C.text3, margin: '4px 0 0' }}>
                    {expenses.length} transaksi &bull; <span style={{ color: C.orange, fontWeight: 700 }}>-Rp {totalExpense.toLocaleString('id-ID')}</span>
                  </p>
                </div>
                <div style={{ padding: '10px', background: C.orangeDim, borderRadius: '12px' }}>
                  <ArrowDownCircle size={20} color={C.orange} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '600px', overflowY: 'auto' }}>
                {isLoading
                  ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} />)
                  : expenses.length > 0
                    ? expenses.map(exp => <ExpenseRow key={exp.id} expense={exp} onClick={setSelectedExpense} />)
                    : <EmptyState text="Belum ada data pengeluaran." />}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── PAYMENTS ── */}
        {activeTab === 'payments' && (
          <motion.div variants={itemVariants}>
            <PaymentStatusTable payments={paymentStatus} isLoading={isLoading} />
          </motion.div>
        )}
      </motion.div>

      {/* ── Mobile Bottom Navigation ── */}
      <div className="bottom-nav">
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key
          const iconColor = isActive
            ? key === 'income'   ? C.green
            : key === 'expenses' ? C.orange
            : key === 'payments' ? C.blue
            : C.accent
            : C.text3

          return (
            <motion.button
              key={key}
              whileTap={{ scale: 0.86 }}
              onClick={() => setActiveTab(key)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                padding: '10px 4px 6px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                position: 'relative',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {/* Active top bar indicator */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    exit={{ opacity: 0, scaleX: 0 }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '32px',
                      height: '2px',
                      borderRadius: '0 0 4px 4px',
                      background: iconColor,
                    }}
                  />
                )}
              </AnimatePresence>

              {/* Icon with active bg pill */}
              <motion.div
                animate={{
                  background: isActive ? `${iconColor}18` : 'transparent',
                  scale: isActive ? 1 : 0.9,
                }}
                transition={{ duration: 0.2 }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={20} color={iconColor} strokeWidth={isActive ? 2.5 : 1.8} />
              </motion.div>

              <span style={{
                fontSize: '10px',
                fontWeight: isActive ? 800 : 500,
                color: iconColor,
                transition: 'color 0.2s, font-weight 0.2s',
                letterSpacing: '0.1px',
              }}>
                {label}
              </span>
            </motion.button>
          )
        })}
      </div>

      {selectedIncome  && <IncomeDetailModal  income={selectedIncome}   onClose={() => setSelectedIncome(null)}  />}
      {selectedExpense && <ExpenseDetailModal expense={selectedExpense} onClose={() => setSelectedExpense(null)} />}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        * { box-sizing: border-box; }

        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes ping  { 0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(1.7);opacity:0} }
        @keyframes pulse { 0%,100%{opacity:.3}50%{opacity:.6} }

        .spin { animation: spin 1s linear infinite; }

        .ping-dot {
          position: absolute; inset: 0; border-radius: 50%;
          background: ${C.green}; opacity: .7;
          animation: ping 1.6s ease-in-out infinite;
        }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.borderStr}; border-radius: 4px; }

        /* Header inner */
        .header-inner {
          max-width: 1280px; margin: 0 auto;
          padding: 14px 16px;
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
        }

        /* Stats grid — 3 col desktop, 1 col mobile */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        /* Bottom grid — 3 col desktop, 1 col mobile */
        .bottom-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        /* Tabs — no scrollbar visible */
        .tabs-row { -ms-overflow-style: none; scrollbar-width: none; }
        .tabs-row::-webkit-scrollbar { display: none; }

        /* Notif inner */
        .notif-inner {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
        }

        /* Modal — center on desktop, bottom sheet on mobile */
        @media (min-width: 600px) {
          .modal-wrapper { align-items: center !important; padding: 16px !important; }
          .modal-card { border-radius: 20px !important; }
        }

        /* Bottom nav — hidden on desktop */
        .bottom-nav {
          display: none;
        }

        /* ── Mobile ── */
        @media (max-width: 768px) {
          .stats-grid  { grid-template-columns: 1fr; }
          .bottom-grid { grid-template-columns: 1fr; }
          .username-label { display: none; }
          .last-updated { display: none; }
          .refresh-label { display: none; }

          /* Hide top tabs on mobile */
          .tabs-row { display: none !important; }

          /* Content padding so last item isn't hidden behind bottom nav */
          .content-wrapper { padding-bottom: 90px !important; }

          /* Show bottom nav */
          .bottom-nav {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 40;
            background: rgba(10, 10, 10, 0.96);
            border-top: 1px solid ${C.border};
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            padding-bottom: env(safe-area-inset-bottom, 0px);
          }
        }

        @media (max-width: 480px) {
          .header-inner { padding: 12px 14px; }
          .notif-inner { flex-direction: column; align-items: flex-start; gap: 12px; }
        }
      `}</style>
    </div>
  )
}

// ─── Tiny shared components ────────────────────────────────────────────────────
function SectionHeader({ title, noMargin }) {
  return (
    <h3 style={{ fontSize: '14px', fontWeight: 800, color: C.text1, margin: noMargin ? 0 : '0 0 14px', letterSpacing: '-0.1px' }}>
      {title}
    </h3>
  )
}

function MiniRow({ name, sub, amount, amountColor }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '9px', background: C.surface }}>
      <div style={{ minWidth: 0, marginRight: '10px' }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: C.text1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
        {sub && <p style={{ fontSize: '11px', color: C.text3, margin: '1px 0 0' }}>{sub}</p>}
      </div>
      <p style={{ fontSize: '13px', fontWeight: 800, color: amountColor, margin: 0, flexShrink: 0 }}>{amount}</p>
    </div>
  )
}

function Skeleton() {
  return <div style={{ height: '60px', borderRadius: '12px', background: C.surface, animation: 'pulse 1.5s ease-in-out infinite' }} />
}

function EmptyState({ text }) {
  return <p style={{ fontSize: '13px', color: C.text3, textAlign: 'center', padding: '36px 0' }}>{text}</p>
}