import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import {
  Instagram,
  Twitter,
  Youtube,
  Facebook,
  Mail,
  ArrowRight,
  CreditCard,
  ShieldCheck,
  Truck
} from 'lucide-react'
import { Button } from '../ui/button'
import MagneticButton from '../ui/MagneticButton'

const Footer = () => {
  const [footerRef, footerInView] = useInView({ triggerOnce: true, threshold: 0.1 })
  const [email, setEmail] = useState('')

  const handleSubscribe = (e) => {
    e.preventDefault()
    setEmail('')
  }

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i = 0) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
    }),
  }

  const footerLinks = {
    shop: [
      { name: 'New Arrivals', path: '/products?sort=newest' },
      { name: 'Best Sellers', path: '/products?sort=rating' },
      { name: 'Gaming Laptops', path: '/products?category=gaming' },
      { name: 'Ultrabooks', path: '/products?category=ultrabook' },
      { name: 'Accessories', path: '/products?category=accessories' },
    ],
    company: [
      { name: 'About Us', path: '/about' },
      { name: 'Careers', path: '#' },
      { name: 'Sustainability', path: '#' },
      { name: 'Press & Media', path: '#' },
      { name: 'Terms of Service', path: '/terms' },
    ],
    support: [
      { name: 'Contact Us', path: '/contact' },
      { name: 'FAQs', path: '/contact' },
      { name: 'Shipping & Returns', path: '#' },
      { name: 'Order History', path: '/orders' },
      { name: 'Privacy Policy', path: '/privacy' },
    ]
  }

  return (
    <footer
      ref={footerRef}
      className="bg-[#1E3A8A] text-white border-t border-[#1E3A8A] relative overflow-hidden"
    >
      {/* Background decorative elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/[0.03] rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#F97316]/[0.05] rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-8 sm:pb-10 relative z-10">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 sm:gap-12 mb-12 sm:mb-20">

          {/* Brand Column */}
          <motion.div
            variants={fadeUp}
            custom={1}
            initial="hidden"
            animate={footerInView ? 'visible' : 'hidden'}
            className="sm:col-span-2 lg:col-span-4"
          >
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#F97316] to-[#EA580C] flex items-center justify-center shadow-lg shadow-[#F97316]/20">
                <span className="text-white font-black text-lg sm:text-xl">E</span>
              </div>
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Edison<span className="text-[#F97316]">Kart</span>
              </span>
            </Link>
            <p className="text-white/70 leading-relaxed mb-8 max-w-sm text-sm sm:text-base">
              Your premium destination for high-end electronics and gadgets. We deliver quality, speed, and exceptional service nationwide.
            </p>

            <div className="flex gap-4">
              {[Instagram, Twitter, Facebook, Youtube].map((Icon, i) => (
                <MagneticButton key={i} strength={10}>
                  <a href="#" className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white/70 hover:text-white hover:bg-[#F97316] hover:border-[#F97316] transition-all">
                    <Icon className="h-4 w-4" />
                  </a>
                </MagneticButton>
              ))}
            </div>
          </motion.div>

          {/* Links Columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:col-span-6 gap-8">
            <motion.div
              variants={fadeUp}
              custom={2}
              initial="hidden"
              animate={footerInView ? 'visible' : 'hidden'}
            >
              <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-xs">Shop</h4>
              <ul className="space-y-3">
                {footerLinks.shop.map((link) => (
                  <li key={link.name}>
                    <Link to={link.path} className="text-white/60 hover:text-[#F97316] transition-colors text-sm">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              variants={fadeUp}
              custom={3}
              initial="hidden"
              animate={footerInView ? 'visible' : 'hidden'}
            >
              <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-xs">Company</h4>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <Link to={link.path} className="text-white/60 hover:text-[#F97316] transition-colors text-sm">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              variants={fadeUp}
              custom={4}
              initial="hidden"
              animate={footerInView ? 'visible' : 'hidden'}
            >
              <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-xs">Support</h4>
              <ul className="space-y-3">
                {footerLinks.support.map((link) => (
                  <li key={link.name}>
                    <Link to={link.path} className="text-white/60 hover:text-[#F97316] transition-colors text-sm">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Contact / Newsletter Column */}
          <motion.div
            variants={fadeUp}
            custom={5}
            initial="hidden"
            animate={footerInView ? 'visible' : 'hidden'}
            className="sm:col-span-2 lg:col-span-2"
          >
            <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-xs">Newsletter</h4>
            <div className="space-y-4">
              <p className="text-white/60 text-xs leading-relaxed">
                Stay updated with latest releases and exclusive offers.
              </p>
              <form onSubmit={handleSubscribe} className="relative group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  className="w-full bg-white/10 border border-white/20 rounded-xl py-3 px-4 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#F97316] transition-all"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#F97316] rounded-lg text-white hover:bg-[#EA580C] transition-colors">
                  <ArrowRight className="h-3 w-3" />
                </button>
              </form>
              <div className="pt-2 flex flex-col gap-3">
                <div className="flex items-center gap-3 text-white/60 text-xs">
                  <Mail className="h-4 w-4 text-[#F97316]" />
                  <a href="mailto:support@edisonkart.com" className="hover:text-white transition-colors">support@edisonkart.com</a>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#10B981]/15 rounded-full border border-[#10B981]/25 w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  <span className="text-[#10B981] text-[10px] font-bold">Systems Operational</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          variants={fadeUp}
          custom={6}
          initial="hidden"
          animate={footerInView ? 'visible' : 'hidden'}
          className="pt-6 sm:pt-8 border-t border-white/[0.12] flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#F97316] to-[#EA580C] flex items-center justify-center">
              <span className="text-white font-black text-xs">E</span>
            </div>
            <p className="text-white/50 text-sm">
              © 2026 <span className="text-white/70 font-semibold">EdisonKart</span>. All rights reserved.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-all duration-300">
              <CreditCard className="h-6 w-6" />
              <ShieldCheck className="h-6 w-6" />
              <Truck className="h-6 w-6" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Large Typography Decoration */}
      <div className="absolute -bottom-4 left-0 right-0 text-center pointer-events-none select-none opacity-[0.04] overflow-hidden hidden sm:block">
        <span className="text-[12vw] lg:text-[15vw] font-black leading-none text-white whitespace-nowrap">EDISONKART</span>
      </div>
    </footer>
  )
}

export default Footer