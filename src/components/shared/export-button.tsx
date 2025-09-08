'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, FileJson } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useExport, ExportData, ExportOptions } from '@/hooks/use-export';
import { cn } from '@/lib/utils';

interface ExportButtonProps {
  data: ExportData[];
  filename?: string;
  sheetName?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  disabled?: boolean;
}

export function ExportButton({
  data,
  filename = 'reporte',
  sheetName = 'Datos',
  className,
  variant = 'outline',
  size = 'default',
  disabled = false,
}: ExportButtonProps) {
  const { exportData, isExporting } = useExport();
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = (format: 'excel' | 'csv' | 'json') => {
    const options: ExportOptions = {
      filename,
      format,
      sheetName,
    };
    
    exportData(data, options);
    setIsOpen(false);
  };

  const isDisabled = disabled || isExporting || data.length === 0;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={isDisabled}
          className={cn('gap-2', className)}
        >
          <Download className="h-4 w-4" />
          {isExporting ? 'Exportando...' : 'Exportar'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={() => handleExport('excel')}
          className="gap-2 cursor-pointer"
        >
          <FileSpreadsheet className="h-4 w-4 text-green-600" />
          Exportar a Excel
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport('csv')}
          className="gap-2 cursor-pointer"
        >
          <FileText className="h-4 w-4 text-blue-600" />
          Exportar a CSV
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleExport('json')}
          className="gap-2 cursor-pointer"
        >
          <FileJson className="h-4 w-4 text-purple-600" />
          Exportar a JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Componente simplificado para exportación rápida a Excel
interface QuickExportButtonProps {
  data: ExportData[];
  filename?: string;
  sheetName?: string;
  className?: string;
  children?: React.ReactNode;
}

export function QuickExportButton({
  data,
  filename = 'reporte',
  sheetName = 'Datos',
  className,
  children,
}: QuickExportButtonProps) {
  const { exportData, isExporting } = useExport();

  const handleQuickExport = () => {
    const options: ExportOptions = {
      filename,
      format: 'excel',
      sheetName,
    };
    
    exportData(data, options);
  };

  const isDisabled = isExporting || data.length === 0;

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isDisabled}
      onClick={handleQuickExport}
      className={cn('gap-2', className)}
    >
      <FileSpreadsheet className="h-4 w-4" />
      {children || (isExporting ? 'Exportando...' : 'Excel')}
    </Button>
  );
}