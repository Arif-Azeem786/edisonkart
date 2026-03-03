import { useEffect, useRef, useState } from 'react'
import { animate, useInView } from 'framer-motion'

const CountUp = ({ value, suffix = '', prefix = '', className = '' }) => {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })
    const [displayValue, setDisplayValue] = useState(0)

    useEffect(() => {
        if (isInView) {
            const controls = animate(0, value, {
                duration: 2.5,
                ease: "easeOut", // Use a smooth easing function
                onUpdate: (latest) => {
                    setDisplayValue(Math.floor(latest))
                }
            })
            return () => controls.stop()
        }
    }, [isInView, value])

    return (
        <span ref={ref} className={className}>
            {prefix}{displayValue.toLocaleString()}{suffix}
        </span>
    )
}

export default CountUp
