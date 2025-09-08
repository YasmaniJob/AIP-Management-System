// src/components/ui/pagination.tsx
'use client';
import * as React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import type { ButtonProps } from '@/components/ui/button';

interface PaginationProps extends React.ComponentProps<'nav'> {
    pageCount: number;
    currentPage: number;
    onPageChange: (page: number) => void;
}

const Pagination = ({
  pageCount,
  currentPage,
  onPageChange,
  className,
  ...props
}: PaginationProps) => {
    const handlePrevious = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < pageCount) {
            onPageChange(currentPage + 1);
        }
    };

    if (pageCount <= 1) {
        return null;
    }
  
    return (
        <nav
            role="navigation"
            aria-label="pagination"
            className={cn('mx-auto flex w-full justify-center', className)}
            {...props}
        >
            <ul className="flex items-center gap-1">
                <li>
                     <Button
                        aria-label="Go to previous page"
                        size="default"
                        variant="ghost"
                        onClick={handlePrevious}
                        disabled={currentPage === 1}
                     >
                        <ChevronLeft className="h-4 w-4" />
                        <span>Anterior</span>
                     </Button>
                </li>
                <li className="flex items-center text-sm font-medium">
                     Página {currentPage} de {pageCount}
                </li>
                <li>
                    <Button
                        aria-label="Go to next page"
                        size="default"
                        variant="ghost"
                        onClick={handleNext}
                        disabled={currentPage === pageCount}
                    >
                        <span>Siguiente</span>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </li>
            </ul>
        </nav>
    );
};
Pagination.displayName = 'Pagination';

export { Pagination };
