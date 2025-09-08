// src/lib/data/inventory.ts
'use server';
import { dataService } from '../services/data-service';
import type { Category, Resource, CategoryWithStats } from '../types';

export async function getCategories(): Promise<{ success: boolean; data?: CategoryWithStats[]; error?: string }> {
    try {
        const data = await dataService.findMany('categories', {
            orderBy: { name: 'asc' }
        });

        // Obtener conteos de recursos por separado para evitar problemas de join
        const categoriesWithStats = await Promise.all(
            data.map(async (category: any) => {
                try {
                    const resources = await dataService.findMany('resources', {
                        filters: { category_id: category.id },
                        select: 'id, status'
                    });
                    
                    return {
                        ...category,
                        resourceCount: resources.length,
                        availableCount: resources.filter((r: any) => r.status === 'Disponible').length
                    };
                } catch (error) {
                    console.warn(`Error fetching resources for category ${category.id}:`, error);
                    return {
                        ...category,
                        resourceCount: 0,
                        availableCount: 0
                    };
                }
            })
        );

        return { success: true, data: categoriesWithStats };
    } catch (error) {
        console.error('Error fetching categories:', error);
        return { success: false, error: 'Failed to fetch categories' };
    }
}


export async function getCategoryById(id: string): Promise<Category | null> {
    return await dataService.findById('categories', id);
}

export async function getResourcesByCategoryId(categoryId: string): Promise<any[]> {
    return await dataService.findMany('resources', {
        select: `
            *,
            category:categories ( name )
        `,
        filters: { category_id: categoryId },
        orderBy: { number: 'asc' }
    });
}

export async function getResourceById(id: string): Promise<any | null> {
    return await dataService.findById('resources', id, {
        select: `
            *,
            category:categories (id, name, type)
        `
    });
}

export async function getResourceByNumber(number: string): Promise<any | null> {
    const resources = await dataService.findMany('resources', {
        select: `
            *,
            category:categories (id, name, type)
        `,
        filters: { number: parseInt(number) },
        limit: 1
    });
    
    return resources.length > 0 ? resources[0] : null;
}
