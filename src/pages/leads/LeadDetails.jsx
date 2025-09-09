// src/pages/admin/LeadDetails.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DefaultLayout from "@/layouts/DefaultLayout";
import API from "@/services/index";
import Notification from "@/components/ui/Notification";
import Spinner from "@/components/ui/Spinner";
import AccentButton from "@/components/ui/AccentButton";
import GrayButton from "@/components/ui/GrayButton";
import Icon from "@/components/ui/Icon";
import Badge from "@/components/ui/Badge";
import LeadFormModal from "./components/LeadFormModal";

/** ============================
 *  Helpers
 *  ============================ */
const initialsFromName = (first, last) => {
  try {
    if (first && last) {
      return (first[0] + last[0]).toUpperCase();
    }

    const name = first || last || "";
    if (!name) return "U";

    // Split by spaces, dots, or commas
    const parts = name.split(/[ ,\.]+/).filter(Boolean);

    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    // Only one part available → use first two letters
    return name.substring(0, 2).toUpperCase();
  } catch {
    return "U";
  }
};

const FieldRow = ({ label, value, icon }) => (
  <div className="flex items-start gap-3 py-2">
    {icon && <Icon icon={icon} width={20} className="mt-0.5 text-gray-500" />}
    <div className="min-w-0">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-gray-800 truncate">{value ?? "N/A"}</div>
    </div>
  </div>
);

/** ============================
 *  Component
 *  ============================ */
const LeadDetails = () => {
  const { id } = useParams();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(false);

  // Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Notes
  const [noteInput, setNoteInput] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);

  // Supporting data for modal
  const [statuses, setStatuses] = useState([]);
  const [sources, setSources] = useState([]);

  /** ============================
   *  Fetch lead + supporting data
   *  ============================ */
  const fetchLead = async () => {
    setLoading(true);
    try {
      const res = await API.private.getLeadById(id);
      if (res.data?.code === "OK") {
        setLead(res.data.data);
      } else {
        Notification.error("Failed to fetch lead details");
      }
    } catch (err) {
      Notification.error(err.response?.data?.error || "Failed to fetch lead");
    } finally {
      setLoading(false);
    }
  };

  const fetchStatusesAndSources = async () => {
    try {
      const [sRes, srcRes] = await Promise.all([API.private.getLeadStatuses(), API.private.getLeadSources()]);
      if (sRes.data?.code === "OK") {
        setStatuses(sRes.data.data.map((s) => ({ value: s.id, label: s.label })));
      }
      if (srcRes.data?.code === "OK") {
        setSources(srcRes.data.data.map((s) => ({ value: s.id, label: s.label })));
      }
    } catch {
      // silent fail
    }
  };

  useEffect(() => {
    if (id) {
      fetchLead();
      fetchStatusesAndSources();
    }
  }, [id]);

  /** ============================
   *  Save changes from modal
   *  ============================ */
  const handleSubmit = async (data) => {
    setSaving(true);
    try {
      await API.private.updateLead(id, data);
      Notification.success("Lead updated successfully");
      setIsModalOpen(false);
      await fetchLead();
    } catch (err) {
      Notification.error(err.response?.data?.error || "Failed to update lead");
    } finally {
      setSaving(false);
    }
  };

  /** ============================
   *  Add note
   *  ============================ */
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

  /** ============================
   *  Loading / not found states
   *  ============================ */
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

  /** ============================
   *  Render
   *  ============================ */
  return (
    <DefaultLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Lead Details</h1>
        <div className="w-fit">
          <AccentButton text="Edit Lead" onClick={() => setIsModalOpen(true)} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Info Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            {/* Avatar + Badges */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-accent/10 text-accent border border-accent/20 flex items-center justify-center text-xl font-semibold">
                {initials}
              </div>
              <div>
                <div className="text-xl font-semibold text-gray-800">
                  {lead.first_name} {lead.last_name}
                </div>
                <div className="inline-flex flex-wrap gap-2 mt-1">
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
            <div className="mt-6 divide-y divide-gray-100">
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
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-800">Notes</h2>

            {/* Notes List */}
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {lead.notes && lead.notes.length > 0 ? (
                lead.notes.map((note) => {
                  const authorInitials = initialsFromName(
                    note.author?.full_name,
                    note.author?.full_name?.split(" ").slice(-1)[0]
                  );
                  return (
                    <div
                      key={note.id}
                      className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition"
                    >
                      <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center font-semibold">
                        {authorInitials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800">{note.body}</p>
                        <div className="text-xs text-gray-500 mt-1">
                          by {note.author?.full_name || note.author?.email || "Unknown"} ·{" "}
                          {new Date(note.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500">No notes yet.</p>
              )}
            </div>

            {/* Add Note Form */}
            <div className="space-y-2">
              <textarea
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                rows={3}
                placeholder="Write a new note..."
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent shadow-sm"
              />
              <div className="flex justify-end gap-2">
                <GrayButton text="Clear" onClick={() => setNoteInput("")} disabled={submittingNote} />
                <AccentButton text="Add Note" onClick={handleAddNote} loading={submittingNote} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <LeadFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        editingLead={lead}
        statuses={statuses}
        sources={sources}
        loading={saving}
      />
    </DefaultLayout>
  );
};

export default LeadDetails;
