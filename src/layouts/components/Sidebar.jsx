import React from "react";
import SidebarMenu from "./SidebarMenu";
import logo from "@/assets/logo.png";
import token from "@/lib/utilities";

const Sidebar = ({ menuOpen }) => {
  const user = token.getUserData();
  const role = user.role.value; // backend sends: "admin" | "manager" | "sales_rep"

  // ==============================
  // Menus by role
  // ==============================
  const adminItems = [
    { label: "Dashboard", icon: "mdi:view-dashboard-outline", path: "/admin/dashboard" },
    { label: "Manage Users", icon: "mdi:account-multiple-outline", path: "/admin/users" },
    { label: "Teams", icon: "mdi:users", path: "/admin/teams" },
    { label: "Leads", icon: "mdi:account-tie-outline", path: "/admin/leads" },
    { label: "Reports", icon: "mdi:file-chart-outline", path: "/admin/reports" },
    { label: "Settings", icon: "mdi:cog-outline", path: "/admin/settings" },
    { label: "Logout", icon: "mdi:logout", action: "logout" },
  ];

  const managerItems = [
    { label: "Dashboard", icon: "mdi:view-dashboard-outline", path: "/manager/dashboard" },
    { label: "Team Leads", icon: "mdi:account-group-outline", path: "/manager/leads" },
    { label: "Reports", icon: "mdi:file-chart-outline", path: "/manager/reports" },
    { label: "Profile", icon: "mdi:account-circle-outline", path: "/manager/profile" },
    { label: "Logout", icon: "mdi:logout", action: "logout" },
  ];

  const salesRepItems = [
    { label: "Dashboard", icon: "mdi:view-dashboard-outline", path: "/dashboard" },
    { label: "My Leads", icon: "mdi:account-tie-outline", path: "/leads" },
    { label: "Profile", icon: "mdi:account-circle-outline", path: "/profile" },
    { label: "Logout", icon: "mdi:logout", action: "logout" },
  ];

  // ==============================
  // Pick menu by role
  // ==============================
  let menuItems = [];
  if (role === "admin") menuItems = adminItems;
  else if (role === "manager") menuItems = managerItems;
  else if (role === "sales_rep") menuItems = salesRepItems;
  else menuItems = [{ label: "Logout", icon: "mdi:logout", action: "logout" }];

  return (
    <div
      className={`fixed top-0 bottom-0 left-0 w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out
        ${menuOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 md:relative md:z-40 md:flex flex-col`}
    >
      <div className="flex justify-between items-center p-4 shadow-sm">
        <img src={logo} alt="LeadHive Logo" className="h-8 w-auto" />
      </div>

      <SidebarMenu menuItems={menuItems} />
    </div>
  );
};

export default Sidebar;
