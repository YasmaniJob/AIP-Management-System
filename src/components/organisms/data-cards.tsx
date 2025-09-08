// src/components/organisms/data-cards.tsx
'use client';
import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, MoreHorizontal, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  searchable?: boolean;
  priority?: 'high' | 'medium' | 'low'; // Para determinar qué mostrar en móvil
}

interface Action<T> {
  label: string;
  onClick: (item: T) => void;
  variant?: 'default' | 'destructive';
  icon?: React.ComponentType<{ className?: string }>;
}

interface DataCardsProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: Action<T>[];
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  itemsPerPage?: number;
  cardLayout?: 'grid' | 'list'; // Nuevo prop para layout
}

export function DataCards<T extends Record<string, any>>({
  data,
  columns,
  actions = [],
  searchPlaceholder = 'Buscar...',
  emptyMessage = 'No hay datos disponibles',
  className,
  itemsPerPage = 12, // Más items por página para cards
  cardLayout = 'list'
}: DataCardsProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  const searchableColumns = columns.filter(col => col.searchable);
  const sortableColumns = columns.filter(col => col.sortable);

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(item =>
      searchableColumns.some(column =>
        String(item[column.key])
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm, searchableColumns]);

  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key, direction: 'asc' };
    });
  };

  // Separar columnas por prioridad para responsive design
  const highPriorityColumns = columns.filter(col => col.priority === 'high' || !col.priority);
  const mediumPriorityColumns = columns.filter(col => col.priority === 'medium');
  const lowPriorityColumns = columns.filter(col => col.priority === 'low');

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {searchableColumns.length > 0 && (
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        )}
        
        {sortableColumns.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Ordenar
                {sortConfig && (
                  <span className="ml-1 text-xs">
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
              {sortableColumns.map((column) => (
                <DropdownMenuItem
                  key={column.key}
                  onClick={() => handleSort(column.key)}
                  className={sortConfig?.key === column.key ? 'bg-muted' : ''}
                >
                  {column.label}
                  {sortConfig?.key === column.key && (
                    <span className="ml-auto text-xs">
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Cards */}
      {paginatedData.length === 0 ? (
        <Card className="shadow-none border">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">{emptyMessage}</p>
          </CardContent>
        </Card>
      ) : (
        <div className={cn(
          cardLayout === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-4'
        )}>
          {paginatedData.map((item, index) => (
            <Card key={index} className="shadow-none border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    {/* High Priority Fields - Always visible */}
                    <div className={cn(
                      cardLayout === 'grid' 
                        ? 'space-y-2'
                        : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'
                    )}>
                      {highPriorityColumns.map((column) => (
                        <div key={column.key}>
                          <div className="text-xs font-medium text-muted-foreground mb-1">
                            {column.label}
                          </div>
                          <div className="text-sm">
                            {column.render ? column.render(item) : item[column.key]}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Medium Priority Fields - Hidden on small screens */}
                    {mediumPriorityColumns.length > 0 && (
                      <div className={cn(
                        'hidden sm:block',
                        cardLayout === 'grid' 
                          ? 'space-y-2'
                          : 'grid grid-cols-1 md:grid-cols-2 gap-3'
                      )}>
                        {mediumPriorityColumns.map((column) => (
                          <div key={column.key}>
                            <div className="text-xs font-medium text-muted-foreground mb-1">
                              {column.label}
                            </div>
                            <div className="text-sm">
                              {column.render ? column.render(item) : item[column.key]}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Low Priority Fields - Hidden on medium and small screens */}
                    {lowPriorityColumns.length > 0 && (
                      <div className={cn(
                        'hidden lg:block',
                        cardLayout === 'grid' 
                          ? 'space-y-2'
                          : 'grid grid-cols-1 xl:grid-cols-2 gap-3'
                      )}>
                        {lowPriorityColumns.map((column) => (
                          <div key={column.key}>
                            <div className="text-xs font-medium text-muted-foreground mb-1">
                              {column.label}
                            </div>
                            <div className="text-sm">
                              {column.render ? column.render(item) : item[column.key]}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  {actions.length > 0 && (
                    <div className="flex-shrink-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          {actions.map((action, actionIndex) => (
                            <DropdownMenuItem
                              key={actionIndex}
                              onClick={() => action.onClick(item)}
                              className={action.variant === 'destructive' ? 'text-destructive' : ''}
                            >
                              {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                              {action.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a{' '}
            {Math.min(currentPage * itemsPerPage, sortedData.length)} de{' '}
            {sortedData.length} resultados
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span className="text-sm">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataCards;