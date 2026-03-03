import { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform, useSpring, useMotionTemplate, useMotionValue } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import ProductCard from '../product/ProductCard'
import CategoryNav from '../home/CategoryNav'
import { getProducts } from '../../services/product'
import { getProductImageUrl, NO_IMAGE_PLACEHOLDER } from '../ui/imageUtils'
import { useInView } from 'react-intersection-observer'
import { Link } from 'react-router-dom'
import { ArrowRight,
  Droplets,
  Feather,
  ShieldCheck,
  Package,
  Play,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Truck,
  Headphones,
  RotateCcw,
  Star,
  Zap,
  Timer,
  Tag,
} from 'lucide-react'

// ─── Unsplash images ───
const HERO_STUDIO = 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1920&q=80'
const HERO_LIFESTYLE = 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=1920&q=80'
const TEXTURE_IMG = 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=1920&q=80'

const LANDSCAPE_IMG = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1920&q=80'

// ─── Inline Animation Components ───

// Text Reveal with Mask Effect
const TextReveal = ({ text, className = '', delay = 0, stagger = 0.05, as: Component = 'div', align = 'left' }) => {
  const ref = useRef(null)
  const isInView = useInView({ triggerOnce: true, threshold: 0.1 })
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

// Parallax Image with Scale
const ParallaxImage = ({ src, alt, className = '', speed = 0.5 }) => {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], ['-15%', '15%'])
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

// Magnetic Button with Glow Effect
const MagneticButton = ({ children, className = '', strength = 30 }) => {
  const ref = useRef(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e
    const { left, top, width, height } = ref.current.getBoundingClientRect()
    const x = clientX - (left + width / 2)
    const y = clientY - (top + height / 2)
    setPosition({ x: x / strength, y: y / strength })
  }

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 })
  }

  const { x, y } = position

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x, y }}
      transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
      className={`inline-block ${className}`}
    >
      {children}
    </motion.div>
  )
}


