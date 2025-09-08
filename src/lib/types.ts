// src/lib/types.ts
import type { Database } from './supabase/database.types';

// Profile
export type User = Omit<Database['public']['Tables']['users']['Row'], 'avatar'>;

export const USER_ROLES = [
    "Administrador",
    "Docente",
] as const;

// Settings
export type Area = Database['public']['Tables']['areas']['Row'];
export type Grade = Database['public']['Tables']['grades']['Row'];
export type Section = Database['public']['Tables']['sections']['Row'];
export type PedagogicalHour = Database['public']['Tables']['pedagogical_hours']['Row'];
export type SystemSettings = Database['public']['Tables']['system_settings']['Row'];

export type GradeWithSections = Grade & {
  sections: Section[];
};

// Inventory
export type Category = Database['public']['Tables']['categories']['Row'];
export type Resource = Database['public']['Tables']['resources']['Row'];
export type CategoryWithStats = Category & {
  resourceCount: number;
  availableCount: number;
};

// Loans
export type Loan = Database['public']['Tables']['loans']['Row'];
export type LoanResource = Database['public']['Tables']['loan_resources']['Row'];
export type LoanWithResources = Loan & {
    resources: Resource[];
    user: User;
    area: Area;
    grade: Grade;
    section: Section;
};


// Bookings
export type Booking = Database['public']['Tables']['bookings']['Row'] & {
    area?: { name: string };
    teacher?: { name: string };
    grade?: { name: string };
    section?: { name: string };
};


// Meetings
export type Meeting = Database['public']['Tables']['meetings']['Row'];
export type MeetingTask = Database['public']['Tables']['meeting_tasks']['Row'];
export type MeetingParticipantGroup = Database['public']['Tables']['meeting_participant_groups']['Row'];

export type MeetingWithDetails = Omit<Meeting, 'participant_groups'> & {
    tasks: Array<MeetingTask & { responsible: User }>;
    participant_groups: string[];
};
