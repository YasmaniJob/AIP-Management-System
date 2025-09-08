// src/lib/data/dashboard.ts
'use server';

import { dataService } from "../services/data-service";
import { format, startOfDay, subDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export async function getDashboardStats() {
    const today = format(startOfDay(new Date()), 'yyyy-MM-dd HH:mm:ss');
    const tomorrow = format(startOfDay(new Date(new Date().setDate(new Date().getDate() + 1))), 'yyyy-MM-dd HH:mm:ss');

    const [
        totalResources,
        availableResources,
        activeLoans,
        dueToday,
    ] = await Promise.all([
        dataService.count('resources'),
        dataService.count('resources', { status: 'Disponible' }),
        dataService.count('loans', { status: ['Activo', 'Atrasado'] }),
        dataService.count('loans', { 
            status: 'Activo',
            loan_date: { gte: today, lt: tomorrow }
        }),
    ]);

    return {
        totalResources,
        availableResources,
        activeLoans,
        dueToday,
    };
}

export async function getLoanActivity() {
    const today = new Date();
    const sevenDaysAgo = subDays(today, 7);

    const data = await dataService.findMany('loans', {
        select: 'created_at',
        filters: {
            created_at: { gte: format(sevenDaysAgo, 'yyyy-MM-dd') }
        },
        orderBy: { created_at: 'desc' }
    });

    const dailyCounts = data.reduce((acc: any, loan: any) => {
        const date = format(parseISO(loan.created_at), 'yyyy-MM-dd');
        acc[date] = (acc[date] || 0) + 1;
        return acc;
    }, {});

    // Fill in missing days with 0 count
    const result = [];
    for (let i = 0; i < 7; i++) {
        const date = format(subDays(today, i), 'yyyy-MM-dd');
        result.push({ date, count: dailyCounts[date] || 0 });
    }

    return result.reverse(); // Return in chronological order
}

export async function getResourceDistribution() {
    const categories = await dataService.findMany('categories', {
        select: 'id, name, color, resources(count)'
    });

    return categories.map((cat: any) => ({
        name: cat.name,
        count: cat.resources[0]?.count || 0,
        color: cat.color,
    })).filter((cat: any) => cat.count > 0);
}
