import React from "react";
import Icon from "@/components/ui/Icon";

const Pagination = ({ currentPage, totalPages, onPageChange, className = "", text = false }) => {
  const getPageNumbers = () => {
    const pages = [];
    const startPage = 1;
    const endPage = totalPages;

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages.length > 10 ? [1, 2, 3, "...", totalPages - 2, totalPages - 1, totalPages] : pages;
  };

  const handleClick = (page) => {
    if (page !== "..." && page !== currentPage) {
      onPageChange(page);
    }
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <button
        onClick={() => handleClick(currentPage - 1)}
        disabled={currentPage === 1}
        className={`flex items-center justify-center w-10 h-10 border rounded ${
          currentPage === 1
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : text
            ? "bg-white hover:bg-gray-100 text-black"
            : "bg-black text-white"
        }`}
      >
        {text ? "Previous" : <Icon icon="heroicons:chevron-left" className="w-4 h-4" />}
      </button>

      {pageNumbers.map((page, index) => (
        <button
          key={index}
          onClick={() => handleClick(page)}
          disabled={page === "..."}
          className={`px-4 py-2 text-sm ${
            page === "..."
              ? "cursor-not-allowed text-gray-400"
              : page === currentPage
              ? "font-bold text-accent"
              : "hover:underline text-gray-800"
          }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => handleClick(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`flex items-center justify-center w-10 h-10 border rounded ${
          currentPage === totalPages
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : text
            ? "bg-white hover:bg-gray-100 text-black"
            : "bg-black text-white"
        }`}
      >
        {text ? "Next" : <Icon icon="heroicons:chevron-right" className="w-4 h-4" />}
      </button>
    </div>
  );
};

export default Pagination;