const Home = () => {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll()

  // Hero crossfade
  const heroStudioOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0])
  const heroLifestyleOpacity = useTransform(scrollYProgress, [0.04, 0.15], [0, 1])
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 1.1])
  const heroTextY = useTransform(scrollYProgress, [0, 0.12], [0, -80])
  const heroTextOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0])

  // Scroll progress bar
  const progressScaleX = useTransform(scrollYProgress, [0, 1], [0, 1])

  // Section observers
  const [featureRef, featureInView] = useInView({ triggerOnce: true, threshold: 0.15 })
  const [trustRef, trustInView] = useInView({ triggerOnce: true, threshold: 0.15 })
  const [storyRef, storyInView] = useInView({ triggerOnce: true, threshold: 0.15 })
  const [gridRef, gridInView] = useInView({ triggerOnce: true, threshold: 0.1 })


  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
  } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => getProducts({ limit: 12, sort: 'createdAt', order: 'desc' }),
  })

  // ── Flash Sale ──
  const { data: flashSaleData } = useQuery({
    queryKey: ['products', 'flashSale'],
    queryFn: () => getProducts({ isFlashSale: 'true', limit: 20 }),
    staleTime: 60_000,
  })
  const flashProducts = flashSaleData?.products || []

  // ── Deal Banners: top discounted products ──
  const { data: dealBannerData } = useQuery({
    queryKey: ['products', 'dealBanners'],
    queryFn: () => getProducts({ limit: 8, sort: 'discountPrice', order: 'asc' }),
    staleTime: 120_000,
  })
  const dealProducts = (dealBannerData?.products || []).filter(
    p => p.discountPrice && p.discountPrice < p.price
  )

  const bannerColors = [
    { bg: 'from-[#1E3A8A] to-[#2563EB]', accent: '#F97316', badge: 'bg-[#F97316]' },
    { bg: 'from-[#7C3AED] to-[#6D28D9]', accent: '#FCD34D', badge: 'bg-yellow-400' },
    { bg: 'from-[#059669] to-[#047857]', accent: '#FDE68A', badge: 'bg-yellow-300' },
    { bg: 'from-[#DC2626] to-[#B91C1C]', accent: '#FCA5A5', badge: 'bg-red-200 text-red-900' },
    { bg: 'from-[#0F172A] to-[#1E293B]', accent: '#F97316', badge: 'bg-[#F97316]' },
  ]

  const [bannerIdx, setBannerIdx] = useState(0)
  useEffect(() => {
    if (dealProducts.length < 2) return
    const id = setInterval(() => setBannerIdx(i => (i + 1) % dealProducts.length), 4000)
    return () => clearInterval(id)
  }, [dealProducts.length])

  // Live countdown to earliest flash sale end time
  const [flashCountdown, setFlashCountdown] = useState('')
  useEffect(() => {
    if (!flashProducts.length) return
    const earliest = flashProducts
      .map(p => new Date(p.flashSaleEndTime))
      .filter(d => !isNaN(d))
      .sort((a, b) => a - b)[0]
    if (!earliest) return
    const tick = () => {
      const diff = earliest - Date.now()
      if (diff <= 0) { setFlashCountdown('EXPIRED'); return }
      const h = String(Math.floor(diff / 3600000)).padStart(2, '0')
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0')
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0')
      setFlashCountdown(`${h}:${m}:${s}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [flashProducts])

  // ─── Animation variants ───
  const fadeUp = {
    hidden: { opacity: 0, y: 50 },
    visible: (i = 0) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, delay: i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
  }

  const stagger = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  }

  const features = [
    { icon: Droplets, label: 'Weather-Ready', desc: 'Sealed seams & moisture-resistant coating' },
    { icon: Feather, label: 'Ultralight Build', desc: 'Ergonomic design for effortless daily carry' },
    { icon: ShieldCheck, label: 'Secure Storage', desc: 'Hidden compartments for your tech & valuables' },
  ]

  const trustBadges = [
    { icon: Truck, label: 'Free Shipping', desc: 'On orders above ₹999' },
    { icon: RotateCcw, label: 'Easy Returns', desc: '30-day return policy' },
    { icon: ShieldCheck, label: 'Secure Payment', desc: '100% protected checkout' },
    { icon: Headphones, label: '24/7 Support', desc: 'We\'re always here to help' },
  ]

  const scrollToNext = () => {
    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })
  }

  return (
    <div ref={containerRef} className="min-h-screen font-sans">
      {/* ─── SCROLL PROGRESS BAR ─── */}
      <motion.div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-[#1E3A8A] to-[#F97316] z-[9999] origin-left"
        style={{ scaleX: progressScaleX }}
      />

      {/* ══════════════════════════════════════════════
          SECTION 1 — HERO CANVAS
          ══════════════════════════════════════════════ */}
      <section className="relative h-screen min-h-[500px] sm:min-h-[600px] flex items-center overflow-hidden">
        {/* Studio shot */}
        <motion.div
          className="absolute inset-0 z-0"
          style={{ opacity: heroStudioOpacity, scale: heroScale }}
        >
          <img
            src={HERO_STUDIO}
            alt="Studio backpack"
            className="w-full h-full object-cover"
            loading="eager"
          />
        </motion.div>

        {/* Lifestyle shot (crossfades in) */}
        <motion.div
          className="absolute inset-0 z-0"
          style={{ opacity: heroLifestyleOpacity, scale: heroScale }}
        >
          <img
            src={HERO_LIFESTYLE}
            alt="Adventure lifestyle"
            className="w-full h-full object-cover"
          />
        </motion.div>

        {/* Dark overlay with blue tint */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1E3A8A]/70 via-black/40 to-black/30 z-0 pointer-events-none" />

        {/* Hero content */}
        <motion.div
          className="relative z-10 w-full max-w-7xl mx-auto px-6"
          style={{ y: heroTextY, opacity: heroTextOpacity }}
        >
          <div className="max-w-4xl">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
              className="mb-8"
            >
              <p className="inline-block px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[#F97316] text-xs font-bold uppercase tracking-[0.2em]">
                Premium E-Commerce
              </p>
            </motion.div>

            <TextReveal
              as="h1"
              text="EDISONKART"
              align="left"
              className="font-syne text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-bold text-white leading-[0.9] tracking-tight mb-6 sm:mb-8"
              stagger={0.08}
              delay={0.2}
            />

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={2}
              className="text-base sm:text-lg md:text-2xl text-white/90 max-w-xl mb-8 sm:mb-12 font-light leading-relaxed"
            >
              Curated essentials for the modern lifestyle. Technical gear designed for wherever you're headed.
            </motion.p>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={3}
              className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center"
            >
              <Link to="/products" className="w-full sm:w-auto">
                <MagneticButton strength={40} className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full h-12 sm:h-14 px-8 sm:px-10 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-full text-base sm:text-lg font-medium shadow-xl shadow-[#F97316]/30 transition-transform active:scale-95"
                  >
                    Shop Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </MagneticButton>
              </Link>
              <Link to="/about" className="w-full sm:w-auto">
                <MagneticButton strength={20} className="w-full sm:w-auto">
                  <button className="w-full h-12 sm:h-14 px-4 sm:px-8 flex items-center justify-center sm:justify-start gap-3 text-white hover:text-[#F97316] transition-colors group">
                    <span className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center border border-white/20 group-hover:bg-white/25 transition-all">
                      <Play className="h-4 w-4 fill-current ml-0.5" />
                    </span>
                    <span className="text-lg font-medium underline underline-offset-4 decoration-white/40 group-hover:decoration-[#F97316]/60">Our Story</span>
                  </button>
                </MagneticButton>
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.button
          onClick={scrollToNext}
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 text-white/60 hover:text-white transition-colors"
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest">Scroll</span>
            <ChevronDown className="h-5 w-5" />
          </div>
        </motion.button>
      </section>

      {/* ══════════════════════════════════════════════
          SECTION 1.5 — TRUST BADGES BAR
          ══════════════════════════════════════════════ */}
      <section ref={trustRef} className="relative py-6 sm:py-8 bg-[#1E3A8A] overflow-hidden">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate={trustInView ? 'visible' : 'hidden'}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6"
          >
            {trustBadges.map((badge, i) => (
              <motion.div
                key={badge.label}
                variants={fadeUp}
                custom={i}
                className="flex items-center gap-4 justify-center md:justify-start"
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#F97316] shrink-0">
                  <badge.icon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm">{badge.label}</h4>
                  <p className="text-white/60 text-xs">{badge.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── CATEGORY NAVIGATION (Flipkart Style) ─── */}
      <CategoryNav />

      {/* ══════════════════════════════════════════════
          DEAL BANNERS — top discounted products
          ══════════════════════════════════════════════ */}
      {dealProducts.length > 0 && (
        <section className="py-5 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            {/* Section header */}
            <div className="flex items-center gap-2 mb-4">
              <Tag className="h-4 w-4 text-[#F97316]" />
              <h2 className="text-base font-bold text-slate-800 uppercase tracking-wider">Today's Best Deals</h2>
              <div className="flex-1 h-px bg-slate-200 ml-2" />
              <Link to="/products?sort=discountPrice&order=asc" className="text-xs text-[#1E3A8A] font-semibold hover:underline flex items-center gap-1">
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Banner slider */}
            <div className="relative rounded-2xl overflow-hidden group/banner select-none h-48 sm:h-56">

              {dealProducts.map((product, idx) => {
                const color = bannerColors[idx % bannerColors.length]
                const discountPct = Math.round(((product.price - product.discountPrice) / product.price) * 100)
                const firstImg = product.imageIds?.[0]
                  ? getProductImageUrl(product.imageIds[0])
                  : null

                return (
                  <div
                    key={product._id}
                    className={`absolute inset-0 bg-gradient-to-r ${color.bg} transition-opacity duration-700 ${
                      idx === bannerIdx ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
                  >
                    <Link to={`/products/${product.slug || product._id}`} className="flex h-full w-full items-center">
                      {/* Left: text content */}
                      <div className="flex-1 px-6 sm:px-10 py-6 z-10">
                        <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md mb-3 ${color.badge} text-white`}>
                          -{discountPct}% OFF
                        </span>
                        <h3 className="text-white font-bold text-lg sm:text-2xl leading-snug max-w-xs line-clamp-2 mb-2">
                          {product.name}
                        </h3>
                        <div className="flex items-baseline gap-2 mb-4">
                          <span className="text-white font-black text-2xl sm:text-3xl">
                            ₹{product.discountPrice.toLocaleString()}
                          </span>
                          <span className="text-white/50 line-through text-sm">
                            ₹{product.price.toLocaleString()}
                          </span>
                        </div>
                        <span
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold text-white border border-white/30 hover:bg-white/20 transition-colors"
                          style={{ color: color.accent }}
                        >
                          Shop Now <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>

                      {/* Right: product image */}
                      <div className="w-[200px] sm:w-[280px] h-full relative flex-shrink-0 flex items-center justify-end pr-6 overflow-hidden">
                        {firstImg ? (
                          <img
                            src={firstImg}
                            alt={product.name}
                            className="h-[90%] max-h-[200px] w-auto object-contain drop-shadow-2xl"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-36 h-36 rounded-2xl bg-white/10 flex items-center justify-center">
                            <Package className="h-12 w-12 text-white/30" />
                          </div>
                        )}
                        {/* Glow behind image */}
                        <div className="absolute inset-0 bg-white/5 blur-3xl" />
                      </div>
                    </Link>
                  </div>
                )
              })}

              {/* Left arrow */}
              <button
                onClick={() => setBannerIdx(i => (i - 1 + dealProducts.length) % dealProducts.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center opacity-0 group-hover/banner:opacity-100 transition-opacity"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Right arrow */}
              <button
                onClick={() => setBannerIdx(i => (i + 1) % dealProducts.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center opacity-0 group-hover/banner:opacity-100 transition-opacity"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              {/* Dot indicators */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                {dealProducts.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setBannerIdx(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === bannerIdx ? 'w-5 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>

            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════
          FLASH SALE SECTION
          ══════════════════════════════════════════════ */}
      {flashProducts.length > 0 && flashCountdown !== 'EXPIRED' && (
        <section className="bg-gradient-to-r from-[#1E3A8A] via-[#1a3275] to-[#0f1f4a] py-10 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            {/* Header row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#F97316] shadow-lg shadow-[#F97316]/30">
                  <Zap className="h-5 w-5 text-white fill-white" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-xl sm:text-2xl leading-tight">Flash Sale</h2>
                  <p className="text-white/60 text-xs">Limited time — grab it before it's gone!</p>
                </div>
              </div>
              {/* Countdown timer */}
              {flashCountdown && (
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-2.5">
                  <Timer className="h-4 w-4 text-[#F97316]" />
                  <span className="text-white/70 text-xs font-medium">Ends in</span>
                  <div className="flex items-center gap-1">
                    {flashCountdown.split(':').map((unit, i) => (
                      <span key={i} className="flex items-center gap-1">
                        <span className="bg-white/20 text-white text-sm font-bold rounded-lg px-2 py-1 min-w-[2rem] text-center tabular-nums">
                          {unit}
                        </span>
                        {i < 2 && <span className="text-white/50 font-bold text-sm">:</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Horizontal scroll strip */}
            <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {flashProducts.map((product) => (
                <div key={product._id} className="flex-shrink-0 w-[180px] sm:w-[210px]">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <Link to="/products?isFlashSale=true">
                <Button variant="outline" className="rounded-full border-white/30 text-white hover:bg-white/10 hover:text-white">
                  View All Flash Deals <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      <section ref={featureRef} className="relative py-16 sm:py-28 bg-gradient-to-b from-slate-50 to-white overflow-hidden">
        {/* Subtle decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#1E3A8A]/[0.03] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#F97316]/[0.03] rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left side — features */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate={featureInView ? 'visible' : 'hidden'}
          >
            <motion.div variants={fadeUp} className="flex items-center gap-4 mb-6">
              <div className="h-[2px] w-12 bg-[#F97316]" />
              <p className="text-[#F97316] text-sm font-bold uppercase tracking-wider">
                Signature Collection
              </p>
            </motion.div>

            <TextReveal
              as="h2"
              text="Durable. Versatile. Essential."
              align="left"
              className="font-syne text-3xl sm:text-5xl md:text-6xl font-bold text-[#1E3A8A] mb-6 sm:mb-8 leading-tight"
              stagger={0.06}
            />

            <motion.p variants={fadeUp} className="text-slate-600 text-lg sm:text-xl mb-8 sm:mb-12 max-w-lg leading-relaxed">
              EdisonKart brings you products that blend function with style. Our signature collection is built to withstand your daily adventures.
            </motion.p>

            <div className="space-y-6 mb-12">
              {features.map((f, i) => (
                <motion.div
                  key={f.label}
                  variants={fadeUp}
                  custom={i + 3}
                  className="flex gap-6 group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#1E3A8A]/5 flex items-center justify-center text-[#F97316] shrink-0 border border-[#1E3A8A]/10 group-hover:bg-[#1E3A8A]/10 group-hover:scale-105 transition-all duration-300">
                    <f.icon className="h-7 w-7" />
                  </div>
                  <div>
                    <h4 className="text-[#1E3A8A] font-bold text-xl mb-1 group-hover:text-[#F97316] transition-colors">{f.label}</h4>
                    <p className="text-slate-500 leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div variants={fadeUp} custom={6}>
              <Link to="/products">
                <MagneticButton>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-14 px-10 rounded-full border-2 border-[#1E3A8A] text-[#1E3A8A] bg-transparent hover:bg-[#1E3A8A] hover:text-white transition-all text-lg font-medium"
                  >
                    View Details
                  </Button>
                </MagneticButton>
              </Link>
            </motion.div>
          </motion.div>

          {/* Right side — image with parallax */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate={featureInView ? 'visible' : 'hidden'}
            custom={2}
            className="hidden lg:block"
          >
            <div className="relative">
              <ParallaxImage
                src={TEXTURE_IMG}
                alt="Fabric texture"
                className="w-full h-[600px] rounded-3xl shadow-2xl shadow-[#1E3A8A]/10"
                speed={0.2}
              />
              {/* Accent corner decoration */}
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-[#F97316]/10 rounded-3xl -z-10" />
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-[#1E3A8A]/5 rounded-3xl -z-10" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SECTION 4 — BRAND STORY
          ══════════════════════════════════════════════ */}
      <section ref={storyRef} className="relative py-16 sm:py-28 bg-white overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1E3A8A08_1px,transparent_1px),linear-gradient(to_bottom,#1E3A8A08_1px,transparent_1px)] bg-[size:64px_64px]" />
        </div>

        <motion.div
          className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6"
          variants={stagger}
          initial="hidden"
          animate={storyInView ? 'visible' : 'hidden'}
        >
          <div className="max-w-4xl mx-auto text-center mb-16">
            <motion.p variants={fadeUp} className="text-[#F97316] text-sm font-bold uppercase tracking-wider mb-6">
              About EdisonKart
            </motion.p>

            <TextReveal
              as="h2"
              text="Quality first. Customer always."
              align="center"
              className="font-syne text-3xl sm:text-5xl md:text-7xl font-bold text-[#1E3A8A] mb-8 sm:mb-10 leading-tight"
              stagger={0.06}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
            <motion.div variants={fadeUp} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-lg shadow-slate-100/80 hover:shadow-xl hover:shadow-[#1E3A8A]/5 hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-[#1E3A8A]/5 flex items-center justify-center text-[#F97316] mb-6">
                <Star className="h-6 w-6" />
              </div>
              <h3 className="text-[#1E3A8A] font-bold text-2xl mb-4">Curated Excellence</h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                We select only the best products for our catalog. Rigorous quality checks ensure you get exactly what you expect, every time.
              </p>
            </motion.div>
            <motion.div variants={fadeUp} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-lg shadow-slate-100/80 hover:shadow-xl hover:shadow-[#1E3A8A]/5 hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-[#1E3A8A]/5 flex items-center justify-center text-[#F97316] mb-6">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-[#1E3A8A] font-bold text-2xl mb-4">Customer Commitment</h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                Your satisfaction is our priority. With 24/7 support and easy returns, we make your shopping experience seamless and secure.
              </p>
            </motion.div>
          </div>

          <motion.div variants={fadeUp} className="text-center">
            <Link to="/about">
              <MagneticButton>
                <Button
                  size="lg"
                  variant="link"
                  className="text-[#1E3A8A] text-lg hover:text-[#F97316] p-0 underline-offset-8 decoration-[#1E3A8A]/30 hover:decoration-[#F97316] transition-all"
                >
                  More About Us <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </MagneticButton>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════
          SECTION 5 — BESTSELLERS GRID
          ══════════════════════════════════════════════ */}
      <section
        ref={gridRef}
        className="py-16 sm:py-28 bg-slate-50"
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate={gridInView ? 'visible' : 'hidden'}
            className="mb-16 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6"
          >
            <div>
              <motion.p variants={fadeUp} className="text-[#F97316] text-sm font-bold uppercase tracking-wider mb-4">
                Top Picks
              </motion.p>
              <TextReveal
                as="h2"
                text="Bestsellers"
                align="left"
                className="font-syne text-3xl sm:text-5xl md:text-6xl font-bold text-[#1E3A8A]"
                stagger={0.06}
              />
            </div>

            <motion.div variants={fadeUp}>
              <Link to="/products">
                <MagneticButton>
                  <Button
                    size="lg"
                    className="h-14 px-10 rounded-full bg-[#1E3A8A] text-white hover:bg-[#1E3A8A]/90 transition-all text-lg font-medium shadow-lg shadow-[#1E3A8A]/15"
                  >
                    View All Products
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </MagneticButton>
              </Link>
            </motion.div>
          </motion.div>

          {productsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                  <div className="aspect-square bg-slate-100 animate-pulse" />
                  <div className="p-6 space-y-4">
                    <div className="h-6 bg-slate-100 rounded-lg w-3/4 animate-pulse" />
                    <div className="h-4 bg-slate-100 rounded-lg w-1/2 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : productsError ? (
            <div className="text-center py-24 bg-white rounded-3xl border border-slate-200 shadow-sm">
              <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">Unable to load products at this time.</p>
            </div>
          ) : (
            <motion.div
              variants={stagger}
              initial="hidden"
              animate={gridInView ? 'visible' : 'hidden'}
              className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
            >
              {productsData?.products?.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </motion.div>
          )}
        </div>
      </section>


    </div>
  )
}

export default Home