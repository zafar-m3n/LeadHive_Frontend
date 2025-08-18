import React from "react";
import SidebarMenu from "./SidebarMenu";
import logo from "@/assets/logo.png";

const Sidebar = ({ menuOpen }) => {
  const commonItems = [
    { label: "Dashboard", icon: "mdi:view-dashboard-outline", path: "/dashboard" },
    { label: "Products", icon: "mdi:package-variant", path: "/products" },
    // { label: "Categories", icon: "material-symbols:category-outline-rounded", path: "/categories" },
    { label: "Warehouses", icon: "material-symbols:warehouse-outline-rounded", path: "/warehouses" },
    { label: "Reports", icon: "mdi:file-chart-outline", path: "/reports" },
    { label: "Logout", icon: "mdi:logout", action: "logout" },
  ];

  return (
    <div
      className={`fixed top-0 bottom-0 left-0 w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out
        ${menuOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 md:relative md:z-40 md:flex flex-col`}
    >
      <div className="flex justify-between items-center p-4 shadow-sm">
        <img src={logo} alt="LeadHive Logo" className="h-8 w-auto" />
      </div>

      <SidebarMenu menuItems={commonItems} />
    </div>
  );
};

export default Sidebar;
