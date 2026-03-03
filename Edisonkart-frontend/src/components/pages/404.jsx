import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Home, ArrowLeft, Search } from 'lucide-react'
import { Button } from '../ui/button'

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-16 px-4">
      {/* Decorative Orbs */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-[#1E3A8A]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-[#F97316]/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full text-center relative z-10"
      >
        {/* Animated 404 */}
        <div className="relative mb-8 inline-block">
          <motion.div
            animate={{
              scale: [1, 1.03, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="text-9xl font-black text-[#1E3A8A]/10 select-none"
          >
            404
          </motion.div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-bold text-foreground">404</span>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-3">Page Not Found</h1>
        <p className="text-lg text-muted-foreground mb-10 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Suggestions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 max-w-lg mx-auto">
          {[
            { icon: Search, title: 'Check the URL' },
            { icon: ArrowLeft, title: 'Go Back' },
            { icon: Home, title: 'Go Home' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="p-4 bg-card rounded-2xl border border-border/50"
            >
              <item.icon className="h-6 w-6 mx-auto mb-2 text-[#1E3A8A]" />
              <p className="font-medium text-sm">{item.title}</p>
            </motion.div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              size="lg"
              onClick={() => window.history.back()}
              className="rounded-xl bg-[#1E3A8A] hover:bg-[#15306B] gap-2 px-8 shadow-lg shadow-[#1E3A8A]/20"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
          </motion.div>
          <Link to="/">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                size="lg"
                variant="outline"
                className="rounded-xl gap-2 px-8"
              >
                <Home className="h-4 w-4" />
                Go to Homepage
              </Button>
            </motion.div>
          </Link>
        </div>

        {/* Popular Links */}
        <div className="mt-12">
          <p className="text-sm text-muted-foreground mb-4">Popular Categories</p>
          <div className="flex flex-wrap justify-center gap-2">
            {['Electronics', 'Fashion', 'Home', 'Books', 'Sports'].map((category) => (
              <Link
                key={category}
                to={`/products?category=${category.toLowerCase()}`}
                className="px-4 py-2 bg-muted text-sm text-muted-foreground rounded-full hover:bg-[#1E3A8A]/10 hover:text-[#1E3A8A] transition-colors"
              >
                {category}
              </Link>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default NotFound