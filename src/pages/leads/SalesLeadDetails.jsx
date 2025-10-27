// src/pages/sales/SalesLeadDetails.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DefaultLayout from "@/layouts/DefaultLayout";
import API from "@/services/index";
import Notification from "@/components/ui/Notification";
import Spinner from "@/components/ui/Spinner";
import GrayButton from "@/components/ui/GrayButton";
import AccentButton from "@/components/ui/AccentButton";
import Icon from "@/components/ui/Icon";
import Badge from "@/components/ui/Badge";
import SalesLeadsModal from "./components/SalesLeadsModal";

/* ============================
 *  Helpers
 *  ============================ */
const initialsFromName = (first, last) => {
  try {
    if (!first && !last) return "U";
    if (first && last) return (first[0] + last[0]).toUpperCase();

    const name = first || last || "";
    const parts = name.split(/[\s.,]+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    if (name.length >= 2) return name.substring(0, 2).toUpperCase();
    return name[0]?.toUpperCase() || "U";
  } catch {
    return "U";
  }
};

const FieldRow = ({ label, value, icon }) => (
  <div className="flex items-start gap-3 py-3">
    {icon && (
      <span className="flex-shrink-0 p-2 bg-accent/10 rounded-md">
        <Icon icon={icon} width={18} className="text-accent" />
      </span>
    )}
    <div className="min-w-0">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-gray-900 font-medium truncate">{value ?? "N/A"}</div>
    </div>
  </div>
);

/* ============================
 *  Component
 *  ============================ */
const SalesLeadDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(false);

  // Notes
  const [noteInput, setNoteInput] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);

  // Status modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statuses, setStatuses] = useState([]);

  const fetchLead = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.private.getLeadById(id);
      if (res.data?.code === "OK") setLead(res.data.data);
      else Notification.error("Failed to fetch lead details");
    } catch (err) {
      Notification.error(err.response?.data?.error || "Failed to fetch lead");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchStatuses = useCallback(async () => {
    try {
      const res = await API.private.getLeadStatuses();
      if (res.data?.code === "OK") setStatuses(res.data.data.map((s) => ({ value: s.id, label: s.label })));
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchLead();
      fetchStatuses();
    }
  }, [id, fetchLead, fetchStatuses]);

  const handleAddNote = async () => {
    if (!noteInput.trim()) {
      Notification.error("Note cannot be empty");
      return;
    }
    setSubmittingNote(true);
    try {
      await API.private.updateLead(id, { notes: noteInput.trim() });
      Notification.success("Note added successfully");
      setNoteInput("");
      await fetchLead();
    } catch (err) {
      Notification.error(err.response?.data?.error || "Failed to add note");
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleStatusSubmit = async ({ status_id }) => {
    try {
      await API.private.updateLead(id, { status_id });
      Notification.success("Status updated successfully");
      setIsStatusModalOpen(false);
      navigate(-1);
    } catch (err) {
      Notification.error(err.response?.data?.error || "Failed to update status");
    }
  };

  if (loading) {
    return (
      <DefaultLayout>
        <Spinner message="Loading lead details..." />
      </DefaultLayout>
    );
  }

  if (!lead) {
    return (
      <DefaultLayout>
        <div className="p-6 text-center text-gray-600">Lead not found.</div>
      </DefaultLayout>
    );
  }

  const initials = initialsFromName(lead.first_name, lead.last_name);

  return (
    <DefaultLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
              <Icon icon="mdi:account-circle" width={30} className="text-accent" />
              Lead Details
            </h1>
            <p className="text-gray-500 text-sm mt-1">Review contact info, add notes, and update status.</p>
          </div>
          <div className="w-fit">
            <AccentButton text="Edit Status" size="sm" onClick={() => setIsStatusModalOpen(true)} />
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lead Info Card */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-b from-accent/10 to-white rounded-2xl border border-accent/20 p-6 shadow-md hover:shadow-lg transition-all duration-200">
              {/* Avatar + Badges */}
              <div className="flex items-center gap-4 border-b border-accent/10 pb-4">
                <div className="w-20 h-20 rounded-full bg-accent text-white flex items-center justify-center text-2xl font-semibold shadow-inner">
                  {initials}
                </div>
                <div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {lead.first_name} {lead.last_name}
                  </div>
                  <div className="inline-flex flex-wrap gap-2 mt-1 items-center">
                    <Badge text={lead.LeadStatus?.label || "No Status"} color="blue" size="sm" />
                    <Badge text={lead.LeadSource?.label || "No Source"} color="purple" size="sm" />
                    <Badge
                      text={lead.LeadAssignments?.[0]?.assignee?.full_name || "Unassigned"}
                      color="green"
                      size="sm"
                    />
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="mt-5 divide-y divide-gray-100">
                <FieldRow label="Company" value={lead.company || "N/A"} icon="mdi:office-building-outline" />
                <FieldRow label="Email" value={lead.email || "N/A"} icon="mdi:email-outline" />
                <FieldRow label="Phone" value={lead.phone || "N/A"} icon="mdi:phone-outline" />
                <FieldRow label="Country" value={lead.country || "N/A"} icon="mdi:earth" />
                <FieldRow label="Value" value={lead.value_decimal ?? "N/A"} icon="mdi:currency-usd" />
              </div>
            </div>
          </div>

          {/* Notes Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-md hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Icon icon="mdi:note-text-outline" width={22} className="text-accent" />
                  Notes
                </h2>
              </div>

              {/* Notes List */}
              <div className="space-y-4 max-h-[420px] overflow-y-auto app-scrollbar pr-2">
                {lead.notes && lead.notes.length > 0 ? (
                  lead.notes.map((note) => {
                    const authorInitials = initialsFromName(
                      note.author?.full_name,
                      note.author?.full_name?.split(" ").slice(-1)[0]
                    );
                    return (
                      <div
                        key={note.id}
                        className="flex items-start gap-4 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-all"
                      >
                        <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center font-semibold">
                          {authorInitials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 leading-relaxed">{note.body}</p>
                          <div className="text-xs text-gray-500 mt-1">
                            by {note.author?.full_name || note.author?.email || "Unknown"} ·{" "}
                            {new Date(note.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500 italic text-center py-4">No notes yet.</p>
                )}
              </div>

              {/* Add Note Form */}
              <div className="mt-6 space-y-3">
                <textarea
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  rows={3}
                  placeholder="Write a new note..."
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent shadow-sm"
                />
                <div className="flex justify-end gap-2">
                  <div className="w-fit">
                    <GrayButton text="Clear" onClick={() => setNoteInput("")} disabled={submittingNote} />
                  </div>
                  <div className="w-fit">
                    <AccentButton text="Add Note" onClick={handleAddNote} loading={submittingNote} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Modal */}
      <SalesLeadsModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onSubmit={handleStatusSubmit}
        editingLead={lead}
        statuses={statuses}
        loading={loading}
      />
    </DefaultLayout>
  );
};

export default SalesLeadDetails;
