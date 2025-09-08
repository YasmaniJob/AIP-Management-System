// src/lib/data/teacher-dashboard.ts
'use server';

import { dataService } from "../services/data-service";
import { format, startOfDay, addDays, subDays, parseISO, isToday, isTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';

export async function getTeacherDashboardStats(teacherId: string) {
    const today = format(startOfDay(new Date()), 'yyyy-MM-dd');
    const tomorrow = format(startOfDay(addDays(new Date(), 1)), 'yyyy-MM-dd');
    const nextWeek = format(startOfDay(addDays(new Date(), 7)), 'yyyy-MM-dd');

    const [totalBookings, todayBookings, upcomingBookings, activeLoans, overdueLoans] = await Promise.all([
        // Total de reservas del docente
        dataService.count('bookings', { teacher_id: teacherId }),
        
        // Reservas de hoy
        dataService.count('bookings', { 
            teacher_id: teacherId,
            date: today
        }),
        
        // Reservas próximas (próximos 7 días)
        dataService.count('bookings', { 
            teacher_id: teacherId,
            date: { gte: tomorrow, lte: nextWeek }
        }),
        
        // Préstamos activos del docente
        dataService.count('loans', { 
            teacher_id: teacherId,
            status: 'Activo'
        }),
        
        // Préstamos atrasados del docente
        dataService.count('loans', { 
            teacher_id: teacherId,
            status: 'Atrasado'
        })
    ]);

    return {
        totalBookings,
        todayBookings,
        upcomingBookings,
        activeLoans,
        overdueLoans,
    };
}

export async function getTeacherUpcomingBookings(teacherId: string, limit: number = 5) {
    const today = format(startOfDay(new Date()), 'yyyy-MM-dd');
    
    const bookings = await dataService.findMany('bookings', {
        select: `
            *,
            area:areas (name),
            grade:grades (name),
            section:sections (name),
            pedagogical_hours (name, hour_order)
        `,
        filters: {
            teacher_id: teacherId,
            date: { gte: today }
        },
        orderBy: { date: 'asc', hour_id: 'asc' },
        limit
    });

    return bookings.map((booking: any) => ({
        ...booking,
        area: booking.area?.name,
        grade: booking.grade?.name,
        section: booking.section?.name,
        hour: booking.pedagogical_hours?.name,
        hourOrder: booking.pedagogical_hours?.hour_order,
        isToday: isToday(parseISO(booking.date)),
        isTomorrow: isTomorrow(parseISO(booking.date)),
        formattedDate: format(parseISO(booking.date), "EEEE, dd 'de' MMMM", { locale: es })
    }));
}

export async function getTeacherActiveLoans(teacherId: string, limit: number = 5) {
    const loans = await dataService.findMany('loans', {
        select: `
            *,
            area:areas (name),
            grade:grades (name),
            section:sections (name),
            loan_resources (
                resources (
                    *,
                    category:categories(type, name, color)
                )
            )
        `,
        filters: {
            teacher_id: teacherId,
            status: ['Activo', 'Atrasado']
        },
        orderBy: { created_at: 'desc' },
        limit
    });

    return loans.map((loan: any) => {
        const resources = loan.loan_resources.map((lr: any) => ({
            ...lr.resources,
            categoryName: lr.resources.category?.name,
            categoryColor: lr.resources.category?.color
        }));
        
        return {
            ...loan,
            area: loan.area?.name,
            grade: loan.grade?.name,
            section: loan.section?.name,
            resources,
            formattedLoanDate: format(parseISO(loan.created_at), "dd 'de' MMM, yyyy", { locale: es }),
            isOverdue: loan.status === 'Atrasado'
        };
    });
}

export async function getTeacherWeeklyActivity(teacherId: string) {
    const today = new Date();
    const sevenDaysAgo = subDays(today, 7);

    // Obtener reservas de la última semana
    const bookings = await dataService.findMany('bookings', {
        select: 'date',
        filters: {
            teacher_id: teacherId,
            date: { gte: format(sevenDaysAgo, 'yyyy-MM-dd') }
        }
    });

    // Obtener préstamos de la última semana
    const loans = await dataService.findMany('loans', {
        select: 'created_at',
        filters: {
            teacher_id: teacherId,
            created_at: { gte: format(sevenDaysAgo, 'yyyy-MM-dd') }
        }
    });

    const dailyCounts = {};
    
    // Contar reservas por día
    bookings.forEach((booking: any) => {
        const date = booking.date;
        if (!dailyCounts[date]) dailyCounts[date] = { bookings: 0, loans: 0 };
        dailyCounts[date].bookings += 1;
    });
    
    // Contar préstamos por día
    loans.forEach((loan: any) => {
        const date = format(parseISO(loan.created_at), 'yyyy-MM-dd');
        if (!dailyCounts[date]) dailyCounts[date] = { bookings: 0, loans: 0 };
        dailyCounts[date].loans += 1;
    });

    // Llenar días faltantes con 0
    const result = [];
    for (let i = 6; i >= 0; i--) {
        const date = format(subDays(today, i), 'yyyy-MM-dd');
        const dayName = format(subDays(today, i), 'EEE', { locale: es });
        result.push({
            date,
            day: dayName,
            bookings: dailyCounts[date]?.bookings || 0,
            loans: dailyCounts[date]?.loans || 0,
            total: (dailyCounts[date]?.bookings || 0) + (dailyCounts[date]?.loans || 0)
        });
    }

    return result;
}

export async function getTeacherResourceUsage(teacherId: string) {
    const loans = await dataService.findMany('loans', {
        select: `
            loan_resources (
                resources (
                    category:categories(name, color)
                )
            )
        `,
        filters: {
            teacher_id: teacherId
        }
    });

    const categoryUsage = {};
    
    loans.forEach((loan: any) => {
        loan.loan_resources.forEach((lr: any) => {
            const category = lr.resources.category;
            if (category) {
                if (!categoryUsage[category.name]) {
                    categoryUsage[category.name] = {
                        name: category.name,
                        count: 0,
                        color: category.color
                    };
                }
                categoryUsage[category.name].count += 1;
            }
        });
    });

    return Object.values(categoryUsage).filter((cat: any) => cat.count > 0);
}