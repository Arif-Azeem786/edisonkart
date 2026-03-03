import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, ArrowLeft, Send, CheckCircle, KeyRound, ShieldCheck, Lock, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../ui/button'
import { forgotPassword, verifyResetOTP, resetPassword } from '../../services/auth'

const ForgotPassword = () => {
    const [step, setStep] = useState(1) // 1: Email, 2: OTP, 3: New Password
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [resendCooldown, setResendCooldown] = useState(0)
    const navigate = useNavigate()
    const otpRefs = useRef([])

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [resendCooldown])

    // Step 1: Send OTP to email
    const handleSendOTP = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')
        try {
            await forgotPassword(email)
            setStep(2)
            setResendCooldown(60)
        } catch (err) {
            setError(err?.message || 'Failed to send OTP. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    // Step 2: Verify OTP
    const handleVerifyOTP = async (e) => {
        e.preventDefault()
        const otpString = otp.join('')
        if (otpString.length !== 6) {
            setError('Please enter the complete 6-digit OTP')
            return
        }
        setIsLoading(true)
        setError('')
        try {
            await verifyResetOTP(email, otpString)
            setStep(3)
        } catch (err) {
            setError(err?.message || 'Invalid or expired OTP')
        } finally {
            setIsLoading(false)
        }
    }

    // Step 3: Reset password
    const handleResetPassword = async (e) => {
        e.preventDefault()
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match')
            return
        }
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }
        setIsLoading(true)
        setError('')
        try {
            await resetPassword(email, otp.join(''), newPassword)
            setSuccess(true)
        } catch (err) {
            setError(err?.message || 'Failed to reset password')
        } finally {
            setIsLoading(false)
        }
    }

    // Resend OTP
    const handleResendOTP = async () => {
        if (resendCooldown > 0) return
        setIsLoading(true)
        setError('')
        try {
            await forgotPassword(email)
            setResendCooldown(60)
            setOtp(['', '', '', '', '', ''])
        } catch (err) {
            setError(err?.message || 'Failed to resend OTP')
        } finally {
            setIsLoading(false)
        }
    }

    // OTP input handlers
    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return
        const newOtp = [...otp]
        newOtp[index] = value.slice(-1)
        setOtp(newOtp)
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus()
        }
    }

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus()
        }
    }

    const handleOtpPaste = (e) => {
        e.preventDefault()
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
        if (pasted.length > 0) {
            const newOtp = [...otp]
            for (let i = 0; i < 6; i++) {
                newOtp[i] = pasted[i] || ''
            }
            setOtp(newOtp)
            const focusIndex = Math.min(pasted.length, 5)
            otpRefs.current[focusIndex]?.focus()
        }
    }

    const stepVariants = {
        initial: { opacity: 0, x: 30 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -30 }
    }

    const steps = [
        { num: 1, label: 'Email' },
        { num: 2, label: 'Verify' },
        { num: 3, label: 'Reset' },
    ]

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
                    <Link to="/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-[#1E3A8A] mb-6 transition-colors">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back to Login
                    </Link>

                    {/* Step Indicator */}
                    {!success && (
                        <div className="flex items-center justify-center mb-8 gap-1">
                            {steps.map((s, i) => (
                                <div key={s.num} className="flex items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${step >= s.num
                                        ? 'bg-[#1E3A8A] text-white shadow-lg shadow-[#1E3A8A]/25'
                                        : 'bg-slate-100 text-slate-400'
                                        }`}>
                                        {step > s.num ? <CheckCircle className="h-4 w-4" /> : s.num}
                                    </div>
                                    {i < steps.length - 1 && (
                                        <div className={`w-12 h-0.5 mx-1 transition-all duration-300 ${step > s.num ? 'bg-[#1E3A8A]' : 'bg-slate-200'
                                            }`} />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Error Display */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: 'auto' }}
                                exit={{ opacity: 0, y: -10, height: 0 }}
                                className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl"
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                        {/* Step 1: Enter Email */}
                        {step === 1 && !success && (
                            <motion.div key="step1" variants={stepVariants} initial="initial" animate="animate" exit="exit">
                                <div className="text-center mb-8">
                                    <div className="inline-flex p-3 bg-[#1E3A8A]/10 rounded-xl mb-4">
                                        <Mail className="h-7 w-7 text-[#1E3A8A]" />
                                    </div>
                                    <h1 className="text-2xl font-bold mb-2">Forgot Password?</h1>
                                    <p className="text-muted-foreground text-sm">
                                        Enter your email and we'll send you an OTP to reset your password.
                                    </p>
                                </div>

                                <form onSubmit={handleSendOTP} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Email Address</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            placeholder="you@example.com"
                                            className="w-full px-4 py-3 bg-muted border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] transition-all text-sm"
                                        />
                                    </div>

                                    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                                        <Button
                                            type="submit"
                                            className="w-full rounded-xl bg-[#1E3A8A] hover:bg-[#F97316] h-12 font-semibold shadow-lg shadow-[#1E3A8A]/15 transition-all duration-300"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ repeat: Infinity, duration: 1 }}
                                                    className="h-5 w-5 border-2 border-white border-t-transparent rounded-full"
                                                />
                                            ) : (
                                                <>Send OTP <Send className="ml-2 h-4 w-4" /></>
                                            )}
                                        </Button>
                                    </motion.div>
                                </form>
                            </motion.div>
                        )}

                        {/* Step 2: Enter OTP */}
                        {step === 2 && !success && (
                            <motion.div key="step2" variants={stepVariants} initial="initial" animate="animate" exit="exit">
                                <div className="text-center mb-8">
                                    <div className="inline-flex p-3 bg-[#F97316]/10 rounded-xl mb-4">
                                        <ShieldCheck className="h-7 w-7 text-[#F97316]" />
                                    </div>
                                    <h1 className="text-2xl font-bold mb-2">Verify OTP</h1>
                                    <p className="text-muted-foreground text-sm">
                                        Enter the 6-digit code sent to<br />
                                        <span className="font-medium text-[#1E3A8A]">{email}</span>
                                    </p>
                                </div>

                                <form onSubmit={handleVerifyOTP} className="space-y-6">
                                    {/* OTP Input */}
                                    <div className="flex justify-center gap-3">
                                        {otp.map((digit, index) => (
                                            <input
                                                key={index}
                                                ref={el => otpRefs.current[index] = el}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={1}
                                                value={digit}
                                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                                onPaste={index === 0 ? handleOtpPaste : undefined}
                                                className="w-12 h-14 text-center text-xl font-bold bg-white border-2 border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] transition-all text-slate-900"
                                            />
                                        ))}
                                    </div>

                                    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                                        <Button
                                            type="submit"
                                            className="w-full rounded-xl bg-[#1E3A8A] hover:bg-[#F97316] h-12 font-semibold shadow-lg shadow-[#1E3A8A]/15 transition-all duration-300"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ repeat: Infinity, duration: 1 }}
                                                    className="h-5 w-5 border-2 border-white border-t-transparent rounded-full"
                                                />
                                            ) : (
                                                <>Verify OTP <ShieldCheck className="ml-2 h-4 w-4" /></>
                                            )}
                                        </Button>
                                    </motion.div>

                                    {/* Resend OTP */}
                                    <div className="text-center text-sm text-muted-foreground">
                                        Didn't receive the code?{' '}
                                        {resendCooldown > 0 ? (
                                            <span className="text-slate-400">Resend in {resendCooldown}s</span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleResendOTP}
                                                className="text-[#F97316] hover:underline font-semibold inline-flex items-center gap-1"
                                                disabled={isLoading}
                                            >
                                                <RefreshCw className="h-3.5 w-3.5" />
                                                Resend OTP
                                            </button>
                                        )}
                                    </div>

                                    {/* Change email */}
                                    <div className="text-center">
                                        <button
                                            type="button"
                                            onClick={() => { setStep(1); setOtp(['', '', '', '', '', '']); setError('') }}
                                            className="text-sm text-muted-foreground hover:text-[#1E3A8A] transition-colors"
                                        >
                                            ← Change email address
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        )}

                        {/* Step 3: New Password */}
                        {step === 3 && !success && (
                            <motion.div key="step3" variants={stepVariants} initial="initial" animate="animate" exit="exit">
                                <div className="text-center mb-8">
                                    <div className="inline-flex p-3 bg-[#1E3A8A]/10 rounded-xl mb-4">
                                        <KeyRound className="h-7 w-7 text-[#1E3A8A]" />
                                    </div>
                                    <h1 className="text-2xl font-bold mb-2">Set New Password</h1>
                                    <p className="text-muted-foreground text-sm">
                                        Create a strong password for your account
                                    </p>
                                </div>

                                <form onSubmit={handleResetPassword} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">New Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="Min. 6 characters"
                                                required
                                                minLength={6}
                                                className="w-full px-4 py-3 bg-muted border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] transition-all text-sm pr-12"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Confirm Password</label>
                                        <div className="relative">
                                            <input
                                                type={showConfirm ? 'text' : 'password'}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Re-enter your password"
                                                required
                                                minLength={6}
                                                className="w-full px-4 py-3 bg-muted border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] transition-all text-sm pr-12"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirm(!showConfirm)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        {confirmPassword && newPassword !== confirmPassword && (
                                            <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                                        )}
                                    </div>

                                    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                                        <Button
                                            type="submit"
                                            className="w-full rounded-xl bg-[#1E3A8A] hover:bg-[#F97316] h-12 font-semibold shadow-lg shadow-[#1E3A8A]/15 transition-all duration-300"
                                            disabled={isLoading || (confirmPassword && newPassword !== confirmPassword)}
                                        >
                                            {isLoading ? (
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ repeat: Infinity, duration: 1 }}
                                                    className="h-5 w-5 border-2 border-white border-t-transparent rounded-full"
                                                />
                                            ) : (
                                                <>Reset Password <Lock className="ml-2 h-4 w-4" /></>
                                            )}
                                        </Button>
                                    </motion.div>
                                </form>
                            </motion.div>
                        )}

                        {/* Success State */}
                        {success && (
                            <motion.div key="success" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="text-center py-6">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                                    className="inline-flex p-4 bg-green-100 rounded-full mb-4"
                                >
                                    <CheckCircle className="h-10 w-10 text-green-500" />
                                </motion.div>
                                <h2 className="text-xl font-bold mb-2">Password Reset Successful!</h2>
                                <p className="text-muted-foreground text-sm mb-6">
                                    Your password has been updated. You can now log in with your new password.
                                </p>
                                <Link to="/login">
                                    <Button className="rounded-xl bg-[#1E3A8A] hover:bg-[#F97316] h-12 px-8 font-semibold shadow-lg shadow-[#1E3A8A]/15 transition-all duration-300">
                                        Go to Login
                                    </Button>
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {!success && (
                        <p className="text-center text-sm text-muted-foreground mt-6">
                            Remember your password?{' '}
                            <Link to="/login" className="text-[#1E3A8A] hover:underline font-semibold">Sign in</Link>
                        </p>
                    )}
                </div>
            </motion.div>
        </div>
    )
}

export default ForgotPassword