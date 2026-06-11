import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from './api';

const mockBackendDepartment = {
  id: '1',
  name: 'Engineering',
  description: 'Engineering Department',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

const mockDepartment = {
  id: '1',
  name: 'Engineering',
  description: 'Engineering Department',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

const API_URL = import.meta.env.VITE_API_BASE_URL || '/api';

describe('Departments API', () => {
  it('should fetch all departments', async () => {
    server.use(
      http.get(`${API_URL}/departments`, () => {
        return HttpResponse.json({
          success: true,
          message: 'Success',
          data: [mockBackendDepartment],
        });
      })
    );

    const departments = await getDepartments();
    expect(departments).toEqual([mockDepartment]);
  });

  it('should fetch a single department', async () => {
    server.use(
      http.get(`${API_URL}/departments/:id`, ({ params }) => {
        expect(params.id).toBe('1');
        return HttpResponse.json({
          success: true,
          message: 'Success',
          data: mockBackendDepartment,
        });
      })
    );

    const department = await getDepartment('1');
    expect(department).toEqual(mockDepartment);
  });

  it('should create a department', async () => {
    const payload = { name: 'HR', description: 'Human Resources' };
    
    server.use(
      http.post(`${API_URL}/departments`, async ({ request }) => {
        const body = await request.json();
        expect(body).toEqual(payload);
        return HttpResponse.json({
          success: true,
          message: 'Created',
          data: {
            id: '2',
            name: 'HR',
            description: 'Human Resources',
            created_at: '2023-02-01T00:00:00Z',
            updated_at: '2023-02-01T00:00:00Z',
          },
        });
      })
    );

    const created = await createDepartment(payload);
    expect(created).toEqual({
      id: '2',
      name: 'HR',
      description: 'Human Resources',
      createdAt: '2023-02-01T00:00:00Z',
      updatedAt: '2023-02-01T00:00:00Z',
    });
  });

  it('should update a department', async () => {
    const payload = { description: 'Updated Department' };
    
    server.use(
      http.put(`${API_URL}/departments/:id`, async ({ request, params }) => {
        expect(params.id).toBe('1');
        const body = await request.json();
        expect(body).toEqual(payload);
        return HttpResponse.json({
          success: true,
          message: 'Updated',
          data: {
            ...mockBackendDepartment,
            description: 'Updated Department',
          },
        });
      })
    );

    const updated = await updateDepartment('1', payload);
    expect(updated).toEqual({
      ...mockDepartment,
      description: 'Updated Department',
    });
  });

  it('should delete a department', async () => {
    server.use(
      http.delete(`${API_URL}/departments/:id`, ({ params }) => {
        expect(params.id).toBe('1');
        return HttpResponse.json({
          success: true,
          message: 'Deleted',
          data: null,
        });
      })
    );

    await expect(deleteDepartment('1')).resolves.toBeUndefined();
  });
});
