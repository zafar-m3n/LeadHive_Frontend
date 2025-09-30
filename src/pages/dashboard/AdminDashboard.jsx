import React, { useEffect, useMemo, useState } from "react";
import DefaultLayout from "@/layouts/DefaultLayout";
import API from "@/services/index";
import Notification from "@/components/ui/Notification";
import Heading from "@/components/ui/Heading";
import Table from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import { getStatusColor, getSourceColor } from "@/utils/leadColors";

import {
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#A3E635", "#FB7185"];

const AdminDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await API.private.getAdminDashboardSummary({ recentLimit: 5 });
      setSummary(res.data?.data || null);
    } catch (err) {
      Notification.error(err.response?.data?.error || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  // ------ chart data shaping ------
  const leadsBySourceData = useMemo(() => {
    if (!summary?.leadsBySource) return [];
    return summary.leadsBySource.map((row) => ({
      label: row["LeadSource.label"] || row?.LeadSource?.label || "Unknown",
      count: Number(row.count || 0),
    }));
  }, [summary]);

  const leadsByStatusPie = useMemo(() => {
    if (!summary?.leadsByStatus) return [];
    return summary.leadsByStatus.map((row) => ({
      name: row["LeadStatus.label"] || row?.LeadStatus?.label || "Unknown", // for Legend
      value: Number(row.count || 0), // for Pie
    }));
  }, [summary]);

  const recentLeads = summary?.recentLeads || [];

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "company", label: "Company" },
    { key: "status", label: "Status" },
    { key: "source", label: "Source" },
    { key: "created_at", label: "Created" },
  ];

  return (
    <DefaultLayout>
      <div className="space-y-6">
        {/* Heading */}
        <div className="flex justify-between items-center">
          <Heading>Admin Dashboard</Heading>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="rounded-xl border border-gray-200 p-4 bg-white">
            <div className="text-sm text-gray-500">Total Leads</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">{loading ? "—" : summary?.totalLeads ?? 0}</div>
          </div>
          <div className="rounded-xl border border-gray-200 p-4 bg-white">
            <div className="text-sm text-gray-500">New This Week</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">{loading ? "—" : summary?.newThisWeek ?? 0}</div>
          </div>
          <div className="rounded-xl border border-gray-200 p-4 bg-white">
            <div className="text-sm text-gray-500">Unassigned Leads</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">
              {loading ? "—" : summary?.unassignedLeads ?? 0}
            </div>
          </div>
        </div>

        {/* Charts row: side-by-side cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Leads per Status (Donut) - LEFT */}
          <section className="rounded-xl border border-gray-200 p-5 bg-white">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Leads per Status</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                  <Pie
                    data={leadsByStatusPie}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius="50%"
                    outerRadius="80%"
                  >
                    {leadsByStatusPie.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Leads per Source (Bar) - RIGHT */}
          <section className="rounded-xl border border-gray-200 p-5 bg-white">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Leads per Source</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadsBySourceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  {/* specify a fill color to avoid default black */}
                  <Bar dataKey="count" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        {/* Recent Leads */}
        {/* <section className="rounded-xl border border-gray-200 p-5 bg-white">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Leads (5)</h2>
          <Table
            columns={columns}
            data={recentLeads.map((l) => ({
              id: l.id,
              name: [l.first_name, l.last_name].filter(Boolean).join(" ") || "-",
              email: l.email || "-",
              company: l.company || "-",
              status: l.LeadStatus?.value || l.LeadStatus?.label || "-",
              source: l.LeadSource?.value || l.LeadSource?.label || "-",
              created_at: l.created_at,
            }))}
            emptyMessage={loading ? "Loading..." : "No recent leads found."}
            renderCell={(row, col) => {
              switch (col.key) {
                case "status":
                  return (
                    <Badge text={row.status} color={getStatusColor(row.status)} size="sm" rounded="rounded" />
                  );
                case "source":
                  return (
                    <Badge text={row.source} color={getSourceColor(row.source)} size="sm" rounded="rounded" />
                  );
                case "created_at":
                  return new Date(row.created_at).toLocaleString();
                default:
                  return row[col.key] || "-";
              }
            }}
          />
        </section> */}
      </div>
    </DefaultLayout>
  );
};

export default AdminDashboard;
