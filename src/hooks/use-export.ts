import { useState } from 'react';
import * as XLSX from 'xlsx';
import { toast } from './use-toast';

export interface ExportOptions {
  filename?: string;
  format: 'excel' | 'csv' | 'json';
  sheetName?: string;
}

export interface ExportData {
  [key: string]: any;
}

export function useExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportToExcel = (data: ExportData[], options: ExportOptions) => {
    try {
      setIsExporting(true);
      
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      
      XLSX.utils.book_append_sheet(
        workbook, 
        worksheet, 
        options.sheetName || 'Datos'
      );
      
      const filename = `${options.filename || 'reporte'}.xlsx`;
      XLSX.writeFile(workbook, filename);
      
      toast({
        title: 'Exportación exitosa',
        description: `El archivo ${filename} se ha descargado correctamente.`,
      });
    } catch (error) {
      console.error('Error al exportar:', error);
      toast({
        title: 'Error en la exportación',
        description: 'No se pudo exportar el archivo. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = (data: ExportData[], options: ExportOptions) => {
    try {
      setIsExporting(true);
      
      const worksheet = XLSX.utils.json_to_sheet(data);
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${options.filename || 'reporte'}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      toast({
        title: 'Exportación exitosa',
        description: `El archivo CSV se ha descargado correctamente.`,
      });
    } catch (error) {
      console.error('Error al exportar CSV:', error);
      toast({
        title: 'Error en la exportación',
        description: 'No se pudo exportar el archivo CSV. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToJSON = (data: ExportData[], options: ExportOptions) => {
    try {
      setIsExporting(true);
      
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${options.filename || 'reporte'}.json`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      toast({
        title: 'Exportación exitosa',
        description: `El archivo JSON se ha descargado correctamente.`,
      });
    } catch (error) {
      console.error('Error al exportar JSON:', error);
      toast({
        title: 'Error en la exportación',
        description: 'No se pudo exportar el archivo JSON. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportData = (data: ExportData[], options: ExportOptions) => {
    switch (options.format) {
      case 'excel':
        exportToExcel(data, options);
        break;
      case 'csv':
        exportToCSV(data, options);
        break;
      case 'json':
        exportToJSON(data, options);
        break;
      default:
        toast({
          title: 'Formato no soportado',
          description: 'El formato de exportación seleccionado no es válido.',
          variant: 'destructive',
        });
    }
  };

  return {
    exportData,
    isExporting,
  };
}