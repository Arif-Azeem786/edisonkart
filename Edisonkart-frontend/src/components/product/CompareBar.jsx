import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitCompare, X, ArrowRight, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import useCompareStore from '../../store/compareStore';
import { getProductImageUrl, NO_IMAGE_PLACEHOLDER } from '../ui/imageUtils';
import CompareModal from './CompareModal';

const CompareBar = () => {
  const { compareItems, removeFromCompare, clearCompare } = useCompareStore();
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  if (compareItems.length === 0) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-24 sm:bottom-8 left-1/2 -translate-x-1/2 z-[60] w-[94%] max-w-2xl px-2"
        >
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl md:rounded-3xl p-3 md:p-4 flex items-center justify-between gap-3 md:gap-6">
            <div className="flex items-center gap-2 md:gap-4 flex-1">
              <div className="bg-[#1E3A8A] text-white p-2 md:p-2.5 rounded-xl md:rounded-2xl shadow-lg shadow-[#1E3A8A]/20">
                <GitCompare className="h-4 w-4 md:h-5 md:w-5" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Compare</p>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                  {compareItems.length}/4
                </p>
              </div>

              <div className="flex -space-x-3 ml-1 md:ml-2">
                {compareItems.map((item) => (
                  <motion.div
                    key={item._id}
                    layoutId={`compare-${item._id}`}
                    className="relative group cursor-pointer"
                  >
                    <div className="h-9 w-9 md:h-12 md:w-12 rounded-lg md:rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-white dark:border-slate-900 overflow-hidden shadow-md">
                      <img
                        src={item.imageIds?.length > 0 ? getProductImageUrl(item.imageIds[0]) : NO_IMAGE_PLACEHOLDER}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      onClick={() => removeFromCompare(item._id)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-100 transition-opacity shadow-xl z-20"
                    >
                      <X className="h-2 w-2 md:h-3 md:w-3" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1.5 md:gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={clearCompare}
                className="h-9 w-9 md:h-11 md:w-11 rounded-xl md:rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                title="Clear Compare"
              >
                <Trash2 className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
              <Button
                onClick={() => setIsModalOpen(true)}
                disabled={compareItems.length < 2}
                className="h-9 md:h-11 px-4 md:px-6 rounded-xl md:rounded-2xl bg-[#1E3A8A] hover:bg-[#F97316] text-white font-bold text-xs md:text-sm transition-all shadow-lg flex items-center gap-1.5 md:gap-2"
              >
                <span>Compare</span>
                <ArrowRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <CompareModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};

export default CompareBar;
