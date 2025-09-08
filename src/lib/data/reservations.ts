
// src/lib/data/reservations.ts
'use server';

import { dataService } from "../services/data-service";
import type { Booking } from "../types";

interface GetBookingsParams {
    startDate?: string;
    endDate?: string;
    teacherId?: string;
    perPage?: number;
    page?: number;
}

export async function getBookings({ startDate, endDate, teacherId, perPage, page }: GetBookingsParams): Promise<Booking[]> {
    const filters: any = {};
    
    if (startDate) filters.date = { ...filters.date, gte: startDate };
    if (endDate) filters.date = { ...filters.date, lte: endDate };
    if (teacherId) filters.teacher_id = teacherId;

    const options: any = {
        select: `
            *,
            area:areas (name),
            teacher:users (name),
            grade:grades (name),
            section:sections (name),
            pedagogical_hours (name)
        `,
        filters: Object.keys(filters).length > 0 ? filters : undefined
    };

    if (perPage && page) {
        options.pagination = {
            page,
            perPage
        };
    }

    const data = await dataService.findMany('bookings', options);

    return data.map((b: any) => ({
        ...b,
        area: b.area?.name, // Flatten for easier access on client
        teacher: b.teacher,
    })) as Booking[];
}

    