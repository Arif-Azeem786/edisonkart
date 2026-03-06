import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const AuthLayout = ({ children, title, subtitle }) => {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30 px-4 pt-24 pb-8">
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="w-full max-w-[900px] bg-white rounded-2xl shadow-[0_20px_60px_rgba(30,58,138,0.08),0_1px_3px_rgba(30,58,138,0.04)] overflow-hidden flex flex-col md:flex-row"
            >
                {/* ─── Left Blue Panel ─── */}
                <div className="md:w-[42%] bg-gradient-to-br from-[#1E3A8A] via-[#1a3278] to-[#15296a] p-8 md:p-10 flex flex-col justify-between relative overflow-hidden min-h-[200px] md:min-h-[560px]">
                    {/* Grid pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:32px_32px]" />

                    {/* Glow effects */}
                    <div className="absolute top-[-20%] right-[-30%] w-[300px] h-[300px] bg-[#F97316]/15 rounded-full blur-[80px]" />
                    <div className="absolute bottom-[-10%] left-[-20%] w-[250px] h-[250px] bg-white/5 rounded-full blur-[60px]" />

                    {/* Content */}
                    <div className="relative z-10 space-y-4">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="flex items-center gap-2.5 mb-2"
                        >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F97316] to-[#EA580C] flex items-center justify-center shadow-lg shadow-[#F97316]/25">
                                <span className="text-white font-black text-lg">E</span>
                            </div>
                            <span className="text-2xl font-black tracking-tight text-white">
                                Edison<span className="text-[#F97316]">Kart</span>
                            </span>
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-2xl md:text-[28px] font-bold text-white leading-tight"
                        >
                            {title}
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-blue-200/70 text-sm leading-relaxed max-w-[260px]"
                        >
                            {subtitle}
                        </motion.p>
                    </div>

                    {/* SVG Illustration */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="hidden md:flex items-center justify-center relative z-10 mt-auto pt-6"
                    >
                        <svg viewBox="0 0 280 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[240px]">
                            {/* Laptop body */}
                            <rect x="50" y="40" width="160" height="110" rx="8" fill="white" fillOpacity="0.12" stroke="white" strokeOpacity="0.2" strokeWidth="1.5" />
                            {/* Screen content - product grid */}
                            <rect x="62" y="52" width="55" height="38" rx="4" fill="white" fillOpacity="0.08" />
                            <rect x="123" y="52" width="55" height="38" rx="4" fill="white" fillOpacity="0.08" />
                            <rect x="62" y="96" width="55" height="38" rx="4" fill="white" fillOpacity="0.08" />
                            <rect x="123" y="96" width="55" height="38" rx="4" fill="#F97316" fillOpacity="0.3" />
                            {/* Screen icons */}
                            <circle cx="89" cy="67" r="8" fill="white" fillOpacity="0.15" />
                            <circle cx="150" cy="67" r="8" fill="white" fillOpacity="0.15" />
                            <rect x="75" y="79" width="28" height="3" rx="1.5" fill="white" fillOpacity="0.15" />
                            <rect x="136" y="79" width="28" height="3" rx="1.5" fill="white" fillOpacity="0.15" />
                            {/* Laptop base */}
                            <path d="M30 150 L50 150 L50 148 C50 146 52 144 54 144 L206 144 C208 144 210 146 210 148 L210 150 L230 150 C232 150 233 152 232 154 L228 162 C227 164 225 165 223 165 L37 165 C35 165 33 164 32 162 L28 154 C27 152 28 150 30 150Z" fill="white" fillOpacity="0.1" stroke="white" strokeOpacity="0.15" strokeWidth="1" />
                            {/* Shopping bag - left */}
                            <rect x="8" y="80" width="32" height="38" rx="4" fill="#F97316" fillOpacity="0.8" />
                            <path d="M16 80 L16 74 C16 68 20 64 24 64 C28 64 32 68 32 74 L32 80" stroke="white" strokeOpacity="0.6" strokeWidth="2" fill="none" strokeLinecap="round" />
                            <circle cx="24" cy="96" r="5" fill="white" fillOpacity="0.3" />
                            {/* Cart icon - right */}
                            <rect x="222" y="60" width="40" height="35" rx="6" fill="white" fillOpacity="0.1" stroke="white" strokeOpacity="0.15" strokeWidth="1" />
                            <circle cx="233" cy="88" r="3" fill="#F97316" fillOpacity="0.7" />
                            <circle cx="251" cy="88" r="3" fill="#F97316" fillOpacity="0.7" />
                            <path d="M229 68 L233 68 L237 80 L255 80 L258 70 L239 70" stroke="white" strokeOpacity="0.4" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            {/* Floating stars */}
                            <circle cx="20" cy="45" r="3" fill="#F97316" fillOpacity="0.6" />
                            <circle cx="255" cy="40" r="2" fill="white" fillOpacity="0.3" />
                            <circle cx="245" cy="110" r="2.5" fill="#F97316" fillOpacity="0.4" />
                            {/* Checkmark badge */}
                            <circle cx="202" cy="30" r="12" fill="#F97316" fillOpacity="0.7" />
                            <path d="M196 30 L200 34 L208 26" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            {/* Notification dots */}
                            <circle cx="48" cy="35" r="4" fill="white" fillOpacity="0.15" />
                            <circle cx="48" cy="35" r="2" fill="#F97316" fillOpacity="0.6" />
                        </svg>
                    </motion.div>

                    {/* Bottom accent line */}
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#F97316]/40 to-transparent" />
                </div>

                {/* ─── Right Form Panel ─── */}
                <div className="md:w-[58%] p-8 md:p-10 lg:p-12 flex flex-col">
                    {/* Mobile Logo */}
                    <div className="md:hidden flex justify-center mb-6">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#F97316] to-[#EA580C] flex items-center justify-center shadow-md">
                                <span className="text-white font-black text-base">E</span>
                            </div>
                            <span className="text-xl font-black tracking-tight text-[#1E3A8A]">
                                Edison<span className="text-[#F97316]">Kart</span>
                            </span>
                        </Link>
                    </div>

                    {/* Form content */}
                    <div className="flex-1 flex flex-col justify-center">
                        {children}
                    </div>

                    {/* Footer */}
                    <div className="text-center mt-6 pt-4 border-t border-slate-100">
                        <p className="text-[11px] text-slate-400">
                            © 2026 EdisonKart •{' '}
                            <Link to="/privacy" className="hover:text-[#1E3A8A] transition-colors">Privacy</Link>
                            {' • '}
                            <Link to="/terms" className="hover:text-[#1E3A8A] transition-colors">Terms</Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

export default AuthLayout
