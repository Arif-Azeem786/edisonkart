import { motion } from 'framer-motion'
import { 
    Store, 
    TrendingUp, 
    ShieldCheck, 
    Zap, 
    ArrowRight, 
    CheckCircle2,
    Users,
    BadgePercent
} from 'lucide-react'
import { Button } from '../../ui/button'
import { Link } from 'react-router-dom'

const SellerOnboarding = () => {
    const features = [
        {
            icon: Users,
            title: "Millions of Customers",
            description: "Reach customers across India who are looking for products just like yours."
        },
        {
            icon: BadgePercent,
            title: "Lowest Commission",
            description: "Grow your business with our competitive commission rates and no hidden fees."
        },
        {
            icon: Zap,
            title: "Fast Payments",
            description: "Get your payments settled directly to your bank account with industry-leading speed."
        },
        {
            icon: ShieldCheck,
            title: "Seller Protection",
            description: "We protect you from fraudulent claims and handle delivery logistics for you."
        }
    ]

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative py-20 overflow-hidden">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-indigo-50 rounded-full blur-3xl opacity-50" />
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-50 rounded-full blur-3xl opacity-50" />
                
                <div className="container mx-auto px-6 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-bold mb-6"
                        >
                            <Store className="h-4 w-4" />
                            Become an EdisonKart Seller
                        </motion.div>
                        
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-5xl md:text-7xl font-bold font-syne text-slate-900 mb-8 leading-tight"
                        >
                            Start your selling journey <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-600">to reach millions.</span>
                        </motion.h1>
                        
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed"
                        >
                            Join India's fastest growing marketplace and take your business to the next level with our world-class seller hub.
                        </motion.p>
                        
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col sm:flex-row gap-4 justify-center"
                        >
                            <Button className="h-14 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-xl shadow-indigo-200">
                                Apply to Sell
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                            <Link to="/contact">
                                <Button variant="outline" className="h-14 px-10 rounded-2xl border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-lg">
                                    Talk to Expert
                                </Button>
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 bg-slate-50">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {[
                            { label: "Active Sellers", value: "50,000+" },
                            { label: "Monthly Users", value: "10M+" },
                            { label: "Pincodes Covered", value: "28,000+" },
                            { label: "Years of Trust", value: "5+" }
                        ].map((stat, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white p-8 rounded-3xl border border-slate-200 text-center shadow-sm"
                            >
                                <p className="text-4xl font-bold text-indigo-600 mb-2 font-syne">{stat.value}</p>
                                <p className="text-slate-500 font-medium">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row gap-16 items-center">
                        <div className="flex-1">
                            <h2 className="text-4xl font-bold font-syne text-indigo-900 mb-6 leading-tight">
                                Why sell on <br /> EdisonKart?
                            </h2>
                            <p className="text-lg text-slate-600 mb-10">
                                We provide a comprehensive ecosystem designed to help you succeed from day one.
                            </p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                {features.map((feature, i) => (
                                    <div key={i} className="flex flex-col gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                            <feature.icon className="h-6 w-6" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 leading-tight">{feature.title}</h3>
                                        <p className="text-slate-500 text-sm leading-relaxed">{feature.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="flex-1 relative">
                            <div className="relative z-10 bg-gradient-to-br from-indigo-100 to-emerald-100 rounded-[4rem] p-12 overflow-hidden border-8 border-white shadow-2xl shadow-indigo-100">
                                <TrendingUp className="text-indigo-600/10 absolute top-0 right-0 w-[300px] h-[300px] -translate-y-1/4 translate-x-1/4" />
                                <div className="space-y-6 relative z-20">
                                    <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-white">
                                        <p className="text-indigo-600 font-bold mb-2">Seller Review</p>
                                        <p className="text-slate-800 italic text-lg leading-relaxed">
                                            "EdisonKart helped me scale my local business to a national level within 3 months. The seller dashboard is incredibly easy to use."
                                        </p>
                                        <div className="flex items-center gap-3 mt-4">
                                            <div className="w-10 h-10 rounded-full bg-indigo-600" />
                                            <div>
                                                <p className="font-bold text-slate-900">Arun Kumar</p>
                                                <p className="text-xs text-slate-500">Electronic Goods Seller</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-indigo-900 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white rounded-full animate-ping" />
                </div>
                
                <div className="container mx-auto px-6 relative z-10 text-center text-white">
                    <h2 className="text-4xl md:text-5xl font-bold font-syne mb-8 leading-tight">
                        Ready to join the <br /> EdisonKart revolution?
                    </h2>
                    <p className="text-xl text-indigo-200 mb-12 max-w-xl mx-auto">
                        Setup your store in less than 5 minutes and start selling your products today.
                    </p>
                    <Button className="h-16 px-12 rounded-2xl bg-white text-indigo-900 hover:bg-slate-100 font-bold text-xl transition-all hover:scale-105 shadow-2xl">
                        Register Now
                    </Button>
                </div>
            </section>
        </div>
    )
}

export default SellerOnboarding
