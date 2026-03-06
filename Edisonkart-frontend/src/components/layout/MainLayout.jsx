import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import MobileBottomNav from './MobileBottomNav'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import ScrollToTop from '../ui/ScrollToTop'
import CompareBar from '../product/CompareBar'
import ChatWidget from '../chat/ChatWidget'
import { useState } from 'react'

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1]
    }
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.3,
      ease: "easeIn"
    }
  },
}

const MainLayout = () => {
  const location = useLocation()
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ScrollToTop />
      <Navbar cartDrawerOpen={cartDrawerOpen} setCartDrawerOpen={setCartDrawerOpen} />
      <main className="flex-1 flex flex-col relative pb-16 md:pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="enter"
            exit="exit"
            className="flex-1 w-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <CompareBar />
      <ChatWidget />
      {/* Mobile bottom navigation bar */}
      <MobileBottomNav onCartOpen={() => setCartDrawerOpen(true)} />
    </div>
  )
}

export default MainLayout
