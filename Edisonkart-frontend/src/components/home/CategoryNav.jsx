import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { 
  Smartphone, 
  Tv, 
  Shirt, 
  Home as HomeIcon, 
  Cpu, 
  ShoppingCart,
  HeartPulse,
  Palmtree,
  Car,
  Gamepad2,
  Umbrella,
  Watch
} from 'lucide-react'

const categories = [
  { name: 'Mobiles', slug: 'mobiles', icon: Smartphone, color: 'from-blue-400 to-blue-600' },
  { name: 'Electronics', slug: 'electronics', icon: Cpu, color: 'from-purple-400 to-purple-600' },
  { name: 'Fashion', slug: 'fashion', icon: Shirt, color: 'from-pink-400 to-pink-600' },
  { name: 'Home', slug: 'home', icon: HomeIcon, color: 'from-orange-400 to-orange-600' },
  { name: 'Appliances', slug: 'appliances', icon: Tv, color: 'from-cyan-400 to-cyan-600' },
  { name: 'Grocery', slug: 'grocery', icon: ShoppingCart, color: 'from-green-400 to-green-600' },
  { name: 'Beauty', slug: 'beauty', icon: HeartPulse, color: 'from-rose-400 to-rose-600' },
  { name: 'Travel', slug: 'travel', icon: Palmtree, color: 'from-teal-400 to-teal-600' },
  { name: 'Auto Acc', slug: 'auto', icon: Car, color: 'from-slate-400 to-slate-600' },
  { name: 'Toys & Baby', slug: 'toys', icon: Gamepad2, color: 'from-yellow-400 to-yellow-600' },
  { name: 'Accessories', slug: 'accessories', icon: Watch, color: 'from-indigo-400 to-indigo-600' },
  { name: 'Outdoor', slug: 'outdoor', icon: Umbrella, color: 'from-sky-400 to-sky-600' },
]

const CategoryNav = () => {
  return (
    <div className="w-full bg-white border-b border-slate-100 py-6 sm:py-8 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-start sm:justify-center gap-4 sm:gap-8 overflow-x-auto no-scrollbar pb-2">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
            >
              <Link 
                to={`/products?category=${cat.slug}`}
                className="group flex flex-col items-center gap-3 min-w-[70px] sm:min-w-[90px]"
              >
                {/* 3D Icon Container */}
                <motion.div 
                  whileHover={{ y: -8, scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative"
                >
                  {/* The "Platform" - mimics the light blue circle in the user image */}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-4 sm:w-16 sm:h-6 bg-blue-400/20 rounded-[100%] blur-sm group-hover:bg-blue-400/40 transition-all" />
                  
                  {/* The Icon Wrapper - with a slight tilt for 3D feel */}
                  <div className={`w-14 h-14 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-lg shadow-black/10 relative z-10 overflow-hidden transform group-hover:rotate-6 transition-transform duration-300`}>
                    {/* Glassmorphism shine */}
                    <div className="absolute top-0 left-0 w-full h-[50%] bg-white/20 -skew-y-12 translate-y-[-20%]" />
                    
                    <cat.icon className="w-7 h-7 sm:w-10 sm:h-10 text-white drop-shadow-md" />
                  </div>
                </motion.div>
                
                <span className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-tight group-hover:text-[#1E3A8A] transition-colors text-center whitespace-nowrap">
                  {cat.name}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CategoryNav
