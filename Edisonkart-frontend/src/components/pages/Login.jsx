import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import useAuthStore from '../../store/authStore'
import AuthLayout from '../ui/AuthLayout'
import { validateEmail, validatePassword } from '../../utils/validation'
import { useToast } from '../ui/use-toast'

const Login = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const navigate = useNavigate()
    const { login } = useAuthStore()
    const { toast } = useToast()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!validateEmail(email)) {
            setError('Please enter a valid email address')
            return
        }
        if (!validatePassword(password)) {
            setError('Password must be at least 6 characters')
            return
        }

        setIsLoading(true)

        try {
            await login(email, password)
            const currentUser = useAuthStore.getState().user
            toast({
                title: "Welcome back!",
                description: "You have been signed in successfully.",
            })
            // Redirect ADMIN and EMPLOYEE to admin panel
            const from = location.state?.from?.pathname || '/'
            if (currentUser?.role === 'ADMIN') {
                navigate('/admin')
            } else if (currentUser?.role === 'EMPLOYEE') {
                navigate('/admin/orders')
            } else {
                navigate(from, { replace: true })
            }
        } catch (err) {
            let errorMessage = 'Invalid email or password';
            
            if (typeof err === 'string') {
                errorMessage = err;
            } else if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
                errorMessage = err.errors[0].message;
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            setError(errorMessage);
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AuthLayout
            title="Welcome Back"
            subtitle="Sign in to your account to continue"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Error Alert */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 border border-red-100 text-red-600 p-3.5 rounded-xl text-sm flex items-center gap-3"
                    >
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" />
                        {error}
                    </motion.div>
                )}

                <div className="space-y-4">
                    {/* Email */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 ml-0.5">Email Address</label>
                        <div className="relative group">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400 group-focus-within:text-[#1E3A8A] transition-colors duration-200" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-11 py-3 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/10 transition-all duration-200"
                                placeholder="name@example.com"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between ml-0.5">
                            <label className="text-sm font-medium text-slate-700">Password</label>
                            <Link
                                to="/forgot-password"
                                className="text-xs text-[#F97316] hover:text-[#EA580C] font-medium transition-colors"
                            >
                                Forgot password?
                            </Link>
                        </div>
                        <div className="relative group">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400 group-focus-within:text-[#1E3A8A] transition-colors duration-200" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-11 py-3 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/10 transition-all duration-200"
                                placeholder="Enter your password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="pt-1">
                    <Button
                        type="submit"
                        className="w-full h-12 bg-[#1E3A8A] hover:bg-[#F97316] text-white rounded-xl font-semibold shadow-lg shadow-[#1E3A8A]/15 transition-all duration-300"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <span className="flex items-center gap-2">
                                Sign In
                                <ArrowRight className="h-4 w-4" />
                            </span>
                        )}
                    </Button>
                </motion.div>

                {/* Register link */}
                <p className="text-center text-sm text-slate-400 pt-2">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-[#F97316] hover:text-[#EA580C] font-semibold transition-colors">
                        Create account
                    </Link>
                </p>
            </form>
        </AuthLayout>
    )
}

export default Login