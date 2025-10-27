import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DefaultLayout from "@/layouts/DefaultLayout";
import API from "@/services/index";
import Notification from "@/components/ui/Notification";
import Spinner from "@/components/ui/Spinner";
import AccentButton from "@/components/ui/AccentButton";
import GrayButton from "@/components/ui/GrayButton";
import Icon from "@/components/ui/Icon";
import Badge from "@/components/ui/Badge";
import LeadFormModal from "./components/LeadFormModal";
import Modal from "@/components/ui/Modal";
import Tooltip from "@/components/ui/Tooltip";
import token from "@/lib/utilities";

/* -----------------------------
   Helpers
----------------------------- */
const initialsFromName = (first, last) => {
  try {
    if (first && last) return (first[0] + last[0]).toUpperCase();
    const name = first || last || "";
    if (!name) return "U";
    const parts = name.split(/[ ,\.]+/).filter(Boolean);
    if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  } catch {
    return "U";
  }
};

const FieldRow = ({ label, value, icon }) => (
  <div className="flex items-start gap-3 py-3">
    {icon && (
      <div className="flex-shrink-0 p-2 bg-accent/10 rounded-md">
        <Icon icon={icon} width={18} className="text-accent" />
      </div>
    )}
    <div className="min-w-0">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-gray-900 font-medium truncate">{value ?? "N/A"}</div>
    </div>
  </div>
);

/* -----------------------------
   Confirm Delete Note Modal
----------------------------- */
const ConfirmDeleteNoteModal = ({ isOpen, note, onCancel, onConfirm }) => {
  if (!note) return null;
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Delete Note" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-700 leading-relaxed">
          Are you sure you want to delete this note?
          <br />
          <span className="text-gray-600 text-xs block mt-1 truncate italic">
            “{note.body.substring(0, 120)}
            {note.body.length > 120 ? "..." : ""}”
          </span>
        </p>

        <div className="flex justify-end gap-3 pt-2">
          <div className="w-fit">
            <GrayButton text="Cancel" onClick={onCancel} />
          </div>
          <div className="w-fit">
            <AccentButton text="Delete" onClick={onConfirm} customClass="!bg-red-600 hover:!bg-red-700" />
          </div>
        </div>
      </div>
    </Modal>
  );
};

