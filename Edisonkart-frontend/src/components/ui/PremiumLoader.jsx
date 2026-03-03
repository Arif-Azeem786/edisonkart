import { motion } from 'framer-motion'

const PremiumLoader = ({ size = 'default', text = 'Loading...' }) => {
    const isSmall = size === 'small'
    
    // Container size based on prop
    const containerSize = isSmall ? 'w-12 h-12' : 'w-24 h-24'
    const bagSize = isSmall ? 24 : 48
    
    return (
        <div className="flex flex-col items-center justify-center p-4">
            <div className={`relative ${containerSize} flex items-center justify-center`}>
                {/* Floating Shopping Bag Animation */}
                <motion.div
                    initial={{ y: 0 }}
                    animate={{ y: [-5, 5, -5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="relative z-10"
                >
                    <svg 
                        width={bagSize} 
                        height={bagSize} 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="1.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        className="text-[#1E3A8A] dark:text-blue-400"
                    >
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>

                    {/* Glowing effect behind bag */}
                    <motion.div
                        className="absolute inset-0 bg-[#F97316]/20 blur-xl rounded-full"
                        animate={{ 
                            opacity: [0.5, 0.8, 0.5],
                            scale: [1, 1.2, 1]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                </motion.div>

                {/* Circular Progress Ring */}
                {!isSmall && (
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <motion.circle
                            cx="50"
                            cy="50"
                            r="48"
                            fill="none"
                            stroke="currentColor"
                            className="text-slate-200 dark:text-slate-800"
                            strokeWidth="2"
                        />
                        <motion.circle
                            cx="50"
                            cy="50"
                            r="48"
                            fill="none"
                            stroke="#F97316" // Orange accent
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeDasharray="301.59" // Circumference of radius 48
                            strokeDashoffset="301.59"
                            animate={{ strokeDashoffset: [301.59, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        />
                    </svg>
                )}
            </div>

            {/* Optional Loading Text */}
            {text && !isSmall && (
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400 tracking-wider uppercase"
                >
                    {text}
                </motion.p>
            )}
        </div>
    )
}

export default PremiumLoader
