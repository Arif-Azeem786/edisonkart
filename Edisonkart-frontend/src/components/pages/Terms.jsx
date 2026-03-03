import { motion } from 'framer-motion'
import { Shield, FileText, Scale, Eye, Lock, AlertCircle } from 'lucide-react'

const Terms = () => {
  const sections = [
    { icon: FileText, title: '1. Acceptance of Terms', content: 'By accessing and using EdisonKart, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, please do not use our services.' },
    { icon: Scale, title: '2. Eligibility', content: 'You must be at least 18 years old to use our services. By using EdisonKart, you represent and warrant that you have the right, authority, and capacity to enter into this agreement.' },
    { icon: Eye, title: '3. Account Registration', content: 'You are responsible for maintaining the confidentiality of your account credentials. Any activities that occur under your account are your responsibility.' },
    { icon: Lock, title: '4. Privacy Policy', content: 'Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your personal information.' },
    { icon: AlertCircle, title: '5. Product Information', content: 'We strive to display accurate product information, but we do not warrant that product descriptions or other content are accurate, complete, or error-free.' },
    { icon: Shield, title: '6. Pricing and Payments', content: 'All prices are in Indian Rupees (INR) and inclusive of applicable taxes. We reserve the right to modify prices without prior notice.' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-3">Terms & Conditions</h1>
        <p className="text-muted-foreground text-sm">Last updated: January 15, 2024</p>
      </motion.div>

      <div className="space-y-4">
        {sections.map((section, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-card p-6 rounded-2xl border border-border/50"
          >
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-[#1E3A8A]/10 rounded-xl flex-shrink-0">
                <section.icon className="h-5 w-5 text-[#1E3A8A]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-2">{section.title}</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">{section.content}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-10 p-8 bg-muted/50 rounded-2xl text-center"
      >
        <h2 className="text-xl font-bold mb-3">Have Questions?</h2>
        <p className="text-muted-foreground text-sm mb-5">
          If you have any questions about our Terms & Conditions, please contact us.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center text-sm">
          <a href="mailto:legal@edisonkart.com" className="text-[#F97316] hover:underline">legal@edisonkart.com</a>
          <span className="hidden sm:inline text-muted-foreground">|</span>
          <a href="tel:+919876543210" className="text-[#F97316] hover:underline">+91 98765 43210</a>
        </div>
      </motion.div>
    </div>
  )
}

export default Terms