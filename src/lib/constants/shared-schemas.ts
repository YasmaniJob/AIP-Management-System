// src/lib/constants/shared-schemas.ts
import { z } from 'zod';

// ========== SHARED ENUMS ==========

// Resource categories - used across inventory system
export const RESOURCE_CATEGORIES = [
  'Laptops',
  'Tablets', 
  'Proyectores',
  'Cámaras Fotográficas',
  'Filmadoras',
  'Periféricos',
  'Redes',
  'Cables y Adaptadores',
  'Audio',
  'PCs de Escritorio',
  'Mobiliario',
  'Otros'
] as const;

// Resource status options
export const RESOURCE_STATUS = [
  'Disponible',
  'En Mantenimiento', 
  'Dañado'
] as const;

// Booking/Reservation types
export const BOOKING_TYPES = [
  'STUDENT',
  'INSTITUTIONAL'
] as const;

// Task status for meetings
export const TASK_STATUS = [
  'Pendiente',
  'En Progreso',
  'Completada'
] as const;

// Report types
export const REPORT_TYPES = [
  'overdue_loans',
  'maintenance_resources', 
  'loan_history',
  'full_inventory',
  'teachers_list',
  'reservations_history',
  'meetings_history'
] as const;

// Environment types
export const NODE_ENVIRONMENTS = [
  'development',
  'production',
  'test'
] as const;

// ========== SHARED ZOD SCHEMAS ==========

// Resource category enum schema
export const resourceCategorySchema = z.enum(RESOURCE_CATEGORIES);

// Resource status enum schema  
export const resourceStatusSchema = z.enum(RESOURCE_STATUS);

// Booking type enum schema
export const bookingTypeSchema = z.enum(BOOKING_TYPES);

// Task status enum schema
export const taskStatusSchema = z.enum(TASK_STATUS);

// Report type enum schema
export const reportTypeSchema = z.enum(REPORT_TYPES);

// Environment enum schema
export const nodeEnvironmentSchema = z.enum(NODE_ENVIRONMENTS);

// ========== COMMON FIELD SCHEMAS ==========

// Common name field (used in categories, areas, grades, etc.)
export const nameFieldSchema = z.string().min(3, 'El nombre debe tener al menos 3 caracteres.');

// Common email field
export const emailFieldSchema = z.string().email('Email inválido');

// Common DNI field
export const dniFieldSchema = z.string().min(8, 'DNI debe tener al menos 8 caracteres');

// Common password field
export const passwordFieldSchema = z.string().min(6, 'La contraseña debe tener al menos 6 caracteres');

// Common ID field
export const idFieldSchema = z.string();

// Common optional string field
export const optionalStringSchema = z.string().optional();

// Common required string field
export const requiredStringSchema = z.string().min(1, 'Este campo es requerido');

// ========== UTILITY FUNCTIONS ==========

// Check if a category is a tech category
export function isTechCategory(categoryType: string): boolean {
  return ['Laptops', 'Tablets', 'PCs de Escritorio'].includes(categoryType);
}

// Get singular form of category type
export function getSingularCategoryType(type: string): string {
  if (!type) return 'Recurso';
  if (type === 'Laptops') return 'Laptop';
  if (type.endsWith('es')) return type.slice(0, -2);
  if (type.endsWith('s')) return type.slice(0, -1);
  return type;
}

// Export types for TypeScript
export type ResourceCategory = typeof RESOURCE_CATEGORIES[number];
export type ResourceStatus = typeof RESOURCE_STATUS[number];
export type BookingType = typeof BOOKING_TYPES[number];
export type TaskStatus = typeof TASK_STATUS[number];
export type ReportType = typeof REPORT_TYPES[number];
export type NodeEnvironment = typeof NODE_ENVIRONMENTS[number];