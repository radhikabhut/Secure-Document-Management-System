import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Building2, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from "@/features/departments/api";
import type { Department, CreateDepartmentRequest } from "@/types/department";

export function DepartmentsPage() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { register, handleSubmit, reset } = useForm<CreateDepartmentRequest>();

  const departmentsQuery = useQuery({
    queryKey: ["departments"],
    queryFn: getDepartments,
  });

  const createMutation = useMutation({
    mutationFn: createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department created successfully");
      setIsCreating(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create department");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateDepartmentRequest }) =>
      updateDepartment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department updated successfully");
      setEditingId(null);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update department");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete department");
    },
  });

  const onSubmit = (data: CreateDepartmentRequest) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (dept: Department) => {
    setEditingId(dept.id);
    setIsCreating(true);
    reset({ name: dept.name, description: dept.description });
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Departments
        </h1>
        <button
          className="inline-flex items-center justify-center rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
          onClick={() => setIsCreating(true)}
        >
          <Plus className="-ml-1 mr-2 h-4 w-4" />
          Add Department
        </button>
      </div>

      {isCreating && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-medium text-slate-900">
            {editingId ? "Edit Department" : "New Department"}
          </h2>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-sm font-medium text-slate-700">Name</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                {...register("name", { required: true })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Description</label>
              <textarea
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={3}
                {...register("description")}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50"
              >
                {editingId ? "Save Changes" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Created</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {departmentsQuery.data?.map((dept) => (
              <tr key={dept.id} className="hover:bg-slate-50 transition">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                  <div className="flex items-center">
                    <Building2 className="h-5 w-5 mr-3 text-slate-400" />
                    {dept.name}
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600">{dept.description || "-"}</td>
                <td className="px-6 py-4 text-slate-500">{new Date(dept.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right">
                  <button
                    className="text-blue-600 hover:text-blue-900 mr-4"
                    onClick={() => handleEdit(dept)}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    className="text-red-600 hover:text-red-900"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete this department?")) {
                        deleteMutation.mutate(dept.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {departmentsQuery.data?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  No departments found. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
