import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ChevronDown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { Wallet } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setStudents(data || [])
    } catch (err) {
      console.error('Failed to fetch students:', err)
      setError('Failed to load students')
    }
  }

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    if (!selectedStudent || !password) {
      setError('Please select a student and enter password')
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('student_id', selectedStudent.id)
        .eq('password', password) // Note: In production, use proper password hashing
        .single()

      if (error) throw new Error('Invalid credentials')

      // Generate token
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      
      login(data, token, data.role || 'user')
      navigate(`/dashboard?token=${token}`)
    } catch (err) {
      setError('Invalid email or password')
      console.error('Login error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#090909] flex items-center justify-center px-6 py-10 relative overflow-hidden">
      {/* Background decoration */}
<div className="absolute inset-0 pointer-events-none overflow-hidden">
    <div className="absolute -top-32 right-[-120px] w-[450px] h-[450px] rounded-full bg-violet-500/10 blur-[120px]" />

    <div className="absolute bottom-[-120px] left-[-80px] w-[350px] h-[350px] rounded-full bg-violet-500/5 blur-[120px]" />
</div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
       <div
className="
bg-white/[0.04]
border
border-white/10
rounded-3xl
backdrop-blur-xl
shadow-2xl
p-10
">
<div className="text-center mb-10">

    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-500/20">

        <Wallet
            className="text-violet-400"
            size={40}
            strokeWidth={2.2}
        />

    </div>

    <h1 className="text-4xl font-bold text-white tracking-tight">
        CashFlow
    </h1>

    <p className="mt-2 text-sm text-white/45 tracking-[0.25em] uppercase">
        XI TKJ A
    </p>

</div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Student Selector */}
            <div>
              <label className="block text-sm font-medium text-white mb-3">
                Pilih Nama
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-full px-4 py-3 glass flex items-center justify-between text-left hover:bg-white/20 transition-colors"
                >
                  <span className={selectedStudent ? 'text-white' : 'text-white/50'}>
                    {selectedStudent ? selectedStudent.name : 'Pilih Nama Siswa...'}
                  </span>
                  <ChevronDown
                    size={20}
                    className={`text-accent transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Dropdown */}
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full left-0 right-0 mt-2 z-20 max-h-48 overflow-auto rounded-2xl bg-slate-900/95 border border-accent/20 shadow-lg"
                  >
                    {/* Search input */}
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 bg-transparent border-b border-accent/20 text-white placeholder-white/30 focus:outline-none focus:border-accent/50"
                    />

                    {/* Student list */}
                    <div className="p-2">
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => (
                          <button
                            key={student.id}
                            type="button"
                            onClick={() => {
                              setSelectedStudent(student)
                              setShowDropdown(false)
                              setSearchQuery('')
                            }}
                            className="w-full text-left px-4 py-2.5 text-white hover:bg-accent/20 rounded-lg transition-colors"
                          >
                            {student.name}
                          </button>
                        ))
                      ) : (
                        <p className="px-4 py-2 text-white/50 text-sm">No students found</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-white mb-3">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan Kata Sandi"
                  className="w-full px-4 py-3 glass text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-accent transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 py-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Submit button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
              className="
w-full
rounded-xl
bg-violet-500
py-3.5
font-semibold
text-white
transition-all
hover:bg-violet-400
hover:shadow-lg
hover:shadow-violet-500/20
disabled:opacity-50
"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </motion.button>
          </form>

          {/* Demo info */}
          <p className="text-center text-xs text-white/40 mt-6">
            Tip: Pilih nama anda lalu ketik kata sandi kemudian klik login
          </p>
        </div>
      </motion.div>
    </div>
  )
}