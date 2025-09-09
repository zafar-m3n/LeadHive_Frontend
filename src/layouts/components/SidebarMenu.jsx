import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import token from "@/lib/utilities";

const SidebarMenu = ({ menuItems }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    token.logout();
    navigate("/login");
  };

  return (
    <nav className="mt-6 flex-1 px-3 pb-4 space-y-1 overflow-y-auto">
      {menuItems.map((item, idx) => {
        const isActive = location.pathname === item.path;

        if (item.action === "logout") {
          return (
            <button
              key={idx}
              onClick={handleLogout}
              className="flex items-center w-full p-2 rounded-lg text-gray-700 hover:bg-accent/10 transition"
            >
              <Icon icon={item.icon} width={20} className="mr-3 text-accent" />
              <span>{item.label}</span>
            </button>
          );
        }

        return (
          <Link
            key={idx}
            to={item.path}
            className={`flex items-center p-2 rounded-lg transition ${
              isActive ? "bg-accent text-white font-semibold shadow" : "text-gray-700 hover:bg-accent/10"
            }`}
          >
            <Icon icon={item.icon} width={20} className={`mr-3 ${isActive ? "text-white" : "text-accent"}`} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default SidebarMenu;
