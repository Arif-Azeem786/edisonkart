import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

const ParallaxImage = ({ src, alt, className = '', speed = 0.5 }) => {
    const ref = useRef(null)
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start end', 'end start'],
    })

    // Adjust parallax intensity based on speed prop
    const y = useTransform(scrollYProgress, [0, 1], [`-${speed * 20}%`, `${speed * 20}%`])
    const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.05, 1])

    return (
        <div ref={ref} className={`overflow-hidden relative ${className}`}>
            <motion.img
                src={src}
                alt={alt}
                style={{ y, scale }}
                className="w-full h-full object-cover absolute inset-0"
            />
        </div>
    )
}

export default ParallaxImage
