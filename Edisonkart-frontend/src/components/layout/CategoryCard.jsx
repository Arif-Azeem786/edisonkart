import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

const CategoryCard = ({ category }) => {
  const categoryImages = {
    electronics: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    fashion: 'https://images.unsplash.com/photo-1445205170230-053b83016050?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    'home-living': 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    books: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  }

  const imageUrl = categoryImages[category.slug] ||
    'https://images.unsplash.com/photo-1472851294608-062f824d29cc?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
    },
  }

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3 }}
      className="group relative overflow-hidden rounded-2xl cursor-pointer"
    >
      <Link to={`/products?category=${category.slug}`}>
        <div className="relative aspect-[4/3]">
          <img
            src={imageUrl}
            alt={category.name}
            className="w-full h-full object-cover group-hover:scale-110 transition duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1E3A8A]/80 via-[#1E3A8A]/20 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h3 className="text-xl font-bold mb-1">{category.name}</h3>
            <p className="flex items-center gap-1.5 text-sm text-white/80 group-hover:text-[#1E3A8A] transition-colors duration-300">
              Shop Now
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1.5 transition-transform duration-300" />
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default CategoryCard