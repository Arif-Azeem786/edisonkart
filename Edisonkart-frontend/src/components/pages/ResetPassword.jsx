import { useState } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Lock, Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react'
import { Button } from '../ui/button'

const ResetPassword = () => {
    const { token } = useParams()
    const navigate = useNavigate()
    const [formData, setFormData] = useState({ password: '', confirmPassword: '' })
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [errors, setErrors] = useState({})

    const validateForm = () => {
        const newErrors = {}
        if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters'
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validateForm()) return
        setIsLoading(true)
        await new Promise(resolve => setTimeout(resolve, 1500))
        setIsLoading(false)
        setIsSubmitted(true)
        setTimeout(() => navigate('/login'), 3000)
    }

    const getPasswordStrength = () => {
        const p = formData.password
        if (!p) return 0
        let s = 0
        if (p.length >= 8) s++
        if (/[A-Z]/.test(p)) s++
        if (/[0-9]/.test(p)) s++
        if (/[^A-Za-z0-9]/.test(p)) s++
        return s
    }

    const strength = getPasswordStrength()
    const strengthText = ['Weak', 'Fair', 'Good', 'Strong']
    const strengthColor = ['bg-red-500', 'bg-amber-500', 'bg-[#F97316]', 'bg-[#10B981]']
    const strengthTextColor = ['text-red-500', 'text-amber-500', 'text-[#F97316]', 'text-[#10B981]']

    return (
        <div className="min-h-screen flex items-center justify-center bg-background py-16 px-4">
            <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-[#1E3A8A]/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-[#F97316]/5 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full relative z-10"
            >
                <div className="bg-card rounded-2xl shadow-xl shadow-black/[0.04] border border-border/50 p-8">
                    {!isSubmitted ? (
                        <>
                            <div className="text-center mb-8">
                                <div className="inline-flex p-3 bg-[#1E3A8A]/10 rounded-xl mb-4">
                                    <Lock className="h-7 w-7 text-[#1E3A8A]" />
                                </div>
                                <h1 className="text-2xl font-bold mb-2">Reset Password</h1>
                                <p className="text-muted-foreground text-sm">Enter your new password below</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* New Password */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">New Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required
                                            className={`w-full pl-10 pr-12 py-3 bg-muted border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] transition-all text-sm ${errors.password ? 'border-red-500' : 'border-border/50'}`}
                                            placeholder="Enter new password"
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>}

                                    {formData.password && (
                                        <div className="mt-2.5">
                                            <div className="flex gap-1 h-1">
                                                {[...Array(4)].map((_, i) => (
                                                    <div key={i} className={`flex-1 rounded-full transition ${i < strength ? strengthColor[strength - 1] : 'bg-muted'}`} />
                                                ))}
                                            </div>
                                            <p className="text-xs mt-1.5 text-muted-foreground">
                                                Strength: <span className={strengthTextColor[strength - 1]}>{strengthText[strength - 1] || 'Too weak'}</span>
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">Confirm Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            required
                                            className={`w-full pl-10 pr-12 py-3 bg-muted border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] transition-all text-sm ${errors.confirmPassword ? 'border-red-500' : 'border-border/50'}`}
                                            placeholder="Confirm new password"
                                        />
                                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-500">{errors.confirmPassword}</p>}
                                </div>

                                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                                    <Button
                                        type="submit"
                                        className="w-full rounded-xl bg-[#1E3A8A] hover:bg-[#15306B] h-12 font-semibold shadow-lg shadow-[#1E3A8A]/20"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ repeat: Infinity, duration: 1 }}
                                                className="h-5 w-5 border-2 border-white border-t-transparent rounded-full"
                                            />
                                        ) : 'Reset Password'}
                                    </Button>
                                </motion.div>
                            </form>
                        </>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-6"
                        >
                            <div className="inline-flex p-3 bg-[#10B981]/10 rounded-xl mb-4">
                                <CheckCircle className="h-10 w-10 text-[#10B981]" />
                            </div>
                            <h2 className="text-xl font-bold mb-2">Password Reset Successfully!</h2>
                            <p className="text-muted-foreground text-sm mb-6">
                                Your password has been updated. Redirecting to login...
                            </p>
                            <div className="w-12 h-12 mx-auto mb-4">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                    className="w-12 h-12 border-3 border-[#1E3A8A] border-t-transparent rounded-full"
                                />
                            </div>
                            <Link to="/login">
                                <Button variant="outline" className="rounded-xl">Go to Login</Button>
                            </Link>
                        </motion.div>
                    )}

                    <p className="text-center text-sm text-muted-foreground mt-6">
                        <Link to="/login" className="text-[#1E3A8A] hover:underline inline-flex items-center font-semibold">
                            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                            Back to Login
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    )
}

export default ResetPassword