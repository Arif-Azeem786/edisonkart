import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const TextReveal = ({ text, className = '', delay = 0, stagger = 0.05, as: Component = 'div', align = 'left' }) => {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-10%" }) // Adjusted slightly for better trigger
    const words = text.split(' ')

    return (
        <Component
            ref={ref}
            className={`${className} flex flex-wrap gap-x-[0.25em] gap-y-1 overflow-hidden ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'
                }`}
        >
            {words.map((word, i) => (
                <motion.span
                    key={i}
                    initial={{ y: '100%' }}
                    animate={isInView ? { y: 0 } : {}}
                    transition={{ duration: 0.5, delay: delay + i * stagger, ease: [0.33, 1, 0.68, 1] }}
                    className="inline-block"
                >
                    {word}
                </motion.span>
            ))}
        </Component>
    )
}

export default TextReveal
