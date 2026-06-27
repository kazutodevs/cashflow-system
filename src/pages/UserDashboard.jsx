import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, TrendingDown, Wallet, ArrowDownCircle, ArrowUpCircle,
  ExternalLink, Bell, BellOff, BellRing, CheckCircle2, XCircle, Loader2,
  RefreshCw, FileText, Tag,
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
const getCurrentMonthYear = () => {
  const now = new Date()
  return now.toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  })
}

const monthNames = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

const formatDateDetailed = (dateStr) => {
  if (!dateStr) return '-'
  const utcDate = new Date(dateStr)
  const wibDate = new Date(utcDate.getTime() + 7 * 60 * 60 * 1000)
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
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

// ─── Notification Permission Card ──────────────────────────────────────────────
function NotificationCard({ studentId }) {
  const [status, setStatus] = useState('idle')

  const syncStatus = useCallback(async () => {
    const perm = getNotificationPermission()

    if (perm === 'unsupported') {
      setStatus('unsupported')
      return
    }

    if (perm === 'denied') {
      setStatus('denied')
      return
    }

    if (perm === 'granted') {
      const sub = await isSubscribed()
      setStatus(sub ? 'granted' : 'default')
      return
    }

    setStatus('default')
  }, [])

  useEffect(() => {
    syncStatus()
  }, [syncStatus])

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

  // ── Enable Notification ─────────────────────────────────────
  const handleEnable = async () => {
    if (!studentId) return

    setStatus('loading')

    try {
      // Browser modern tidak bisa munculkan popup lagi kalau denied
      if (Notification.permission === 'denied') {
        alert(
          'Notifikasi diblokir.\n\nSilakan klik icon gembok di browser lalu izinkan notifikasi untuk website ini.'
        )

        setStatus('denied')
        return
      }
const permission = await Notification.requestPermission()

if (permission !== 'granted') {
  setStatus('denied')
  return
}

await subscribeToPush(studentId)
      await subscribeToPush(studentId)

      setStatus('granted')
    } catch (err) {
      console.error(err)

      if (Notification.permission === 'denied') {
        setStatus('denied')
      } else {
        setStatus('default')
      }
    }
  }

  // ── Disable Notification ────────────────────────────────────
  const unsubscribePush = async () => {
    try {
      setStatus('loading')

      const registration = await navigator.serviceWorker.ready
      const subscription =
        await registration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()
      }

      setStatus('default')
    } catch (err) {
      console.error('Failed to unsubscribe:', err)
      setStatus('granted')
    }
  }

  // ── Derived state ───────────────────────────────────────────
  const isGranted     = status === 'granted'
  const isDenied      = status === 'denied'
  const isLoading     = status === 'loading'
  const isUnsupported = status === 'unsupported'

  return (
    <div className="glass p-6 rounded-2xl relative overflow-hidden">

      {/* Top Accent */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r transition-all duration-500
          ${
            isGranted
              ? 'from-green-400 to-emerald-500'
              : isDenied
                ? 'from-red-400 to-rose-500'
                : 'from-white/20 to-white/10'
          }`}
      />

      <div className="flex items-center justify-between">

        {/* Left */}
        <div className="flex items-center gap-4">

          {/* Icon */}
          <div
            className={`relative p-3 rounded-xl transition-colors duration-300
              ${
                isGranted
                  ? 'bg-green-500/15'
                  : isDenied
                    ? 'bg-red-500/15'
                    : 'bg-white/10'
              }`}
          >
            {isLoading ? (
              <Loader2
                size={22}
                className="text-white/60 animate-spin"
              />
            ) : isGranted ? (
              <BellRing
                size={22}
                className="text-green-400"
              />
            ) : isDenied ? (
              <BellOff
                size={22}
                className="text-red-400"
              />
            ) : (
              <Bell
                size={22}
                className="text-white/60"
              />
            )}
          </div>

          {/* Text */}
          <div>
            <p className="text-white font-semibold text-sm">
              Notifikasi
            </p>

            <p
              className={`text-xs mt-0.5 transition-colors duration-300
                ${
                  isGranted
                    ? 'text-green-400'
                    : isDenied
                      ? 'text-red-400'
                      : 'text-white/40'
                }`}
            >
              {isLoading
                ? 'Memproses...'
                : isGranted
                  ? 'Aktif - kamu akan menerima notifikasi'
                  : isDenied
                    ? 'Diblokir browser'
                    : isUnsupported
                      ? 'Browser tidak mendukung notifikasi'
                      : 'Belum diaktifkan'}
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3 shrink-0">

          {/* Status Icon */}
          <motion.div
            key={status}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 14 }}
          >
            {isGranted ? (
              <CheckCircle2
                size={22}
                className="text-green-400 drop-shadow-[0_0_6px_rgba(74,222,128,0.6)]"
              />
            ) : isDenied ? (
              <XCircle
                size={22}
                className="text-red-400 drop-shadow-[0_0_6px_rgba(248,113,113,0.6)]"
              />
            ) : null}
          </motion.div>

          {/* Action Button */}
          {!isUnsupported && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={
                isGranted
                  ? unsubscribePush
                  : handleEnable
              }
              disabled={isLoading}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed
                ${
                  isGranted
                    ? 'bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30'
                    : 'bg-green-500/20 border border-green-500/30 text-green-300 hover:bg-green-500/30'
                }`}
            >
              {isLoading
                ? '...'
                : isGranted
                  ? 'Nonaktifkan'
                  : isDenied
                    ? 'Izinkan Lagi'
                    : 'Aktifkan'}
            </motion.button>
          )}
        </div>
      </div>

      {/* Helper */}
      {isDenied && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 text-xs text-white/30 leading-relaxed"
        >
          Browser memblokir notifikasi.
          Buka <strong>Pengaturan → Privasi → Notifikasi</strong>
          lalu izinkan website ini dan refresh halaman.
        </motion.p>
      )}
    </div>
  )
}

