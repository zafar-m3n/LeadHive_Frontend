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
  manager_id: Yup.string().required("Manager is required"),
  members: Yup.array().of(Yup.string()),
});

const TeamFormModal = ({ isOpen, onClose, onSubmit, editingTeam, managers, salesReps, loading }) => {
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

  // Reset form whenever modal opens with editing data
  useEffect(() => {
    if (editingTeam) {
      reset({
        name: editingTeam.name || "",
        manager_id: editingTeam.manager_id || "",
        members: editingTeam.members || [],
      });
    } else {
      reset({ name: "", manager_id: "", members: [] });
    }
  }, [editingTeam, reset]);

  const submitHandler = (data) => {
    onSubmit(data);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingTeam ? "Edit Team" : "Add Team"} size="lg">
      <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
        <TextInput label="Team Name" placeholder="Enter team name" {...register("name")} error={errors.name?.message} />

        <Select
          label="Manager"
          value={watch("manager_id") || ""}
          onChange={(val) => setValue("manager_id", val)}
          options={managers}
          placeholder="Select Manager"
          error={errors.manager_id?.message}
        />

        <MultiSelect
          label="Members"
          value={watch("members") || []}
          onChange={(val) => setValue("members", val)}
          options={salesReps}
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
