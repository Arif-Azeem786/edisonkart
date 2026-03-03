import { motion } from 'framer-motion'
import PremiumLoader from './PremiumLoader'

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <PremiumLoader size="large" text="Opening your store..." />
    </div>
  )
}

export default LoadingScreen