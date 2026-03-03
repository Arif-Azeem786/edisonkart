import React from 'react';
import { Button } from './button';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

const Pagination = ({ 
  page, 
  pages, 
  onPageChange,
  className = "" 
}) => {
  if (pages <= 1) return null;

  const getPageNumbers = () => {
    const pageNumbers = [];
    const threshold = 2; // How many pages to show around current page

    if (pages <= 7) {
      for (let i = 1; i <= pages; i++) pageNumbers.push(i);
    } else {
      pageNumbers.push(1);
      
      if (page > threshold + 2) {
        pageNumbers.push('ellipsis');
      }

      const start = Math.max(2, page - threshold);
      const end = Math.min(pages - 1, page + threshold);

      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }

      if (page < pages - threshold - 1) {
        pageNumbers.push('ellipsis');
      }

      pageNumbers.push(pages);
    }
    return pageNumbers;
  };

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="h-10 w-10 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 hover:bg-[#1E3A8A] hover:text-white transition-all shadow-sm"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-1.5">
        {getPageNumbers().map((n, i) => (
          <React.Fragment key={i}>
            {n === 'ellipsis' ? (
              <div className="w-10 h-10 flex items-center justify-center text-slate-400 dark:text-slate-600">
                <MoreHorizontal className="h-4 w-4" />
              </div>
            ) : (
              <Button
                variant={page === n ? "default" : "outline"}
                onClick={() => onPageChange(n)}
                 className={`h-10 min-w-[2.5rem] rounded-xl font-bold border-slate-200 dark:border-slate-800 transition-all shadow-sm ${
                  page === n 
                  ? 'bg-[#1E3A8A] text-white border-[#1E3A8A] scale-110' 
                  : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {n}
              </Button>
            )}
          </React.Fragment>
        ))}
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(page + 1)}
        disabled={page === pages}
        className="h-10 w-10 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 hover:bg-[#1E3A8A] hover:text-white transition-all shadow-sm"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default Pagination;
