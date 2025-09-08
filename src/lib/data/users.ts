// src/lib/data/users.ts
'use server';

import { dataService } from '../services/data-service';
import type { User, SystemSettings } from '../types';
import { USER_ROLES } from '../types';

interface GetUsersParams {
    role?: typeof USER_ROLES[number];
}

export async function getUsers({ role }: GetUsersParams = {}): Promise<User[]> {
  const filters = role ? { role } : undefined;
  
  return await dataService.findMany('users', {
    filters,
    orderBy: { name: 'asc' }
  });
}


export async function getAllUsers(): Promise<User[]> {
    return getUsers();
}

export async function getAllTeachers(): Promise<User[]> {
    return getUsers({ role: 'Docente' });
}
