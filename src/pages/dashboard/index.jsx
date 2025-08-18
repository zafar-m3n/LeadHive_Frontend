import React, { useEffect, useState } from "react";
import DefaultLayout from "@/layouts/DefaultLayout";
import API from "@/services/index";
import Notification from "@/components/ui/Notification";
import Spinner from "@/components/ui/Spinner";
import Table from "@/components/ui/Table";
import IconComponent from "@/components/ui/Icon";

const Dashboard = () => {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, lowStockRes] = await Promise.all([
        API.private.getDashboardStats(),
        API.private.getLowStockReport(),
      ]);

      if (statsRes.data.code === "OK") {
        setDashboardStats(statsRes.data.data);
      } else {
        Notification.error(statsRes.data.error || "Failed to fetch dashboard stats.");
      }

      if (lowStockRes.data.code === "OK") {
        setLowStockItems(lowStockRes.data.data.low_stock || []);
      } else {
        Notification.error(lowStockRes.data.error || "Failed to fetch low stock report.");
      }
    } catch (error) {
      Notification.error("Something went wrong while loading dashboard data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const stats = [
    {
      title: "Total Products",
      value: dashboardStats?.total_products,
      icon: "mdi:package-variant-closed",
    },
    {
      title: "Total Stock",
      value: dashboardStats?.total_stock,
      icon: "mdi:warehouse",
    },
    {
      title: "Low Stock Count",
      value: dashboardStats?.low_stock_count,
      icon: "mdi:alert-decagram-outline",
    },
    {
      title: "Categories",
      value: dashboardStats?.category_count,
      icon: "mdi:shape-outline",
    },
  ];

  const columns = [
    { key: "name", label: "Product Name" },
    { key: "code", label: "Code" },
    { key: "brand", label: "Brand" },
    { key: "cost", label: "Cost (Rs.)" },
    { key: "total_quantity", label: "Qty" },
  ];

  return (
    <DefaultLayout>
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-4"
                >
                  <div className="p-2 bg-accent/10 rounded-full">
                    <IconComponent icon={stat.icon} width={24} className="text-accent" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">{stat.title}</p>
                    <h2 className="text-xl font-bold text-gray-900">{stat.value}</h2>
                  </div>
                </div>
              ))}
            </div>

            {/* Low Stock Table */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800">Low Stock Items</h3>
              <Table columns={columns} data={lowStockItems} />
            </div>
          </>
        )}
      </div>
    </DefaultLayout>
  );
};

export default Dashboard;
