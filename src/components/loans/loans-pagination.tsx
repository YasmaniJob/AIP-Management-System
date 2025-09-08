// src/components/loans/loans-pagination.tsx
'use client';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Pagination } from '@/components/ui/pagination';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoansPaginationProps {
  currentPage: number;
  pageCount: number;
  isLoading?: boolean;
}

export function LoansPagination({ currentPage, pageCount, isLoading = false }: LoansPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [changingPage, setChangingPage] = useState<number | null>(null);

  const handlePageChange = async (page: number) => {
    if (page === currentPage || isLoading) return;
    
    setChangingPage(page);
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    
    // Simular un pequeño delay para mostrar el estado de carga
    await new Promise(resolve => setTimeout(resolve, 200));
    
    router.push(`${pathname}?${params.toString()}`);
    
    // Reset después de un tiempo para evitar que se quede cargando
    setTimeout(() => setChangingPage(null), 1000);
  };

  if (pageCount <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-center space-x-2">
      {(isLoading || changingPage !== null) && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>
            {changingPage ? `Cargando página ${changingPage}...` : 'Cargando...'}
          </span>
        </div>
      )}
      <div className={cn(
        "transition-opacity duration-200",
        (isLoading || changingPage !== null) && "opacity-50 pointer-events-none"
      )}>
        <Pagination
          currentPage={currentPage}
          pageCount={pageCount}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
