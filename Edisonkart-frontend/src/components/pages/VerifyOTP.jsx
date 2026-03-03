import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, ArrowRight, RefreshCw } from 'lucide-react'
import { Button } from '../ui/button'
import useAuthStore from '../../store/authStore'

const VerifyOTP = () => {
    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [timeLeft, setTimeLeft] = useState(60)
    const [canResend, setCanResend] = useState(false)

    const inputRefs = useRef([])
    const location = useLocation()
    const navigate = useNavigate()
    const { verifyOTP, resendOTP } = useAuthStore()

    const email = location.state?.email

    useEffect(() => {
        if (!email) navigate('/register')
    }, [email, navigate])

    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
            return () => clearTimeout(timer)
        } else {
            setCanResend(true)
        }
    }, [timeLeft])

    const handleChange = (index, value) => {
        if (value.length > 1) return
        const newOtp = [...otp]
        newOtp[index] = value
        setOtp(newOtp)
        if (value && index < 5) inputRefs.current[index + 1].focus()
    }

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus()
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const otpString = otp.join('')
        if (otpString.length !== 6) {
            setError('Please enter complete OTP')
            return
        }
        setIsLoading(true)
        setError('')
        try {
            await verifyOTP(email, otpString)
            navigate('/login')
        } catch (err) {
            setError(err.message || 'Invalid OTP')
        } finally {
            setIsLoading(false)
        }
    }

    const handleResend = async () => {
        if (!canResend) return
        try {
            await resendOTP(email)
            setTimeLeft(60)
            setCanResend(false)
            setOtp(['', '', '', '', '', ''])
            setError('')
        } catch (err) {
            setError(err.message || 'Failed to resend OTP')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background py-16 px-4">
            <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-[#1E3A8A]/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-[#F97316]/5 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-md w-full relative z-10"
            >
                <div className="bg-card rounded-2xl shadow-xl shadow-black/[0.04] border border-border/50 p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200 }}
                            className="inline-flex items-center justify-center w-14 h-14 bg-[#1E3A8A]/10 rounded-xl mb-4"
                        >
                            <Mail className="h-7 w-7 text-[#1E3A8A]" />
                        </motion.div>
                        <h2 className="text-2xl font-bold mb-2">Verify Your Email</h2>
                        <p className="text-muted-foreground text-sm">
                            We've sent a verification code to<br />
                            <span className="font-medium text-[#1E3A8A]">{email}</span>
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-50 text-red-600 p-3.5 rounded-xl text-sm text-center flex items-center justify-center gap-2"
                            >
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" />
                                {error}
                            </motion.div>
                        )}

                        {/* OTP Inputs */}
                        <div className="flex justify-center gap-2.5">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className="w-12 h-12 text-center text-lg font-semibold bg-white border-2 border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] transition-all text-slate-900"
                                />
                            ))}
                        </div>

                        {/* Timer & Resend */}
                        <div className="text-center">
                            {timeLeft > 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Resend code in <span className="font-medium text-foreground">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                                </p>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    className="text-sm text-[#F97316] hover:underline inline-flex items-center font-medium"
                                >
                                    <RefreshCw className="h-3.5 w-3.5 mr-1" />
                                    Resend Code
                                </button>
                            )}
                        </div>

                        {/* Submit */}
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
                                    <>Verify Email <ArrowRight className="ml-2 h-4 w-4" /></>
                                )}
                            </Button>
                        </motion.div>
                    </form>
                </div>
            </motion.div>
        </div>
    )
}

export default VerifyOTP