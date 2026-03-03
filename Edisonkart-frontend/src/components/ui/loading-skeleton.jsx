import { motion } from 'framer-motion'

const LoadingSkeleton = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.05 }}
          className="bg-card rounded-2xl overflow-hidden border border-border/50"
        >
          <div className="aspect-square skeleton-shine" />
          <div className="p-4 space-y-3">
            <div className="h-3 skeleton-shine rounded-lg w-1/4" />
            <div className="h-4 skeleton-shine rounded-lg w-3/4" />
            <div className="h-4 skeleton-shine rounded-lg w-1/2" />
            <div className="h-10 skeleton-shine rounded-xl mt-2" />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export default LoadingSkeleton