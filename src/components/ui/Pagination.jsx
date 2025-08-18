import React from "react";
import Icon from "@/components/ui/Icon";

const DOTS = "DOTS";

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
  text = false,
  siblingCount = 1, // how many pages to show on each side of current
  boundaryCount = 1, // how many pages to always show at the start & end
}) => {
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  const range = (start, end) => {
    const out = [];
    for (let i = start; i <= end; i++) out.push(i);
    return out;
  };

  const getPageNumbers = () => {
    if (totalPages <= 1) return [1];

    // If small number of pages, show all
    const totalNumbers = boundaryCount * 2 + siblingCount * 2 + 3; // incl current + 2 DOTS
    if (totalPages <= totalNumbers) return range(1, totalPages);

    const leftSibling = Math.max(currentPage - siblingCount, boundaryCount + 2);
    const rightSibling = Math.min(currentPage + siblingCount, totalPages - boundaryCount - 1);

    const showLeftDots = leftSibling > boundaryCount + 2;
    const showRightDots = rightSibling < totalPages - boundaryCount - 1;

    const startPages = range(1, boundaryCount);
    const endPages = range(totalPages - boundaryCount + 1, totalPages);
    const middlePages = range(leftSibling, rightSibling);

    if (!showLeftDots && showRightDots) {
      // No left dots; extend left range from 1
      const leftItemCount = boundaryCount + siblingCount * 2 + 2; // include current vicinity
      const leftRange = range(1, leftItemCount);
      return [...leftRange, DOTS, ...endPages];
    }

    if (showLeftDots && !showRightDots) {
      // No right dots; extend right range to end
      const rightItemCount = boundaryCount + siblingCount * 2 + 2;
      const rightRange = range(totalPages - rightItemCount + 1, totalPages);
      return [...startPages, DOTS, ...rightRange];
    }

    // Both dots
    return [...startPages, DOTS, ...middlePages, DOTS, ...endPages];
  };

  const handleClick = (page) => {
    if (page === DOTS) return;
    const nextPage = clamp(page, 1, totalPages);
    if (nextPage !== currentPage) onPageChange(nextPage);
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <button
        onClick={() => handleClick(currentPage - 1)}
        disabled={currentPage <= 1}
        className={`flex items-center justify-center w-10 h-10 border rounded ${
          currentPage <= 1
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : text
            ? "bg-white hover:bg-gray-100 text-black"
            : "bg-black text-white"
        }`}
        aria-label="Previous page"
      >
        {text ? "Previous" : <Icon icon="heroicons:chevron-left" className="w-4 h-4" />}
      </button>

      {pageNumbers.map((item, idx) => {
        const isDots = item === DOTS;
        const isActive = item === currentPage;

        return (
          <button
            key={`${item}-${idx}`}
            onClick={() => handleClick(item)}
            disabled={isDots}
            className={`px-3 h-10 min-w-[2.5rem] border rounded text-sm flex items-center justify-center ${
              isDots
                ? "cursor-not-allowed text-gray-400 bg-white"
                : isActive
                ? "font-bold border-accent text-accent bg-accent/10"
                : "text-gray-800 bg-white hover:bg-gray-100"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            {isDots ? "…" : item}
          </button>
        );
      })}

      <button
        onClick={() => handleClick(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={`flex items-center justify-center w-10 h-10 border rounded ${
          currentPage >= totalPages
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : text
            ? "bg-white hover:bg-gray-100 text-black"
            : "bg-black text-white"
        }`}
        aria-label="Next page"
      >
        {text ? "Next" : <Icon icon="heroicons:chevron-right" className="w-4 h-4" />}
      </button>
    </div>
  );
};

export default Pagination;
