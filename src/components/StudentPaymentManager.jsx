import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, ChevronDown } from 'lucide-react'
import { supabase } from '../lib/supabase'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function StudentPaymentManager({ onOpenMonthModal, onSelectionUpdate }) {
  const currentDate = new Date()
  const [students, setStudents] = useState([])
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1)
  const [payments, setPayments] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [checkedStudents, setCheckedStudents] = useState(new Set())
  const [pendingChanges, setPendingChanges] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchPaymentData()
  }, [selectedMonth])

  const fetchPaymentData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch students
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .order('name', { ascending: true })

      // Fetch payment status for selected month
      const { data: paymentData } = await supabase
        .from('payment_status')
        .select('*')
        .eq('month', selectedMonth)

      setStudents(studentData || [])
      
      // Create payment map
      const paymentMap = {}
      paymentData?.forEach((p) => {
        paymentMap[p.student_id] = p
      })
      setPayments(paymentMap)
    } catch (err) {
      console.error('Failed to fetch payment data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Toggle checkbox
  const handleCheckboxChange = (studentId, studentName, currentStatus) => {
    const newChecked = new Set(checkedStudents)
    
    if (newChecked.has(studentId)) {
      newChecked.delete(studentId)
      const newPending = { ...pendingChanges }
      delete newPending[studentId]
      setPendingChanges(newPending)
    } else {
      newChecked.add(studentId)
      setPendingChanges({
        ...pendingChanges,
        [studentId]: {
          studentId,
          studentName,
          willBePaid: !currentStatus,
        },
      })
    }
    
    setCheckedStudents(newChecked)
  }

  useEffect(() => {
    if (typeof onSelectionUpdate !== 'function') return
    const pendingValues = Object.values(pendingChanges)
    const pendingPaid = pendingValues.filter((item) => item.willBePaid).length
    const pendingUnpaid = pendingValues.filter((item) => !item.willBePaid).length

    onSelectionUpdate({
      selectedCount: checkedStudents.size,
      pendingPaid,
      pendingUnpaid,
      isSaving,
      saveChanges: handleSaveChanges,
      cancelChanges: handleCancel,
    })
  }, [checkedStudents, pendingChanges, isSaving, onSelectionUpdate])

  // Save all changes to database
  const handleSaveChanges = async () => {
    if (Object.keys(pendingChanges).length === 0) return

    setIsSaving(true)
    try {
      // Process each pending change
      for (const [studentId, change] of Object.entries(pendingChanges)) {
        const payment = payments[studentId]
        const { willBePaid, studentName } = change

        if (willBePaid) {
          // Update/Create payment_status to PAID
          if (payment) {
            await supabase
              .from('payment_status')
              .update({
                paid: true,
                updated_at: new Date().toISOString(),
              })
              .eq('id', payment.id)
          } else {
            await supabase
              .from('payment_status')
              .insert([
                {
                  student_id: studentId,
                  month: selectedMonth,
                  year: new Date().getFullYear(),
                  paid: true,
                  updated_at: new Date().toISOString(),
                },
              ])
          }

          // Insert income otomatis
          await supabase
            .from('income')
            .insert([
              {
                name: `${studentName} - ${MONTHS[selectedMonth - 1]} Payment`,
                amount: 10000,
                source: 'Student Contributions',
                description: `Payment from ${studentName}`,
                created_at: new Date().toISOString(),
              },
            ])
        } else {
          // Update payment_status to UNPAID
          if (payment) {
            await supabase
              .from('payment_status')
              .update({
                paid: false,
                updated_at: new Date().toISOString(),
              })
              .eq('id', payment.id)
          }

          // Hapus income terkait
          await supabase
            .from('income')
            .delete()
            .ilike('name', `%${studentName}%`)
            .eq('amount', 10000)
        }
      }

      // Reset states
      setCheckedStudents(new Set())
      setPendingChanges({})
      
      // Refresh data
      await fetchPaymentData()
    } catch (err) {
      console.error('Failed to save payment changes:', err)
      alert('Gagal menyimpan perubahan. Silakan coba lagi.')
    } finally {
      setIsSaving(false)
    }
  }

  // Cancel all changes
  const handleCancel = () => {
    setCheckedStudents(new Set())
    setPendingChanges({})
  }

  const filteredStudents = students.filter((student) =>
    student.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="glass p-4 sm:p-6 rounded-2xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
        <h2 className="text-xl sm:text-2xl font-display font-bold text-white">
          Manage Student Payments
        </h2>

        {/* Month selector */}
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          className="px-3 py-2 sm:px-4 sm:py-2 glass text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-accent/50 rounded-lg"
        >
          {MONTHS.map((month, idx) => (
            <option key={month} value={idx + 1} className="bg-dark-primary">
              {month}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4 w-full max-w-md">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nama student..."
          className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className={`space-y-3 ${checkedStudents.size > 0 ? 'pb-32' : ''}`}>
          {filteredStudents.map((student) => {
            const payment = payments[student.id]
            const isPaid = payment?.paid || false
            const isChecked = checkedStudents.has(student.id)
            const hasPending = pendingChanges[student.id]

            return (
              <motion.div
                key={student.id}
                layout
                className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 rounded-xl transition-all cursor-pointer ${
                  isChecked
                    ? 'bg-accent/20 border border-accent/50'
                    : 'bg-white/5 hover:bg-white/10'
                } group`}
                onClick={() =>
                  handleCheckboxChange(student.id, student.name, isPaid)
                }
              >
                <div className="flex items-start gap-3 flex-1 w-full">
                  {/* Checkbox */}
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() =>
                        handleCheckboxChange(student.id, student.name, isPaid)
                      }
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                        isChecked
                          ? 'bg-accent border-accent'
                          : 'border-white/30 hover:border-accent'
                      }`}
                    >
                      {isChecked && <Check size={16} className="text-dark-primary" />}
                    </button>
                  </motion.div>

                  {/* Student info */}
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base text-white font-medium truncate">{student.name}</p>
                    <p className="text-[11px] sm:text-xs text-white/50 mt-0.5">
                      {hasPending ? (
                        <span className="text-accent">
                          {hasPending.willBePaid ? '→ Will change to: Bayar' : '→ Will change to: Belum Bayar'}
                        </span>
                      ) : (
                        `Current: ${isPaid ? '✓ Bayar' : '✗ Belum Bayar'}`
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenMonthModal(student)
                    }}
                    className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-2xl bg-white/10 text-white text-xs sm:text-sm border border-white/10 hover:bg-white/20 transition-colors"
                  >
                    Bayar Lebih dari 1 Bulan
                  </button>

                  {/* Current status badge */}
                  <div
                    className={`px-2.5 py-1 rounded-full text-[11px] sm:text-sm font-medium ${
                      isPaid
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {isPaid ? '✓ Bayar' : '✗ Belum Bayar'}
                  </div>
                </div>
              </motion.div>
            )
          })}
          {filteredStudents.length === 0 && (
            <p className="text-center text-white/40 text-sm py-8">
              {searchQuery ? 'No matching students found.' : 'No students found.'}
            </p>
          )}
        </div>
      )}

      {!isLoading && students.length === 0 && (
        <p className="text-center text-white/50 py-8">
          No students found
        </p>
      )}

      {/* Legend */}
      <div className="flex gap-6 mt-8 pt-6 border-t border-accent/10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-sm text-white/70">Bayar</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-sm text-white/70">Belum Bayar</span>
        </div>
      </div>


    </div>
  )
}
