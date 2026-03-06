import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import useAuthStore from '../../store/authStore'
import AuthLayout from '../ui/AuthLayout'
import { validateEmail, validatePassword } from '../../utils/validation'
import { useToast } from '../ui/use-toast'
import { googleLogin } from '../../services/auth'

const Login = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const navigate = useNavigate()
    const location = useLocation()
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

    const handleGoogleCredentialResponse = async (response) => {
        try {
            const result = await googleLogin(response.credential)
            const data = result?.data || result
            if (data?.token) {
                login({ token: data.token, user: data.user })
                toast({ title: "Welcome!", description: `Logged in as ${data.user?.name || 'User'}` })
                navigate(data.user?.role === 'ADMIN' ? '/admin' : '/')
            }
        } catch (err) {
            toast({ title: "Google Login Failed", description: err?.message || "Please try again", variant: "destructive" })
        }
    }

    const handleGoogleLogin = async () => {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
        if (!clientId) {
            toast({ title: "Google Sign-In not configured", variant: "destructive" })
            return
        }

        const launchPopup = () => {
            const client = window.google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: 'email profile openid',
                callback: async (tokenResponse) => {
                    if (tokenResponse?.access_token) {
                        try {
                            const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                                headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                            }).then(r => r.json())
                            const result = await googleLogin(null, tokenResponse.access_token, userInfo)
                            const data = result?.data || result
                            if (data?.token) {
                                login({ token: data.token, user: data.user })
                                navigate(data.user?.role === 'ADMIN' ? '/admin' : '/')
                            }
                        } catch (err) {
                            toast({ title: "Google Login Failed", description: err?.message || "Please try again", variant: "destructive" })
                        }
                    }
                },
            })
            client.requestAccessToken()
        }

        if (!window.google?.accounts?.oauth2) {
            const script = document.createElement('script')
            script.src = 'https://accounts.google.com/gsi/client'
            script.async = true
            script.onload = launchPopup
            document.body.appendChild(script)
        } else {
            launchPopup()
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

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
                    <div className="relative flex justify-center text-xs"><span className="bg-card px-3 text-muted-foreground uppercase tracking-wider">or continue with</span></div>
                </div>

                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-border hover:border-primary/30 rounded-xl bg-card hover:bg-muted/50 transition-all text-sm font-medium text-foreground"
                >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign in with Google
                </button>

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