/* -----------------------------
   Main Component
----------------------------- */
const LeadDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(false);

  // Edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Notes
  const [noteInput, setNoteInput] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [isDeleteNoteModalOpen, setIsDeleteNoteModalOpen] = useState(false);

  // Supporting data
  const [statuses, setStatuses] = useState([]);
  const [sources, setSources] = useState([]);

  // Current user + role
  const me = token.getUserData();
  const role = me?.role?.value;
  const isAdminOrManager = role === "admin" || role === "manager";

  /* -----------------------------
     Data Fetch
  ----------------------------- */
  const fetchLead = async () => {
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
  };

  const fetchStatusesAndSources = async () => {
    try {
      const [sRes, srcRes] = await Promise.all([API.private.getLeadStatuses(), API.private.getLeadSources()]);
      if (sRes.data?.code === "OK") setStatuses(sRes.data.data.map((s) => ({ value: s.id, label: s.label })));
      if (srcRes.data?.code === "OK") setSources(srcRes.data.data.map((s) => ({ value: s.id, label: s.label })));
    } catch {}
  };

  useEffect(() => {
    if (id) {
      fetchLead();
      fetchStatusesAndSources();
    }
  }, [id]);

  /* -----------------------------
     Update Lead
  ----------------------------- */
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

  /* -----------------------------
     Add Note
  ----------------------------- */
  const handleAddNote = async () => {
    if (!noteInput.trim()) return Notification.error("Note cannot be empty");
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

  /* -----------------------------
     Delete Note
  ----------------------------- */
  const confirmDeleteNote = (note) => {
    setNoteToDelete(note);
    setIsDeleteNoteModalOpen(true);
  };

  const handleDeleteNote = async () => {
    if (!noteToDelete) return;
    try {
      await API.private.deleteLeadNote(id, noteToDelete.id);
      Notification.success("Note deleted successfully");
      await fetchLead();
    } catch (err) {
      Notification.error(err.response?.data?.error || "Failed to delete note");
    } finally {
      setIsDeleteNoteModalOpen(false);
      setNoteToDelete(null);
    }
  };

  /* -----------------------------
     Render States
  ----------------------------- */
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

  /* -----------------------------
     Render UI
  ----------------------------- */
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
            <p className="text-gray-500 text-sm mt-1">Manage contact info, view notes, and update activity.</p>
          </div>
          <div className="w-fit">
            <AccentButton text="Edit Lead" onClick={() => setIsModalOpen(true)} />
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lead Card */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-b from-accent/10 to-white rounded-2xl border border-accent/20 p-6 shadow-md hover:shadow-lg transition-all duration-200">
              <div className="flex items-center gap-4 border-b border-accent/10 pb-4">
                <div className="w-20 h-20 rounded-full bg-accent text-white flex items-center justify-center text-2xl font-semibold shadow-inner">
                  {initials}
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {lead.first_name} {lead.last_name}
                  </h2>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Badge text={lead.LeadStatus?.label || "No Status"} color="blue" size="sm" />
                    <Badge text={lead.LeadSource?.label || "No Source"} color="purple" size="sm" />
                  </div>
                </div>
              </div>

              <div className="mt-5 divide-y divide-gray-100">
                <FieldRow label="Company" value={lead.company} icon="mdi:office-building-outline" />
                <FieldRow label="Email" value={lead.email} icon="mdi:email-outline" />
                <FieldRow label="Phone" value={lead.phone} icon="mdi:phone-outline" />
                <FieldRow label="Country" value={lead.country} icon="mdi:earth" />
                <FieldRow label="Lead Value" value={lead.value_decimal} icon="mdi:currency-usd" />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-md hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Icon icon="mdi:note-text-outline" width={22} className="text-accent" />
                  Notes
                </h2>
              </div>

              <div className="space-y-4 max-h-[420px] overflow-y-auto app-scrollbar pr-2">
                {lead.notes?.length ? (
                  lead.notes.map((note) => {
                    const authorInitials = initialsFromName(
                      note.author?.full_name,
                      note.author?.full_name?.split(" ").slice(-1)[0]
                    );
                    return (
                      <div
                        key={note.id}
                        className="group flex items-start justify-between gap-4 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-all"
                      >
                        <div className="flex gap-3">
                          <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center font-semibold">
                            {authorInitials}
                          </div>
                          <div>
                            <p className="text-sm text-gray-800 leading-relaxed">{note.body}</p>
                            <div className="text-xs text-gray-500 mt-1">
                              by {note.author?.full_name || "Unknown"} · {new Date(note.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {isAdminOrManager && (
                          <Tooltip content="Delete note" placement="top" theme="light">
                            <button
                              onClick={() => confirmDeleteNote(note)}
                              className="opacity-70 group-hover:opacity-100 inline-flex items-center justify-center p-2 rounded-md border border-gray-200 hover:bg-red-50 hover:text-red-600 transition"
                              aria-label="Delete note"
                            >
                              <Icon icon="mdi:delete-outline" width={18} />
                            </button>
                          </Tooltip>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500 italic text-center py-4">No notes added yet.</p>
                )}
              </div>

              {/* Add Note */}
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

      {/* Modals */}
      <LeadFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        editingLead={lead}
        statuses={statuses}
        sources={sources}
        loading={saving}
      />

      <ConfirmDeleteNoteModal
        isOpen={isDeleteNoteModalOpen}
        note={noteToDelete}
        onCancel={() => setIsDeleteNoteModalOpen(false)}
        onConfirm={handleDeleteNote}
      />
    </DefaultLayout>
  );
};

export default LeadDetails;
