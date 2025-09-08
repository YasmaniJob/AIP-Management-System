// src/lib/services/__tests__/user-context-service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userContextService } from '../user-context-service';
import { dataService } from '../data-service';
import type { UserContextInfo, IncidentContext } from '../../types/incident-context';

// Mock del dataService
vi.mock('../data-service', () => ({
  dataService: {
    findById: vi.fn(),
    findMany: vi.fn()
  }
}));

const mockDataService = vi.mocked(dataService);

describe('UserContextService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserContext', () => {
    it('should return complete user context when user exists', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'Juan Pérez',
        email: 'juan@example.com',
        grade_id: 'grade-1',
        section_id: 'section-1',
        area_id: 'area-1',
        grade: { id: 'grade-1', name: 'Primero' },
        section: { id: 'section-1', name: 'A' },
        area: { id: 'area-1', name: 'Docencia' }
      };

      const mockBookings = [
        {
          id: 'booking-1',
          activity: 'Matemáticas',
          date: '2024-01-15',
          grade: { name: 'Primero' },
          section: { name: 'A' }
        }
      ];

      mockDataService.findById.mockResolvedValue(mockUser);
      mockDataService.findMany.mockResolvedValue(mockBookings);

      const result = await userContextService.getUserContext('user-1');

      expect(result).toEqual({
        userId: 'user-1',
        userName: 'Juan Pérez',
        gradeId: 'grade-1',
        gradeName: 'Primero',
        sectionId: 'section-1',
        sectionName: 'A',
        areaId: 'area-1',
        areaName: 'Docencia',
        recentBookings: mockBookings
      });

      expect(mockDataService.findById).toHaveBeenCalledWith('users', 'user-1', {
        select: 'id, name, email, grade_id, section_id, area_id, grade:grades(id, name), section:sections(id, name), area:areas(id, name)'
      });
    });

    it('should handle user without grade/section/area', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'Admin User',
        email: 'admin@example.com',
        grade_id: null,
        section_id: null,
        area_id: null,
        grade: null,
        section: null,
        area: null
      };

      mockDataService.findById.mockResolvedValue(mockUser);
      mockDataService.findMany.mockResolvedValue([]);

      const result = await userContextService.getUserContext('user-1');

      expect(result).toEqual({
        userId: 'user-1',
        userName: 'Admin User',
        gradeId: null,
        gradeName: null,
        sectionId: null,
        sectionName: null,
        areaId: null,
        areaName: null,
        recentBookings: []
      });
    });

    it('should throw error when user not found', async () => {
      mockDataService.findById.mockRejectedValue(new Error('User not found'));

      await expect(userContextService.getUserContext('invalid-user'))
        .rejects.toThrow('User not found');
    });
  });

  describe('getIncidentContext', () => {
    it('should return incident context for user with complete info', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'Juan Pérez',
        grade_id: 'grade-1',
        section_id: 'section-1',
        area_id: 'area-1',
        grade: { id: 'grade-1', name: 'Primero' },
        section: { id: 'section-1', name: 'A' },
        area: { id: 'area-1', name: 'Docencia' }
      };

      const mockBookings = [
        {
          id: 'booking-1',
          activity: 'Matemáticas',
          date: '2024-01-15'
        }
      ];

      mockDataService.findById.mockResolvedValue(mockUser);
      mockDataService.findMany.mockResolvedValue(mockBookings);

      const result = await userContextService.getIncidentContext('user-1');

      expect(result).toEqual({
        gradeId: 'grade-1',
        sectionId: 'section-1',
        areaId: 'area-1',
        bookingContext: {
          activity: 'Matemáticas',
          activityDate: '2024-01-15'
        }
      });
    });

    it('should return context without booking when no recent bookings', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'Juan Pérez',
        grade_id: 'grade-1',
        section_id: 'section-1',
        area_id: 'area-1'
      };

      mockDataService.findById.mockResolvedValue(mockUser);
      mockDataService.findMany.mockResolvedValue([]);

      const result = await userContextService.getIncidentContext('user-1');

      expect(result).toEqual({
        gradeId: 'grade-1',
        sectionId: 'section-1',
        areaId: 'area-1',
        bookingContext: null
      });
    });
  });

  describe('getContextDisplayInfo', () => {
    it('should return formatted display info', async () => {
      const mockContext: UserContextInfo = {
        userId: 'user-1',
        userName: 'Juan Pérez',
        gradeId: 'grade-1',
        gradeName: 'Primero',
        sectionId: 'section-1',
        sectionName: 'A',
        areaId: 'area-1',
        areaName: 'Docencia',
        recentBookings: [
          {
            id: 'booking-1',
            activity: 'Matemáticas',
            date: '2024-01-15',
            grade: { name: 'Primero' },
            section: { name: 'A' }
          }
        ]
      };

      vi.spyOn(userContextService, 'getUserContext').mockResolvedValue(mockContext);

      const result = await userContextService.getContextDisplayInfo('user-1');

      expect(result).toEqual({
        teacherName: 'Juan Pérez',
        gradeSection: 'Primero A',
        area: 'Docencia',
        recentActivity: 'Matemáticas (15/01/2024)'
      });
    });

    it('should handle missing information gracefully', async () => {
      const mockContext: UserContextInfo = {
        userId: 'user-1',
        userName: 'Admin User',
        gradeId: null,
        gradeName: null,
        sectionId: null,
        sectionName: null,
        areaId: null,
        areaName: null,
        recentBookings: []
      };

      vi.spyOn(userContextService, 'getUserContext').mockResolvedValue(mockContext);

      const result = await userContextService.getContextDisplayInfo('user-1');

      expect(result).toEqual({
        teacherName: 'Admin User',
        gradeSection: 'N/A',
        area: 'N/A',
        recentActivity: 'N/A'
      });
    });
  });

  describe('validateContext', () => {
    it('should return true for valid context', () => {
      const validContext: IncidentContext = {
        gradeId: 'grade-1',
        sectionId: 'section-1',
        areaId: 'area-1',
        bookingContext: {
          activity: 'Matemáticas',
          activityDate: '2024-01-15'
        }
      };

      const result = userContextService.validateContext(validContext);
      expect(result).toBe(true);
    });

    it('should return true for context without booking', () => {
      const validContext: IncidentContext = {
        gradeId: 'grade-1',
        sectionId: 'section-1',
        areaId: 'area-1',
        bookingContext: null
      };

      const result = userContextService.validateContext(validContext);
      expect(result).toBe(true);
    });

    it('should return false for invalid context', () => {
      const invalidContext = {
        gradeId: null,
        sectionId: null,
        areaId: null,
        bookingContext: null
      } as IncidentContext;

      const result = userContextService.validateContext(invalidContext);
      expect(result).toBe(false);
    });
  });
});