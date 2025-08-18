import React, { useEffect } from "react";
import Modal from "@/components/ui/Modal";
import TextInput from "@/components/form/TextInput";
import Select from "@/components/form/Select";
import MultiSelect from "@/components/form/MultiSelect";
import AccentButton from "@/components/ui/AccentButton";
import GrayButton from "@/components/ui/GrayButton";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";

// ==========================
// Validation Schema
// ==========================
const schema = Yup.object().shape({
  name: Yup.string().required("Team name is required"),
  // manager_id can arrive as string from <Select>, so validate presence and coerce on submit
  manager_id: Yup.mixed().required("Manager is required"),
  // members must be an array of numbers (IDs)
  members: Yup.array().of(Yup.number().typeError("Invalid member")).default([]),
});

/**
 * NOTE:
 * - Pass `memberOptions` from parent:
 *   → It must include BOTH unassigned reps and current team members when editing.
 * - If you only pass unassigned reps, current members won't be selectable or shown.
 */
const TeamFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  editingTeam,
  managers,
  memberOptions = [], // <-- merged options (unassigned + current members)
  loading,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      manager_id: "",
      members: [],
    },
  });

  // Normalize to numbers to match option values
  const toNumbers = (arr) => (Array.isArray(arr) ? arr.map((v) => Number(v)) : []);

  // Reset form whenever modal opens with editing data
  useEffect(() => {
    if (editingTeam) {
      reset({
        name: editingTeam.name || "",
        manager_id: editingTeam.manager_id ?? "",
        members: toNumbers(editingTeam.members || []),
      });
    } else {
      reset({ name: "", manager_id: "", members: [] });
    }
  }, [editingTeam, reset]);

  const submitHandler = (data) => {
    // Coerce types safely before sending to API
    const payload = {
      ...data,
      manager_id: Number(data.manager_id),
      members: toNumbers(data.members),
    };
    onSubmit(payload);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingTeam ? "Edit Team" : "Add Team"} size="lg">
      <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
        <TextInput label="Team Name" placeholder="Enter team name" {...register("name")} error={errors.name?.message} />

        <Select
          label="Manager"
          value={watch("manager_id") ?? ""}
          onChange={(val) => setValue("manager_id", val)}
          options={managers}
          placeholder="Select Manager"
          error={errors.manager_id?.message}
        />

        {/* IMPORTANT:
            MultiSelect expects `value` to be an array of IDs.
            We pass RHF's members (array of numbers).
            Options MUST include current members when editing.
        */}
        <MultiSelect
          label="Members"
          value={watch("members") || []}
          onChange={(ids) => setValue("members", ids)}
          options={memberOptions}
          placeholder="Select Sales Reps"
          error={errors.members?.message}
        />

        <div className="pt-4 flex justify-end gap-3">
          <div className="w-fit">
            <GrayButton text="Cancel" onClick={onClose} />
          </div>
          <div className="w-fit">
            <AccentButton type="submit" text={editingTeam ? "Update Team" : "Create Team"} loading={loading} />
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default TeamFormModal;
