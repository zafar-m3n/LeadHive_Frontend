import React, { useState, useCallback } from "react";
import SidebarMenu from "./SidebarMenu";
import logo from "@/assets/logo.png";
import favicon from "@/assets/favicon.png";
import token from "@/lib/utilities";
import useWidth from "@/hooks/useWidth";

const Sidebar = ({ menuOpen, setMenuOpen }) => {
  const { width, breakpoints } = useWidth();

  const user = token.getUserData?.() || {};
  const role = user?.role?.value || "guest"; // "admin" | "manager" | "sales_rep"

  // Enable hover expansion only on desktop
  const isDesktop = width >= breakpoints.md;

  const [isHoverExpanded, setIsHoverExpanded] = useState(false);

  const openExpanded = useCallback(() => {
    if (isDesktop) setIsHoverExpanded(true);
  }, [isDesktop]);

  const closeExpanded = useCallback(() => {
    if (isDesktop) setIsHoverExpanded(false);
  }, [isDesktop]);

  // Menus by role
  const adminItems = [
    { label: "Dashboard", icon: "mdi:view-dashboard-outline", path: "/admin/dashboard" },
    { label: "Manage Users", icon: "mdi:account-multiple-outline", path: "/admin/users" },
    { label: "Teams", icon: "mdi:users", path: "/admin/teams" },
    { label: "Leads", icon: "mdi:account-tie-outline", path: "/admin/leads" },
    { label: "Settings", icon: "mdi:cog-outline", path: "/admin/settings" },
    { label: "Logout", icon: "mdi:logout", action: "logout" },
  ];
  const managerItems = [
    { label: "Dashboard", icon: "mdi:view-dashboard-outline", path: "/manager/dashboard" },
    { label: "Team Leads", icon: "mdi:account-group-outline", path: "/manager/leads" },
    { label: "My Team", icon: "mdi:users", path: "/manager/team" },
    { label: "Profile", icon: "mdi:account-circle-outline", path: "/manager/profile" },
    { label: "Logout", icon: "mdi:logout", action: "logout" },
  ];
  const salesRepItems = [
    { label: "Dashboard", icon: "mdi:view-dashboard-outline", path: "/dashboard" },
    { label: "My Leads", icon: "mdi:account-tie-outline", path: "/leads" },
    { label: "Profile", icon: "mdi:account-circle-outline", path: "/profile" },
    { label: "Logout", icon: "mdi:logout", action: "logout" },
  ];

  let menuItems = [];
  if (role === "admin") menuItems = adminItems;
  else if (role === "manager") menuItems = managerItems;
  else if (role === "sales_rep") menuItems = salesRepItems;
  else menuItems = [{ label: "Logout", icon: "mdi:logout", action: "logout" }];

  // Panel transform classes (no opacity/visibility—pure translate like mobile drawer)
  const panelTransform = isHoverExpanded ? "translate-x-0 pointer-events-auto" : "-translate-x-64 pointer-events-none";

  return (
    <>
      {/* ===== Desktop (rail + sliding overlay) ===== */}
      <div
        className="hidden md:block md:fixed md:inset-y-0 md:left-0 md:z-50"
        onMouseEnter={openExpanded}
        onMouseLeave={closeExpanded}
        onFocusCapture={openExpanded}
        onBlurCapture={closeExpanded}
        aria-label="Primary navigation container"
      >
        {/* Collapsed rail (fixed width reserved by layout: w-16) */}
        <div className="h-full w-16 bg-white shadow-xl border-r flex flex-col relative z-40">
          {/* Favicon in collapsed header */}
          <div className="flex items-center justify-center p-4 border-b">
            <img src={favicon} alt="LeadHive" className="h-8 w-8 object-contain" />
          </div>
          {/* Icon-only rail menu */}
          <SidebarMenu menuItems={menuItems} isExpanded={false} />
        </div>

        {/* Sliding overlay panel (covers rail when open) */}
        <div
          className={`
            absolute top-0 left-0 h-full w-64 bg-white shadow-2xl border-r z-50
            transform transition-transform duration-300 ease-in-out
            ${panelTransform}
          `}
          aria-hidden={!isHoverExpanded}
        >
          <div className="flex items-center gap-3 p-4 border-b">
            {/* Full logo in expanded header */}
            <img src={logo} alt="LeadHive Logo" className="h-8 w-auto object-contain" />
          </div>
          <SidebarMenu menuItems={menuItems} isExpanded />
        </div>
      </div>

      {/* ===== Mobile drawer (unchanged) ===== */}
      <div
        className={`
          md:hidden fixed top-0 bottom-0 left-0 z-50 w-64 bg-white shadow-xl
          transform transition-transform duration-300 ease-in-out
          ${menuOpen ? "translate-x-0" : "-translate-x-64"}
        `}
        aria-hidden={!menuOpen}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-3">
            <img src={logo} alt="LeadHive Logo" className="h-8 w-auto object-contain" />
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            className="rounded p-2 hover:bg-gray-100 focus:outline-none focus:ring"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
        <SidebarMenu menuItems={menuItems} isExpanded />
      </div>
    </>
  );
};

export default Sidebar;
