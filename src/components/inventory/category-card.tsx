
'use client';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import * as React from 'react';
import { memo } from 'react';
import { CategoryIcon } from './category-icon';
import { Button } from '../ui/button';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { useRouter } from 'next/navigation';

interface CategoryCardProps {
  category: any;
  onEdit: (category: any) => void;
  onDelete: (category: any) => void;
  userRole: string;
}

export const CategoryCard = memo(function CategoryCard({ category, onEdit, onDelete, userRole }: CategoryCardProps) {
  const { id, name, type, resourceCount, availableCount, color } = category;
  const availabilityPercentage = resourceCount > 0 ? (availableCount / resourceCount) * 100 : 0;
  const router = useRouter();
  const isAdmin = userRole === 'Administrador';

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent navigation if the click is on a button or part of the dropdown
    if ((e.target as HTMLElement).closest('[data-no-nav]')) {
      return;
    }
    router.push(`/inventario/${id}`);
  };

  return (
    <Card
      onClick={handleCardClick}
      className="hover:shadow-lg transition-shadow duration-300 h-full flex flex-col border shadow-none group cursor-pointer"
      style={{ borderTop: `4px solid ${color}` }}
    >
        <CardHeader className="flex-grow pb-4">
            <div className="flex justify-between items-start">
            <div className="space-y-1">
                <CardTitle className="font-headline text-lg group-hover:underline">{name}</CardTitle>
                <p className="text-sm text-muted-foreground">{type}</p>
            </div>
            <div className="flex items-center gap-1" data-no-nav>
                <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: `${color}1A`}} // Add alpha for background
                >
                <CategoryIcon type={type} color={color} />
                </div>
                {isAdmin && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(category); }}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(category); }}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
            </div>
        </CardHeader>
        <CardContent>
            <div className="text-sm mb-2">
            <span className="font-bold">{availableCount}</span>
            <span className="text-muted-foreground">/{resourceCount} disponibles</span>
            </div>
            <Progress value={availabilityPercentage} className="h-2">
            <div
                className="h-full w-full flex-1 bg-primary transition-all"
                style={{ 
                    transform: `translateX(-${100 - (availabilityPercentage || 0)}%)`, 
                    backgroundColor: color 
                }}
            />
            </Progress>
        </CardContent>
    </Card>
  );
});
