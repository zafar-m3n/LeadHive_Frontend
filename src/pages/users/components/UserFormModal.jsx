import React, { useEffect } from "react";
import Modal from "@/components/ui/Modal";
import TextInput from "@/components/form/TextInput";
import PhoneInput from "@/components/form/PhoneInput";
import Select from "@/components/form/Select";
import AccentButton from "@/components/ui/AccentButton";
import GrayButton from "@/components/ui/GrayButton";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";

// ==========================
// Validation Schema
// ==========================
const schema = Yup.object().shape({
  full_name: Yup.string().required("Full name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string().when("isEdit", {
    is: false, // required only when adding
    then: (schema) => schema.min(6, "Minimum 6 characters").required("Password is required"),
    otherwise: (schema) => schema.notRequired(),
  }),
  role_id: Yup.string().required("Role is required"),
  phone: Yup.string().nullable(),
});

const UserFormModal = ({ isOpen, onClose, onSubmit, formData, setFormData, editingUser, roles, loading }) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { ...formData, isEdit: !!editingUser },
  });

  // Sync formData with RHF whenever modal opens
  useEffect(() => {
    reset({ ...formData, isEdit: !!editingUser });
  }, [formData, editingUser, reset]);

  const submitHandler = (data) => {
    onSubmit({
      ...data,
      phone: data.phone || null,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingUser ? "Edit User" : "Add User"} size="lg">
      <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
        <TextInput
          label="Full Name"
          placeholder="Enter full name"
          {...register("full_name")}
          error={errors.full_name?.message}
        />

        <TextInput
          label="Email"
          type="email"
          placeholder="Enter email"
          {...register("email")}
          error={errors.email?.message}
        />

        {!editingUser && (
          <TextInput
            label="Password"
            type="password"
            placeholder="Enter password"
            {...register("password")}
            error={errors.password?.message}
          />
        )}

        <Select
          label="Role"
          value={watch("role_id") || ""}
          onChange={(val) => setValue("role_id", val)}
          options={roles}
          placeholder="Select Role"
          error={errors.role_id?.message}
        />

        <PhoneInput
          label="Phone"
          value={watch("phone") || ""}
          onChange={(val) => setValue("phone", val)}
          error={errors.phone?.message}
        />

        <div className="pt-4 flex justify-end gap-3">
          <div className="w-fit">
            <GrayButton text="Cancel" onClick={onClose} />
          </div>
          <div className="w-fit">
            <AccentButton type="submit" text={editingUser ? "Update User" : "Create User"} loading={loading} />
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default UserFormModal;
