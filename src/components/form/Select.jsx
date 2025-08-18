import React from "react";
import SelectLib from "react-select";

const Select = ({ value, onChange, options = [], placeholder = "Select", error, label, ...rest }) => {
  const customStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: "#fff",
      borderColor: error ? "#f87171" : state.isFocused ? "#f59e0b" : "#d1d5db",
      boxShadow: "none",
      color: "#111827",
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: "#fff",
      color: "#111827",
      zIndex: 50,
    }),
    singleValue: (base) => ({
      ...base,
      color: "#111827",
    }),
    option: (base, { isFocused }) => ({
      ...base,
      backgroundColor: isFocused ? "#f59e0b" : "#fff",
      color: "#111827",
      cursor: "pointer",
    }),
    placeholder: (base) => ({
      ...base,
      color: "#6b7280",
    }),
  };

  return (
    <div className="w-full">
      {label && <label className="block mb-1 text-sm font-medium text-gray-800">{label}</label>}
      <SelectLib
        options={options}
        value={options.find((opt) => opt.value === value) || null}
        onChange={(selected) => onChange(selected?.value || "")}
        placeholder={placeholder}
        styles={customStyles}
        classNamePrefix="react-select"
        {...rest}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default Select;
