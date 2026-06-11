import { api } from "@/lib/api";
import { Department, CreateDepartmentRequest, UpdateDepartmentRequest } from "@/types/department";

interface BackendDepartment {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

const mapDepartment = (data: BackendDepartment): Department => ({
  id: data.id,
  name: data.name,
  description: data.description,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

export const getDepartments = async (): Promise<Department[]> => {
  const response = await api.get<BackendDepartment[]>("/departments");
  return response.data.map(mapDepartment);
};

export const getDepartment = async (id: string): Promise<Department> => {
  const response = await api.get<BackendDepartment>(`/departments/${id}`);
  return mapDepartment(response.data);
};

export const createDepartment = async (request: CreateDepartmentRequest): Promise<Department> => {
  const response = await api.post<BackendDepartment>("/departments", request);
  return mapDepartment(response.data);
};

export const updateDepartment = async (id: string, request: UpdateDepartmentRequest): Promise<Department> => {
  const response = await api.put<BackendDepartment>(`/departments/${id}`, request);
  return mapDepartment(response.data);
};

export const deleteDepartment = async (id: string): Promise<void> => {
  await api.delete(`/departments/${id}`);
};
