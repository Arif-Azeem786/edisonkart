import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Search,
    ChevronDown,
    ShoppingBag,
    CreditCard,
    Truck,
    RotateCcw,
    User,
    Shield,
    Package,
    HelpCircle
} from 'lucide-react'
import { Button } from '../ui/button'

const FAQ = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [activeCategory, setActiveCategory] = useState('all')
    const [openItems, setOpenItems] = useState({})

    const categories = [
        { id: 'all', name: 'All Questions', icon: HelpCircle },
        { id: 'orders', name: 'Orders', icon: ShoppingBag },
        { id: 'payment', name: 'Payment', icon: CreditCard },
        { id: 'shipping', name: 'Shipping', icon: Truck },
        { id: 'returns', name: 'Returns', icon: RotateCcw },
        { id: 'account', name: 'Account', icon: User },
    ]

    const faqs = [
        { id: 1, category: 'orders', question: 'How do I track my order?', answer: 'You can track your order by logging into your account and visiting the "My Orders" section. Each order has a tracking number that you can use to monitor your package\'s journey. We also send tracking updates via email and SMS.' },
        { id: 2, category: 'orders', question: 'Can I modify or cancel my order?', answer: 'Orders can be modified or cancelled within 2 hours of placing them. Once the order is processed, modifications may not be possible. Please contact customer support immediately if you need to make changes.' },
        { id: 3, category: 'payment', question: 'What payment methods do you accept?', answer: 'We accept all major credit/debit cards (Visa, MasterCard, RuPay), UPI (Google Pay, PhonePe, Paytm), Net Banking, and EMI options. All payments are securely processed through Cashfree.' },
        { id: 4, category: 'payment', question: 'Is it safe to use my credit card?', answer: 'Yes, absolutely. We use industry-standard SSL encryption to protect your data. We are PCI-DSS compliant and never store your complete card information on our servers.' },
        { id: 5, category: 'shipping', question: 'How much does shipping cost?', answer: 'We offer free shipping on all orders above ₹999. For orders below ₹999, a nominal shipping fee of ₹49 applies. Premium members always get free shipping.' },
        { id: 6, category: 'shipping', question: 'How long does delivery take?', answer: 'Delivery typically takes 3-5 business days for metro cities and 5-7 business days for other locations. Express shipping is available at checkout for faster delivery.' },
        { id: 7, category: 'returns', question: 'What is your return policy?', answer: 'We offer 30-day easy returns on most products. Items must be unused and in original packaging with all tags attached. Some exclusions apply for hygiene products.' },
        { id: 8, category: 'returns', question: 'How do I initiate a return?', answer: 'To initiate a return, go to "My Orders", select the item you want to return, and click "Return Item". Follow the instructions to print the return label and pack your item securely.' },
        { id: 9, category: 'account', question: 'How do I create an account?', answer: 'Click on "Sign In" at the top right corner, then select "Create New Account". Fill in your details and verify your email with the OTP sent to you.' },
        { id: 10, category: 'account', question: 'I forgot my password. What should I do?', answer: 'Click on "Forgot Password" on the login page. Enter your email address, and we\'ll send you a link to reset your password securely.' },
    ]

    const toggleItem = (id) => setOpenItems(prev => ({ ...prev, [id]: !prev[id] }))

    const filteredFaqs = faqs.filter(faq => {
        const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) || faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = activeCategory === 'all' || faq.category === activeCategory
        return matchesSearch && matchesCategory
    })

    return (
        <div className="min-h-screen">
            {/* Hero */}
            <section className="relative bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] py-20">
                <div className="max-w-4xl mx-auto text-center px-4">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <span className="text-[#F97316] text-sm font-semibold uppercase tracking-wider">Help Center</span>
                        <h1 className="text-4xl md:text-5xl font-bold text-white mt-3 mb-4">Frequently Asked Questions</h1>
                    </motion.div>
                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-lg text-white/70 mb-8">
                        Find answers to common questions about our services
                    </motion.p>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="max-w-2xl mx-auto relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                        <input
                            type="text"
                            placeholder="Search your question..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/50 text-sm"
                        />
                    </motion.div>
                </div>
            </section>

            {/* Categories */}
            <section className="py-10 bg-muted/50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex flex-wrap gap-2 justify-center">
                        {categories.map((category, i) => (
                            <motion.button
                                key={category.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => setActiveCategory(category.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeCategory === category.id
                                    ? 'bg-[#1E3A8A] text-white shadow-sm shadow-[#1E3A8A]/20'
                                    : 'bg-card border border-border/50 hover:bg-muted text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <category.icon className="h-4 w-4" />
                                <span>{category.name}</span>
                            </motion.button>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ List */}
            <section className="py-12">
                <div className="max-w-3xl mx-auto px-4">
                    <AnimatePresence mode="wait">
                        {filteredFaqs.length === 0 ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-16">
                                <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <HelpCircle className="h-7 w-7 text-muted-foreground/30" />
                                </div>
                                <h3 className="text-lg font-semibold mb-1">No questions found</h3>
                                <p className="text-sm text-muted-foreground">Try adjusting your search or contact our support team</p>
                            </motion.div>
                        ) : (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                                {filteredFaqs.map((faq, index) => (
                                    <motion.div
                                        key={faq.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.04 }}
                                        className="bg-card rounded-2xl border border-border/50 overflow-hidden"
                                    >
                                        <button
                                            onClick={() => toggleItem(faq.id)}
                                            className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-muted/50 transition"
                                        >
                                            <span className="font-medium text-sm">{faq.question}</span>
                                            <motion.div animate={{ rotate: openItems[faq.id] ? 180 : 0 }} transition={{ duration: 0.3 }}>
                                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                            </motion.div>
                                        </button>
                                        <AnimatePresence>
                                            {openItems[faq.id] && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="px-5 pb-4 text-muted-foreground text-sm leading-relaxed">
                                                        {faq.answer}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </section>

            {/* CTA */}
            <section className="py-12 bg-muted/50">
                <div className="max-w-2xl mx-auto text-center px-4">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                        <h2 className="text-2xl font-bold mb-3">Still Have Questions?</h2>
                        <p className="text-muted-foreground text-sm mb-6">
                            Can't find the answer? Please chat with our team or send us an email.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button className="rounded-xl bg-[#1E3A8A] hover:bg-[#15306B] shadow-lg shadow-[#1E3A8A]/20" onClick={() => window.location.href = '/contact'}>
                                Contact Support
                            </Button>
                            <Button variant="outline" className="rounded-xl" onClick={() => window.location.href = 'mailto:support@edisonkart.com'}>
                                Email Us
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    )
}

export default FAQ