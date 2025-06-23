import { useState } from "react";

export function useTableSearch<T extends object>(defaultFilters: T) {
  const [filters, setFilters] = useState<T>({ ...defaultFilters });

  const handleFilterChange = <K extends keyof T>(field: K, value: T[K]) => {
    setFilters((prev) => ({
        ...prev,
        [field]: value,
        }));
    };


  const handleReset = () => {
    setFilters({ ...defaultFilters });
  };

  return {
    filters,
    setFilters,
    handleFilterChange,
    handleReset,
  };
}
