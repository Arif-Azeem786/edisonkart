import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, ShoppingBag } from 'lucide-react'

// High-quality, curated Unsplash images for each category
const categoryImages = {
  electronics: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  fashion: 'https://images.unsplash.com/photo-1445205170230-053b83016050?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  'home-living': 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  books: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  sports: 'https://images.unsplash.com/photo-1461896836934-bd45ba8fcf9b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  beauty: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  toys: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  grocery: 'https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  accessories: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  footwear: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
}

const fallbackImage = 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'

const categoryGradients = {
  electronics: 'from-[#1E3A8A] to-[#334155]',
  fashion: 'from-[#1E3A8A] to-[#15306B]',
  'home-living': 'from-[#F97316] to-[#EA580C]',
  books: 'from-amber-700 to-orange-600',
  sports: 'from-emerald-700 to-teal-600',
  beauty: 'from-pink-600 to-rose-500',
  toys: 'from-sky-600 to-blue-500',
  grocery: 'from-[#10B981] to-emerald-600',
  accessories: 'from-slate-700 to-zinc-600',
  footwear: 'from-red-600 to-rose-500',
}

const CategoryCard = ({ category }) => {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const imageUrl = categoryImages[category.slug] || fallbackImage
  const gradient = categoryGradients[category.slug] || 'from-[#1E3A8A] to-[#2563EB]'

  return (
    <motion.div
      whileHover={{ y: -8, transition: { duration: 0.3, ease: 'easeOut' } }}
      whileTap={{ scale: 0.98 }}
      className="group relative overflow-hidden rounded-2xl cursor-pointer"
    >
      <Link to={`/products?category=${category.slug}`}>
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          {/* Loading Skeleton */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 skeleton-shine" />
          )}

          {/* Image or Gradient Fallback */}
          {!imageError ? (
            <img
              src={imageUrl}
              alt={category.name}
              onLoad={() => setImageLoaded(true)}
              onError={() => { setImageError(true); setImageLoaded(true) }}
              className={`w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center p-6 text-white`}>
              <ShoppingBag className="h-12 w-12 mb-3 opacity-60" />
              <span className="text-lg font-bold text-center">{category.name}</span>
            </div>
          )}

          {/* Dark Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1E3A8A]/85 via-[#1E3A8A]/30 to-transparent transition-opacity duration-300 group-hover:from-[#1E3A8A]/90" />

          {/* Hover Glow */}
          <div className="absolute inset-0 bg-[#1E3A8A]/0 group-hover:bg-[#1E3A8A]/5 transition-colors duration-500" />

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
            <motion.h3
              className="text-xl font-bold mb-1 transition-transform duration-300 group-hover:-translate-y-1"
            >
              {category.name}
            </motion.h3>

            {category.productCount > 0 && (
              <p className="text-xs text-white/60 mb-1.5 transition-opacity duration-300">
                {category.productCount} Products
              </p>
            )}

            <div className="flex items-center gap-1.5 text-sm font-medium text-[#1E3A8A] opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
              <span>Shop Now</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </div>

          {/* Hover Border */}
          <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#1E3A8A]/20 rounded-2xl transition-colors duration-300 pointer-events-none" />
        </div>
      </Link>
    </motion.div>
  )
}

export default CategoryCard