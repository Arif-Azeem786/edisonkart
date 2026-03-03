import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import useAuthStore from '../../store/authStore'
import AuthLayout from '../ui/AuthLayout'
import { validateEmail, validatePassword, validateRequired } from '../../utils/validation'
import { useToast } from '../ui/use-toast'

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    })
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const navigate = useNavigate()
    const { register } = useAuthStore()
    const { toast } = useToast()

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!validateRequired(formData.name)) {
            setError('Full Name is required')
            return
        }
        if (!validateEmail(formData.email)) {
            setError('Invalid email address')
            return
        }
        if (!validatePassword(formData.password)) {
            setError('Password must be at least 6 characters')
            return
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match')
            return
        }

        setIsLoading(true)

        try {
            await register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
            })
            toast({
                title: "Account created!",
                description: "Please verify your email to continue.",
            })
            navigate('/verify-otp', { state: { email: formData.email } })
        } catch (err) {
            let errorMessage = 'Registration failed';
            
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

    const inputClass = "w-full bg-white border border-slate-200 rounded-xl px-11 py-3 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/10 transition-all duration-200"
    const iconClass = "absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400 group-focus-within:text-[#1E3A8A] transition-colors duration-200"

    return (
        <AuthLayout
            title="Create Account"
            subtitle="Join EdisonKart today — it's free"
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
                    {/* Full Name */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 ml-0.5">Full Name</label>
                        <div className="relative group">
                            <User className={iconClass} />
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="Enter your full name"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 ml-0.5">Email Address</label>
                        <div className="relative group">
                            <Mail className={iconClass} />
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="name@example.com"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 ml-0.5">Password</label>
                        <div className="relative group">
                            <Lock className={iconClass} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="Create a password"
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

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 ml-0.5">Confirm Password</label>
                        <div className="relative group">
                            <Lock className={iconClass} />
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="Confirm your password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                {showConfirmPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Terms Checkbox */}
                <div className="flex items-start gap-3">
                    <input
                        type="checkbox"
                        id="terms"
                        required
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#1E3A8A] focus:ring-[#1E3A8A]/30 focus:ring-offset-0 accent-[#1E3A8A]"
                    />
                    <label htmlFor="terms" className="text-sm text-slate-500 leading-snug">
                        I agree to the{' '}
                        <Link to="/terms" className="text-[#1E3A8A] hover:text-[#F97316] font-medium transition-colors">Terms of Service</Link>
                        {' '}and{' '}
                        <Link to="/privacy" className="text-[#1E3A8A] hover:text-[#F97316] font-medium transition-colors">Privacy Policy</Link>
                    </label>
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
                                Create Account
                                <ArrowRight className="h-4 w-4" />
                            </span>
                        )}
                    </Button>
                </motion.div>

                {/* Login Link */}
                <p className="text-center text-sm text-slate-400 pt-2">
                    Already have an account?{' '}
                    <Link to="/login" className="text-[#F97316] hover:text-[#EA580C] font-semibold transition-colors">
                        Sign in
                    </Link>
                </p>
            </form>
        </AuthLayout>
    )
}

export default Register