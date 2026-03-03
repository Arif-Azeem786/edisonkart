import { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Edit2, Trash2, Check } from 'lucide-react'
import { Button } from '../ui/button'

const AddressCard = ({ address, onSetDefault, onEdit, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`relative p-4 border rounded-xl transition-all ${address.isDefault
          ? 'border-[#1E3A8A] bg-[#1E3A8A]/5'
          : 'border-border/50 hover:border-border'
        }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <MapPin className="h-4 w-4 text-[#1E3A8A] mr-2" />
            <span className="font-medium text-sm">{address.name}</span>
            {address.isDefault && (
              <span className="ml-2 text-[10px] bg-[#1E3A8A] text-white px-2 py-0.5 rounded-full font-medium uppercase tracking-wide">
                Default
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {address.addressLine1}<br />
            {address.addressLine2 && <>{address.addressLine2}<br /></>}
            {address.city}, {address.state} - {address.pincode}<br />
            Phone: {address.phone}
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          className="flex gap-1"
        >
          {!address.isDefault && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onSetDefault(address._id)}
              className="h-8 w-8 text-[#1E3A8A] hover:bg-[#1E3A8A]/10"
              title="Set as default"
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(address._id)}
            className="h-8 w-8 text-[#F97316] hover:bg-[#F97316]/10"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(address._id)}
            className="h-8 w-8 text-red-500 hover:bg-red-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default AddressCard