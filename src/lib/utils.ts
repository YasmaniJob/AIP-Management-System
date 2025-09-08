import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { getSingularCategoryType } from './constants/shared-schemas';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Use shared function from constants
export const singularize = getSingularCategoryType;

export function numberToOrdinal(n: number): string {
  if (n <= 0) return String(n);
  
  // Ordinals in Spanish are complex. This is a simplified but effective version for this context.
  const specialCases: Record<number, string> = {
    1: '1ra',
    2: '2da',
    3: '3ra',
    4: '4ta',
    5: '5ta',
    6: '6ta',
    7: '7ma',
    8: '8va',
    9: '9na',
    10: '10ma'
  };

  if (specialCases[n]) {
    return specialCases[n];
  }

  // For numbers > 10, just use the number + 'a'
  return `${n}va`;
}


// ========== NOTE PARSING LOGIC ==========

interface ParsedReport {
    resourceId: string;
    damages: string[];
    suggestions: string[];
    damageNotes: string;
    suggestionNotes: string;
}

interface ParsedNotesData {
    timestamp: string | null;
    reports: ParsedReport[];
}

/**
 * Parses the notes string from a loan or a resource to extract structured report data.
 * @param notes The notes string. Can be from a loan (with resource IDs) or a resource (without).
 * @returns A structured object with a timestamp and an array of reports.
 */
export const parseNotes = (notes: string | null | undefined): ParsedNotesData | null => {
    if (!notes || notes.trim() === '') return null;

    const lines = notes.split('\n').filter(line => line.trim() !== '');
    let timestamp: string | null = null;
    let processLines = lines;

    // Verificar si la primera línea es un timestamp (formato: [fecha/hora])
    if (lines.length > 0) {
        const firstLine = lines[0];
        const timestampMatch = firstLine.match(/^\[([^\]]+)\]$/);
        if (timestampMatch && !firstLine.includes('Recurso ID')) {
            timestamp = timestampMatch[1];
            processLines = lines.slice(1); // Omitir la línea del timestamp
        }
    }

    const resourceReportsMap = new Map<string, { damages: string[], suggestions: string[], damageNotes: string, suggestionNotes: string }>();

    let currentResourceId: string | null = 'default'; // Use a default key for notes without an ID (from resource itself)

    processLines.forEach(line => {
        const resourceMatch = line.match(/\[Recurso ID (.*?)\]/);
        if (resourceMatch) {
            currentResourceId = resourceMatch[1];
        }

        if (!resourceReportsMap.has(currentResourceId!)) {
            resourceReportsMap.set(currentResourceId!, { damages: [], suggestions: [], damageNotes: '', suggestionNotes: '' });
        }
        const report = resourceReportsMap.get(currentResourceId!)!;
            
        const damagesBlockMatch = line.match(/Daños: \[(.*?)\](?: \| Notas: "(.*?)")?/);
        if (damagesBlockMatch) {
            report.damages.push(...(damagesBlockMatch[1] ? damagesBlockMatch[1].split(', ').filter(Boolean) : []));
            if (damagesBlockMatch[2]) {
                 report.damageNotes = report.damageNotes ? `${report.damageNotes} ${damagesBlockMatch[2]}` : damagesBlockMatch[2];
            }
        }

        const suggestionsBlockMatch = line.match(/Sugerencias: \[(.*?)\](?: \| Notas Adicionales: "(.*?)")?/);
        if (suggestionsBlockMatch) {
            report.suggestions.push(...(suggestionsBlockMatch[1] ? suggestionsBlockMatch[1].split(', ').filter(Boolean) : []));
            if (suggestionsBlockMatch[2]) {
                report.suggestionNotes = report.suggestionNotes ? `${report.suggestionNotes} ${suggestionsBlockMatch[2]}`: suggestionsBlockMatch[2];
            }
        }
    });

    const reports: ParsedReport[] = [];
    for (const [resourceId, reportData] of resourceReportsMap.entries()) {
        if (reportData.damages.length > 0 || reportData.suggestions.length > 0 || reportData.damageNotes || reportData.suggestionNotes) {
            reports.push({ resourceId, ...reportData });
        }
    }

    return { timestamp, reports };
}
