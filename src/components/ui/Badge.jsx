import React from "react";
import Icon from "@/components/ui/Icon";

const Badge = ({ text, color = "blue", size = "md", icon = null, rounded = "rounded" }) => {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  const colorClasses = {
    blue: "bg-blue-100 text-blue-800",
    red: "bg-red-100 text-red-800",
    green: "bg-green-100 text-green-800",
    yellow: "bg-yellow-100 text-yellow-800",
    gray: "bg-gray-100 text-gray-800",
  };

  return (
    <span
      className={`inline-flex items-center ${sizeClasses[size]} ${colorClasses[color]} ${rounded} font-medium capitalize`}
    >
      {icon && <Icon icon={icon} className="me-2 h-4 w-4" />}
      {text}
    </span>
  );
};

export default Badge;