// ─── Income Detail Modal ────────────────────────────────────────────────────────
function IncomeDetailModal({ income, onClose }) {
  return (
    <AnimatePresence>
      <motion.div
        key="income-user-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
      />
      <motion.div
        key="income-user-modal"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="pointer-events-auto w-full max-w-lg glass rounded-2xl border border-white/10 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative flex items-center justify-between p-5 border-b border-white/10">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-emerald-500" />
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <ArrowUpCircle size={20} className="text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Detail Pemasukan</h2>
                <p className="text-sm text-white/40 mt-0.5">Informasi lengkap transaksi pemasukan</p>
              </div>
            </div>
            <button onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-red-500/20 border border-white/10 flex items-center justify-center text-white transition-colors">
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            <div>
              <p className="text-white/40 text-xs mb-1 flex items-center gap-1.5"><FileText size={11} /> Nama Pemasukan</p>
              <p className="text-white font-semibold text-lg">{income.name}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs mb-1 flex items-center gap-1.5"><Wallet size={11} /> Jumlah Pemasukan</p>
              <p className="text-green-400 font-bold text-2xl">+Rp {Number(income.amount).toLocaleString('id-ID')}</p>
            </div>
            {income.source && (
              <div>
                <p className="text-white/40 text-xs mb-1.5 flex items-center gap-1.5"><Tag size={11} /> Sumber</p>
                <span className="inline-block px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full text-sm">
                  {income.source}
                </span>
              </div>
            )}
            {income.description && (
              <div>
                <p className="text-white/40 text-xs mb-1 flex items-center gap-1.5"><FileText size={11} /> Deskripsi</p>
                <p className="text-white/80 leading-relaxed text-sm">{income.description}</p>
              </div>
            )}
            <div>
              <p className="text-white/40 text-xs mb-1">Tanggal & Waktu</p>
              <p className="text-white font-medium">{formatDateDetailed(income.created_at)}</p>
            </div>
            <div className="pt-2">
              <button onClick={onClose}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 transition-all duration-200 text-green-300 font-bold">
                Tutup
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Expense Detail Modal ───────────────────────────────────────────────────────
function ExpenseDetailModal({ expense, onClose }) {
  return (
    <AnimatePresence>
      <motion.div
        key="expense-user-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
      />
      <motion.div
        key="expense-user-modal"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="pointer-events-auto w-full max-w-lg glass rounded-2xl border border-white/10 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative flex items-center justify-between p-5 border-b border-white/10">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent to-accent-light" />
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/20">
                <ArrowDownCircle size={20} className="text-accent" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Detail Pengeluaran</h2>
                <p className="text-sm text-white/40 mt-0.5">Lihat bukti bayar dan detail transaksi</p>
              </div>
            </div>
            <button onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-red-500/20 border border-white/10 flex items-center justify-center text-white transition-colors">
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            {expense.proof_image_url && (
              <div className="rounded-xl overflow-hidden border border-white/10">
                <img src={getProofUrl(expense.proof_image_url)} alt="Bukti pembayaran"
                  className="w-full h-64 object-cover" />
              </div>
            )}
            <div>
              <p className="text-white/40 text-xs mb-1 flex items-center gap-1.5"><FileText size={11} /> Nama Pengeluaran</p>
              <p className="text-white font-semibold text-lg">{expense.name}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs mb-1 flex items-center gap-1.5"><Wallet size={11} /> Jumlah Pengeluaran</p>
              <p className="text-accent font-bold text-2xl">-Rp {Number(expense.amount).toLocaleString('id-ID')}</p>
            </div>
            {expense.category && (
              <div>
                <p className="text-white/40 text-xs mb-1.5 flex items-center gap-1.5"><Tag size={11} /> Kategori</p>
                <span className="inline-block px-3 py-1 bg-accent/10 border border-accent/20 text-accent rounded-full text-sm">
                  {expense.category}
                </span>
              </div>
            )}
            {expense.description && (
              <div>
                <p className="text-white/40 text-xs mb-1 flex items-center gap-1.5"><FileText size={11} /> Deskripsi</p>
                <p className="text-white/80 leading-relaxed text-sm">{expense.description}</p>
              </div>
            )}
            <div>
              <p className="text-white/40 text-xs mb-1">Tanggal & Waktu</p>
              <p className="text-white font-medium">{formatDateDetailed(expense.created_at)}</p>
            </div>
            <div className="pt-2">
              {expense.proof_image_url ? (
                <a href={getProofUrl(expense.proof_image_url)} target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 transition-all duration-200 text-black font-bold shadow-lg shadow-orange-500/20">
                  <ExternalLink size={18} /> Lihat Bukti Bayar
                </a>
              ) : (
                <button disabled className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/40 cursor-not-allowed">
                  Tidak Ada Bukti Pembayaran
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Income Row ─────────────────────────────────────────────────────────────────
function IncomeRow({ income, onClick }) {
  return (
    <button onClick={() => onClick(income)}
      className="w-full flex items-start justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all hover:scale-[1.01] gap-3 text-left">
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 bg-green-500/10 rounded-lg shrink-0">
          <ArrowUpCircle size={18} className="text-green-400" />
        </div>
        <div className="min-w-0">
          <p className="text-white font-medium truncate">{income.name}</p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
            {income.source && (
              <span className="inline-block px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded-full">
                {income.source}
              </span>
            )}
            <span className="text-xs text-white/40">{formatDate(income.created_at)}</span>
          </div>
        </div>
      </div>
      <p className="text-green-400 font-bold shrink-0 pt-1">+Rp {income.amount.toLocaleString('id-ID')}</p>
    </button>
  )
}

// ─── Expense Row ────────────────────────────────────────────────────────────────
function ExpenseRow({ expense, onClick }) {
  return (
    <button onClick={() => onClick(expense)}
      className="w-full flex items-start justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all hover:scale-[1.01] gap-3 text-left">
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 bg-accent/10 rounded-lg shrink-0">
          <ArrowDownCircle size={18} className="text-accent" />
        </div>
        <div className="min-w-0">
          <p className="text-white font-medium truncate">{expense.name}</p>
          {expense.description && (
            <p className="text-xs text-white/50 truncate mt-0.5">{expense.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
            {expense.category && (
              <span className="inline-block px-2 py-0.5 bg-accent/10 border border-accent/20 text-accent text-xs rounded-full">
                {expense.category}
              </span>
            )}
            <span className="text-xs text-white/40">{formatDate(expense.created_at)}</span>
          </div>
        </div>
      </div>
      <p className="text-accent font-bold shrink-0 pt-1">-Rp {expense.amount.toLocaleString('id-ID')}</p>
    </button>
  )
}

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
  const currentDate = new Date()

const [selectedMonth, setSelectedMonth] = useState(
  currentDate.getMonth() + 1
)

const [selectedYear, setSelectedYear] = useState(
  currentDate.getFullYear()
) 

const handleRefresh = async () => {
    await fetchDashboardData(true)
    setToast('Data berhasil diperbarui!')
  }

  // Simpan studentId di ref agar polling bisa akses tanpa re-create interval
  const studentIdRef = useRef(null)

  // ── Fetch semua data ────────────────────────────────────────────────────────
  const fetchDashboardData = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true)

      // Fetch student row jika belum ada
      let sid  = studentIdRef.current
      let name = studentName

      if (!sid) {
        const { data: studentRow } = await supabase
          .from('students')
          .select('id, name')
          .eq('id', user?.student_id)
          .maybeSingle()
        sid  = studentRow?.id   ?? null
        name = studentRow?.name ?? ''
        setStudentName(name)
        setStudentId(sid)
        studentIdRef.current = sid
      }

      const [
        finRes, transRes, paymentRes, studentsRes,
        monthlyPaymentsRes, incomeRes, expenseRes,
      ] = await Promise.all([
        supabase.from('financial_summary').select('*').single(),
        supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(10),
        sid
          ? supabase.from('payment_status').select('*').eq('student_id', sid).order('month', { ascending: true })
          : Promise.resolve({ data: [] }),
        supabase.from('students').select('id, name'),
        supabase.from('payment_status')
          .select('student_id, paid')
.eq('month', selectedMonth)
.eq('year', selectedYear),
        supabase.from('income').select('*').order('created_at', { ascending: false }),
        supabase.from('expenses').select('*').order('created_at', { ascending: false }),
      ])

      setStats({
        miniBank:  finRes.data?.mini_bank  ?? 0,
        treasurer: finRes.data?.treasurer  ?? 0,
      })
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

  // ── Initial fetch ───────────────────────────────────────────────────────────
  useEffect(() => {
    fetchDashboardData(false)
  }, [fetchDashboardData])

  // ── Derived: total kas = income - expense (reaktif) ─────────────────────────
  const totalCash = incomes.reduce((s, r) => s + (r.amount ?? 0), 0)
                  - expenses.reduce((s, r) => s + (r.amount ?? 0), 0)

  const totalIncome  = incomes.reduce((s, r)  => s + (r.amount ?? 0), 0)
  const totalExpense = expenses.reduce((s, r) => s + (r.amount ?? 0), 0)

  const handleLogout = () => { logout(); navigate('/login') }

  const containerVariants = {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  }
  const itemVariants = {
    hidden:  { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  }

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
            <h1 className="text-2xl font-display font-bold text-white">Dashboard</h1>
            <p className="text-xs text-white/40 mt-0.5 tracking-wide">by nopal</p>
                                <motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  onClick={handleRefresh}
  disabled={isLoading}
  className="mt-2 group relative overflow-hidden px-3 py-2 rounded-xl glass border border-white/10 hover:border-accent/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
>
  {/* glow */}
  <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/10 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

  <div className="relative flex items-center gap-2">
    <RefreshCw
      size={16}
      className={`text-accent transition-transform duration-500 ${
        isLoading ? 'animate-spin' : 'group-hover:rotate-180'
      }`}
    />

    <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
      {isLoading ? 'Refreshing...' : 'Refresh'}
    </span>
  </div>
</motion.button> 
          </div>
          <div className="flex items-center gap-3"> 
            {/* Live indicator */}
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
                {lastUpdated ? `Update ${lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Memuat...'}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center shrink-0">
              <span className="text-accent text-sm font-bold">
                {(studentName || user?.name || 'S').charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm font-medium text-white">
              {studentName || user?.name || 'Student'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Navigation tabs */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { key: 'overview', label: 'Overview'    },
            { key: 'income',   label: 'Pemasukan'   },
            { key: 'expenses', label: 'Pengeluaran' },
            { key: 'payments', label: 'Pembayaran'  },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`px-5 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                activeTab === key ? 'bg-accent text-dark-primary' : 'glass hover:bg-white/10'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Main content */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-8">

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <>
            <motion.div variants={itemVariants}>
              <NotificationCard studentId={studentId} />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div variants={itemVariants}>
                <DashboardCard icon={Wallet} title="Total Kas Kelas"
                  value={`Rp ${totalCash.toLocaleString('id-ID')}`}
                  subtext="Kas Akumulasi" accentColor="from-accent to-accent-light" />
              </motion.div>
              <motion.div variants={itemVariants}>
                <DashboardCard icon={TrendingUp} title="Bank Mini"
                  value={`Rp ${stats.miniBank.toLocaleString('id-ID')}`}
                  subtext="Uang yang berada di bank mini" accentColor="from-green-500 to-emerald-500" />
              </motion.div>
              <motion.div variants={itemVariants}>
                <DashboardCard icon={TrendingDown} title="Bendahara"
                  value={`Rp ${stats.treasurer.toLocaleString('id-ID')}`}
                  subtext="Uang di bendahara" accentColor="from-blue-500 to-cyan-500" />
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

  {/* Pengeluaran terakhir */}
  <motion.div variants={itemVariants}>
    <div className="glass p-6 rounded-2xl h-full flex flex-col">
      <h3 className="text-lg font-display font-bold text-white mb-4">
        Pengeluaran Terakhir
      </h3>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {expenses.slice(0, 5).map((expense) => (
          <div
            key={expense.id}
            className="flex items-center justify-between p-3 rounded-lg bg-white/5"
          >
            <div>
              <p className="text-white font-medium">{expense.name}</p>
              <p className="text-xs text-white/50">{expense.category}</p>
            </div>
            <p className="text-accent font-bold">
              -Rp {expense.amount.toLocaleString('id-ID')}
            </p>
          </div>
        ))}
      </div>
    </div>
  </motion.div>

  {/* Pemasukan terakhir */}
  <motion.div variants={itemVariants}>
    <div className="glass p-6 rounded-2xl h-full flex flex-col">
      <h3 className="text-lg font-display font-bold text-white mb-4">
        Pemasukan Terakhir
      </h3>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {incomes.slice(0, 5).map((income) => (
          <div
            key={income.id}
            className="flex items-center justify-between p-3 rounded-lg bg-white/5"
          >
            <div>
              <p className="text-white font-medium">{income.name}</p>
              <p className="text-xs text-white/50">{income.source}</p>
            </div>
            <p className="text-green-500 font-bold">
              +Rp {income.amount.toLocaleString('id-ID')}
            </p>
          </div>
        ))}
      </div>
    </div>
  </motion.div>
              <motion.div variants={itemVariants}>
                <div className="glass p-6 rounded-2xl">
                  <div className="flex items-center justify-between mb-4 gap-3">

  <div>
    <h3 className="text-lg font-display font-bold text-white">
      Yang belum bayar
    </h3>

    <p className="text-xs text-white/40 mt-0.5">
      {monthNames[selectedMonth - 1]} {selectedYear}
    </p>
  </div>

  <select
    value={selectedMonth}
    onChange={(e) => setSelectedMonth(Number(e.target.value))}
    className="bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent"
  >
    {monthNames.map((month, index) => (
      <option
        key={index}
        value={index + 1}
        className="bg-dark-secondary"
      >
        {month}
      </option>
    ))}
  </select>
</div>
                  <div className="space-y-3 max-h-96 overflow-auto">
                    {unpaidStudents.length > 0 ? (
                      unpaidStudents.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                          <span className="text-white text-sm">{item.name}</span>
                          <span className="px-2.5 py-1 bg-red-500/20 border border-red-500/50 text-red-200 text-xs rounded-full">❌ Unpaid</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-white/50 text-sm text-center py-6">Semua Sudah bayar! ✅</p>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>

            <motion.div variants={itemVariants}>
              <PaymentStatusTable payments={paymentStatus} isLoading={isLoading} />
            </motion.div>
          </>
        )}

        {/* ── INCOME ── */}
        {activeTab === 'income' && (
          <motion.div variants={itemVariants}>
            <div className="glass p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-display font-bold text-white">Pemasukan</h2>
                  <p className="text-sm text-white/50 mt-0.5">
                    {incomes.length} transaksi •{' '}
                    <span className="text-green-400">+Rp {totalIncome.toLocaleString('id-ID')}</span>
                  </p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-xl">
                  <ArrowUpCircle size={24} className="text-green-400" />
                </div>
              </div>
              <div className="space-y-3 max-h-[600px] overflow-auto">
                {isLoading
                  ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 rounded-lg bg-white/5 animate-pulse" />)
                  : incomes.length > 0
                    ? incomes.map((income) => <IncomeRow key={income.id} income={income} onClick={setSelectedIncome} />)
                    : <p className="text-white/40 text-sm text-center py-10">Belum ada data pemasukan.</p>}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── EXPENSES ── */}
        {activeTab === 'expenses' && (
          <motion.div variants={itemVariants}>
            <div className="glass p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-display font-bold text-white">Pengeluaran</h2>
                  <p className="text-sm text-white/50 mt-0.5">
                    {expenses.length} transaksi •{' '}
                    <span className="text-accent">-Rp {totalExpense.toLocaleString('id-ID')}</span>
                  </p>
                </div>
                <div className="p-3 bg-accent/10 rounded-xl">
                  <ArrowDownCircle size={24} className="text-accent" />
                </div>
              </div>
              <div className="space-y-3 max-h-[600px] overflow-auto">
                {isLoading
                  ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 rounded-lg bg-white/5 animate-pulse" />)
                  : expenses.length > 0
                    ? expenses.map((expense) => <ExpenseRow key={expense.id} expense={expense} onClick={setSelectedExpense} />)
                    : <p className="text-white/40 text-sm text-center py-10">Belum ada data pengeluaran.</p>}
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

      {/* ── INCOME MODAL ── */}
      {selectedIncome && (
        <IncomeDetailModal income={selectedIncome} onClose={() => setSelectedIncome(null)} />
      )}

      {/* ── EXPENSE MODAL ── */}
      {selectedExpense && (
        <ExpenseDetailModal expense={selectedExpense} onClose={() => setSelectedExpense(null)} />
      )}
    </div>
  )
}