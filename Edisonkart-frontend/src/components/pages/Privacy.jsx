import { motion } from 'framer-motion'
import {
  Shield, Lock, Eye, Database, Mail, Cookie,
  FileText, Users, CreditCard, Globe
} from 'lucide-react'
import { Link } from 'react-router-dom'

const Privacy = () => {
  const sections = [
    { icon: Eye, title: 'Information We Collect', content: 'We collect information you provide directly, such as when you create an account, make a purchase, or contact us. This includes your name, email, phone number, shipping address, and payment information.' },
    { icon: Database, title: 'How We Use Your Information', content: 'We use your information to process orders, communicate with you, improve our services, personalize your shopping experience, prevent fraud, and comply with legal obligations.' },
    { icon: Lock, title: 'Data Security', content: 'We implement industry-standard security measures including SSL encryption, firewalls, and secure servers to protect your personal information. All payment transactions are encrypted and processed through secure payment gateways.' },
    { icon: Cookie, title: 'Cookies and Tracking', content: 'We use cookies and similar technologies to enhance your browsing experience, analyze site traffic, remember your preferences, and personalize content. You can control cookies through your browser settings.' },
    { icon: Users, title: 'Information Sharing', content: 'We do not sell your personal information. We may share data with trusted partners who assist in operating our website, processing payments, delivering orders, and conducting our business.' },
    { icon: Mail, title: 'Communication Preferences', content: 'We may send you transactional emails about your orders, as well as promotional emails. You can opt out of promotional emails at any time by clicking the unsubscribe link.' },
    { icon: CreditCard, title: 'Payment Information', content: 'We use secure third-party payment processors like Cashfree to handle payments. We do not store your complete payment information on our servers.' },
    { icon: Globe, title: 'International Transfers', content: 'Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data.' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
        <div className="inline-flex p-3 bg-[#1E3A8A]/10 rounded-xl mb-4">
          <Shield className="h-8 w-8 text-[#1E3A8A]" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm">Last updated: January 15, 2024 | Version 2.0</p>
      </motion.div>

      {/* Intro */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-[#1E3A8A]/5 to-[#F97316]/5 p-8 rounded-2xl mb-8 border border-border/50"
      >
        <h2 className="text-xl font-semibold mb-3">Our Commitment to Privacy</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          At EdisonKart, we take your privacy seriously. This policy describes how we collect, use, and protect your personal information. By using our services, you trust us with your information, and we're committed to maintaining that trust.
        </p>
      </motion.div>

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((section, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 + 0.2 }}
            className="bg-card p-6 rounded-2xl border border-border/50 hover:shadow-lg hover:shadow-black/[0.04] transition-shadow"
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

      {/* Your Rights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="mt-10 p-8 bg-muted/50 rounded-2xl"
      >
        <h2 className="text-xl font-bold mb-4">Your Rights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {['Access your personal data', 'Correct inaccurate data', 'Request data deletion', 'Opt out of marketing', 'Export your data', 'Withdraw consent'].map((right, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-[#1E3A8A] rounded-full" />
              <span className="text-sm">{right}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Contact */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }} className="mt-8 text-center">
        <p className="text-muted-foreground text-sm mb-3">For privacy-related inquiries, please contact our Data Protection Officer:</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center text-sm">
          <a href="mailto:privacy@edisonkart.com" className="text-[#F97316] hover:underline">privacy@edisonkart.com</a>
          <span className="hidden sm:inline text-muted-foreground">|</span>
          <a href="tel:+919876543210" className="text-[#F97316] hover:underline">+91 98765 43210</a>
        </div>
      </motion.div>
    </div>
  )
}

export default Privacy