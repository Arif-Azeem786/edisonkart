import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
    Mail,
    Phone,
    MapPin,
    Clock,
    Send,
    Facebook,
    Twitter,
    Instagram,
    Youtube,
    ChevronDown,
    ArrowRight
} from 'lucide-react'
import { Button } from '../ui/button'
import { useToast } from '../ui/use-toast'
import { submitContact } from '../../services/contact'

const Contact = () => {
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const { toast } = useToast()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            await submitContact(formData)
            setIsSubmitted(true)
            setFormData({ name: '', email: '', subject: '', message: '' })
            toast({
                title: "Message Sent!",
                description: "Thank you for contacting us. We'll get back to you shortly.",
            })
        } catch (error) {
            toast({
                title: "Failed to send message",
                description: error.response?.data?.message || "Something went wrong. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const contactInfo = [
        { icon: Phone, title: 'Phone', details: ['+91 80744 58768'], action: 'tel:+918074458768' },
        { icon: Mail, title: 'Email', details: ['edisonkart@gmail.com'], action: 'mailto:edisonkart@gmail.com' },
        { icon: MapPin, title: 'Office', details: ['Prasannaya Palli, Rapthadu', 'Anantapur, Andhra Pradesh 515002'], action: 'https://maps.google.com/?q=JJP2+RHF+Prasannaya+Palli+Rapthadu+Anantapur+Andhra+Pradesh' },
        { icon: Clock, title: 'Hours', details: ['Monday - Saturday: 9AM - 8PM', 'Sunday: 10AM - 6PM'], action: null },
    ]

    const faqs = [
        { question: 'How can I track my order?', answer: 'You can track your order from the "My Orders" section. We also send tracking updates via email and SMS.' },
        { question: 'What is your return policy?', answer: 'We offer 30-day easy returns on most products. Items must be unused and in original packaging.' },
        { question: 'Do you ship internationally?', answer: 'Currently, we ship only within India. We plan to start international shipping soon.' },
        { question: 'How can I cancel my order?', answer: 'Orders can be cancelled within 24 hours of placement from the "My Orders" section.' },
    ]

    const fadeUp = {
        hidden: { opacity: 0, y: 30 },
        visible: (i = 0) => ({
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, delay: i * 0.1, ease: "easeOut" }
        })
    }

    const inputClass = "w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/10 transition-all text-slate-900 placeholder:text-slate-400 text-sm"

    return (
        <div className="min-h-screen bg-white">

            {/* ═══ HERO ═══ */}
            <section className="relative h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1423666639041-f56000c27a9a?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
                        alt="Contact Us"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#1E3A8A]/80 via-[#1E3A8A]/60 to-white" />
                </div>

                <div className="relative z-10 text-center px-6">
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-[#F97316] text-sm font-bold uppercase tracking-[0.2em] mb-4"
                    >
                        Get in Touch
                    </motion.p>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight"
                    >
                        We'd love to hear from you.
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="text-lg text-white/80 max-w-2xl mx-auto"
                    >
                        Have a question or just want to say hi? We're simpler to reach than you think.
                    </motion.p>
                </div>
            </section>

            {/* ═══ CONTACT CARDS ═══ */}
            <section className="py-16 relative z-20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {contactInfo.map((info, i) => (
                            <motion.a
                                key={i}
                                href={info.action || undefined}
                                target={info.action ? '_blank' : '_self'}
                                rel="noopener noreferrer"
                                custom={i}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, margin: "-50px" }}
                                variants={fadeUp}
                                className={`
                                    bg-white p-8 rounded-2xl border border-slate-100 shadow-sm
                                    hover:border-[#F97316]/30 hover:shadow-lg hover:shadow-[#F97316]/5 transition-all duration-300 group
                                    ${!info.action ? 'cursor-default' : 'cursor-pointer'}
                                `}
                            >
                                <div className="w-12 h-12 rounded-xl bg-[#1E3A8A]/10 flex items-center justify-center text-[#1E3A8A] mb-6 group-hover:bg-[#F97316]/10 group-hover:text-[#F97316] transition-colors duration-300">
                                    <info.icon className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-[#1E3A8A] transition-colors">
                                    {info.title}
                                </h3>
                                <div className="space-y-1">
                                    {info.details.map((detail, j) => (
                                        <p key={j} className="text-slate-500 text-sm leading-relaxed">{detail}</p>
                                    ))}
                                </div>
                            </motion.a>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ FORM & MAP ═══ */}
            <section className="py-16 bg-slate-50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

                        {/* Form */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <h2 className="text-3xl md:text-4xl font-bold text-[#1E3A8A] mb-3">Send us a Message</h2>
                            <p className="text-slate-500 mb-8">
                                Fill out the form below and our team will get back to you within 24 hours.
                            </p>

                            {isSubmitted ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-green-50 border border-green-200 p-8 rounded-2xl text-center py-16"
                                >
                                    <div className="inline-flex p-4 bg-green-500 rounded-full mb-6 shadow-lg shadow-green-500/20">
                                        <Send className="h-8 w-8 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Message Sent!</h3>
                                    <p className="text-slate-500">Thank you for contacting us. We'll be in touch shortly.</p>
                                    <Button
                                        variant="link"
                                        onClick={() => setIsSubmitted(false)}
                                        className="mt-6 text-[#F97316] hover:text-[#EA580C]"
                                    >
                                        Send another message
                                    </Button>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-slate-700 ml-0.5">Name</label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                required
                                                className={inputClass}
                                                placeholder="John Doe"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-slate-700 ml-0.5">Email</label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                required
                                                className={inputClass}
                                                placeholder="john@example.com"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700 ml-0.5">Subject</label>
                                        <input
                                            type="text"
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            required
                                            className={inputClass}
                                            placeholder="How can we help?"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700 ml-0.5">Message</label>
                                        <textarea
                                            rows="5"
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            required
                                            className={`${inputClass} resize-none`}
                                            placeholder="Tell us more about your inquiry..."
                                        />
                                    </div>

                                    <div className="pt-2">
                                        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                                            <Button
                                                type="submit"
                                                className="w-full sm:w-auto px-10 rounded-xl bg-[#1E3A8A] hover:bg-[#F97316] h-12 font-semibold shadow-lg shadow-[#1E3A8A]/15 transition-all duration-300"
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting ? (
                                                    <div className="flex items-center gap-2">
                                                        <motion.div
                                                            animate={{ rotate: 360 }}
                                                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                                            className="h-5 w-5 border-2 border-white border-t-transparent rounded-full"
                                                        />
                                                        <span>Sending...</span>
                                                    </div>
                                                ) : (
                                                    <span className="flex items-center gap-2">
                                                        Send Message <ArrowRight className="h-4 w-4" />
                                                    </span>
                                                )}
                                            </Button>
                                        </motion.div>
                                    </div>
                                </form>
                            )}
                        </motion.div>

                        {/* Map */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="h-[550px] bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-100 relative group"
                        >
                            <iframe
                                src="https://maps.google.com/maps?q=JJP2%2BRHF+Prasannaya+Palli+Rapthadu+Anantapur+Andhra+Pradesh+515002&output=embed&z=16"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                title="EdisonKart Location"
                                className="opacity-90 group-hover:opacity-100 transition-opacity duration-500"
                            />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ═══ FAQ ═══ */}
            <section className="py-20">
                <div className="max-w-4xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-[#1E3A8A] mb-3">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-slate-500">Everything you need to know about shopping with us.</p>
                    </motion.div>

                    <div className="space-y-3">
                        {faqs.map((faq, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.08 }}
                                className="border border-slate-200 rounded-xl overflow-hidden bg-white hover:border-[#1E3A8A]/20 transition-colors"
                            >
                                <details className="group">
                                    <summary className="flex items-center justify-between p-5 cursor-pointer list-none select-none">
                                        <span className="font-semibold text-slate-900 group-hover:text-[#1E3A8A] transition-colors">{faq.question}</span>
                                        <span className="text-slate-400 transition-transform duration-300 group-open:rotate-180 flex-shrink-0 ml-4">
                                            <ChevronDown className="h-5 w-5" />
                                        </span>
                                    </summary>
                                    <div className="px-5 pb-5 text-slate-500 leading-relaxed border-t border-slate-100 pt-4">
                                        {faq.answer}
                                    </div>
                                </details>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ SOCIAL ═══ */}
            <section className="py-16 bg-slate-50">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <h3 className="text-2xl font-bold text-[#1E3A8A] mb-8">Connect With Us</h3>
                    <div className="flex justify-center gap-4">
                        {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                            <motion.a
                                key={i}
                                href="#"
                                whileHover={{ scale: 1.1, y: -4 }}
                                whileTap={{ scale: 0.9 }}
                                className="w-14 h-14 bg-white rounded-xl flex items-center justify-center border border-slate-200 text-slate-600 hover:text-[#F97316] hover:border-[#F97316]/30 hover:shadow-lg hover:shadow-[#F97316]/10 transition-all duration-300"
                            >
                                <Icon className="h-6 w-6" />
                            </motion.a>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    )
}

export default Contact