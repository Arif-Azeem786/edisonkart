import { useRef } from 'react'
import { motion } from 'framer-motion'
import { Award, Users, Shield, Heart, Globe, ArrowRight, Package } from 'lucide-react'
import { Button } from '../ui/button'
import CountUp from '../ui/CountUp'
import { Link } from 'react-router-dom'

const About = () => {
    const fadeUp = {
        hidden: { opacity: 0, y: 40 },
        visible: (i = 0) => ({
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] },
        }),
    }

    const stats = [
        { value: 50, suffix: 'K+', label: 'Happy Customers' },
        { value: 100, suffix: '+', label: 'Premium Brands' },
        { value: 25, suffix: 'K+', label: 'Curated Products' },
        { value: 50, suffix: '+', label: 'Cities Served' },
    ]

    const values = [
        { icon: Heart, title: 'Customer First', description: 'Every decision we make starts with you. We are obsessed with delivering joy.' },
        { icon: Award, title: 'Uncompromised Quality', description: 'We handpick every item. If it\'s not the best, it doesn\'t make the cut.' },
        { icon: Shield, title: 'Absolute Trust', description: 'Transparent sourcing, secure payments, and a promise of authenticity.' },
        { icon: Globe, title: 'Sustainable Future', description: 'We are committed to reducing our footprint with eco-friendly packaging.' },
    ]

    return (
        <div className="min-h-screen bg-white">

            {/* ═══ HERO ═══ */}
            <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80"
                        alt="Office ambiance"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#1E3A8A]/80 via-[#1E3A8A]/60 to-white" />
                </div>

                <div className="relative z-10 w-full max-w-5xl mx-auto px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <p className="text-[#F97316] text-sm font-bold uppercase tracking-[0.2em] mb-6">
                            Since 2020
                        </p>
                        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
                            We are EdisonKart.
                        </h1>
                        <motion.p
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            custom={2}
                            className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto leading-relaxed"
                        >
                            Building India's most trusted marketplace for the modern generation.
                        </motion.p>
                    </motion.div>
                </div>
            </section>

            {/* ═══ STATS BAR ═══ */}
            <section className="bg-[#1E3A8A] py-10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="text-center"
                            >
                                <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                                    <CountUp value={stat.value} suffix={stat.suffix} />
                                </div>
                                <div className="text-sm text-[#F97316] font-medium uppercase tracking-wider">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ MISSION ═══ */}
            <section className="py-24">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-[2px] w-12 bg-[#F97316]" />
                            <p className="text-[#F97316] text-sm font-bold uppercase tracking-wider">Our Mission</p>
                        </div>

                        <h2 className="text-4xl md:text-5xl font-bold text-[#1E3A8A] mb-8 leading-tight">
                            Redefining the way you shop.
                        </h2>

                        <div className="space-y-5 text-lg text-slate-600 leading-relaxed">
                            <p>
                                EdisonKart was born from a simple idea: make quality products accessible to everyone in India. What started as a small team of 5 passionate individuals has now grown into a family serving customers across 50+ cities.
                            </p>
                            <p>
                                We believe shopping should be an experience, not just a transaction. From our curated selection to our seamless delivery, every detail is designed to delight.
                            </p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="relative h-[500px] rounded-3xl overflow-hidden group shadow-xl"
                    >
                        <img
                            src="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                            alt="Our journey"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1E3A8A]/90 via-transparent to-transparent" />
                        <div className="absolute bottom-10 left-10 right-10">
                            <blockquote className="text-xl italic text-white/90 font-light border-l-4 border-[#F97316] pl-6">
                                "Our goal isn't just to sell products. It's to build a platform that people trust implicitly."
                            </blockquote>
                            <p className="mt-4 text-white font-bold">— Rajesh Kumar, Founder</p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ═══ VALUES ═══ */}
            <section className="py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold text-[#1E3A8A] mb-4">
                            What drives us.
                        </h2>
                        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                            The core principles that guide every decision we make.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {values.map((value, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white p-8 rounded-2xl border border-slate-100 hover:border-[#F97316]/30 hover:shadow-lg hover:shadow-[#F97316]/5 transition-all duration-300 group hover:-translate-y-1"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-[#1E3A8A]/10 flex items-center justify-center text-[#1E3A8A] mb-6 group-hover:bg-[#F97316]/10 group-hover:text-[#F97316] transition-colors duration-300">
                                    <value.icon className="h-7 w-7" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-[#1E3A8A] transition-colors">{value.title}</h3>
                                <p className="text-slate-500 leading-relaxed">
                                    {value.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ CTA ═══ */}
            <section className="py-24 bg-[#1E3A8A] relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#F97316]/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-white/5 rounded-full blur-[100px]" />
                </div>

                <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                            Join the <span className="text-[#F97316]">Revolution.</span>
                        </h2>
                        <p className="text-lg text-white/70 mb-10 max-w-2xl mx-auto">
                            Experience the future of shopping with EdisonKart. Quality, speed, and trust — delivered to your doorstep.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link to="/products">
                                <Button size="lg" className="h-14 px-10 rounded-full bg-[#F97316] hover:bg-[#EA580C] text-white text-lg font-bold shadow-xl shadow-[#F97316]/20">
                                    Start Shopping <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                            <Link to="/contact">
                                <Button size="lg" variant="outline" className="h-14 px-10 rounded-full border-white/20 text-white hover:bg-white hover:text-[#1E3A8A] text-lg font-medium bg-transparent">
                                    Contact Us
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    )
}

export default About