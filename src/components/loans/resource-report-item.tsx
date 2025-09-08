// src/components/loans/resource-report-item.tsx
'use client';

import { useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CategoryIcon } from '../inventory/category-icon';
import { Badge } from '../ui/badge';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { damageTypesByCategory, suggestionTypesByCategory } from '@/lib/damage-types';
import { Button } from '../ui/button';
import { FormField, FormControl, FormMessage, FormItem } from '../ui/form';
import { Textarea } from '../ui/textarea';

type ReportType = 'damage' | 'suggestion';

interface ResourceReportItemProps {
    type: ReportType;
    resource: any;
    form: UseFormReturn<any>;
    index: number;
    categoryType: keyof typeof damageTypesByCategory;
}

export function ResourceReportItem({ type, resource, form, index, categoryType }: ResourceReportItemProps) {
    const [isOpen, setIsOpen] = useState(false);
    
    const formFieldName = type === 'damage' ? `damageReports.${index}` : `suggestions.${index}`;
    const itemsArrayName = type === 'damage' ? 'damages' : 'suggestions';
    const notesFieldName = `${formFieldName}.notes`;
    
    const selectedItems = form.watch(`${formFieldName}.${itemsArrayName}`) || [];
    const hasNotes = form.watch(notesFieldName);

    const reportCount = selectedItems.length;
    const damageOptions = damageTypesByCategory[categoryType] || damageTypesByCategory['Otros'];
    const suggestionOptions = suggestionTypesByCategory[categoryType] || suggestionTypesByCategory['Otros'];
    const options = type === 'damage' ? damageOptions : suggestionOptions;

    const handleToggleItem = (itemId: string) => {
        const currentItems = form.getValues(`${formFieldName}.${itemsArrayName}`) || [];
        const newItems = currentItems.includes(itemId)
            ? currentItems.filter((i: string) => i !== itemId)
            : [...currentItems, itemId];
        form.setValue(`${formFieldName}.${itemsArrayName}`, newItems, { shouldDirty: true });
    }

    const isOtherSelected = selectedItems.includes('Otro');
    
    const badgeVariant = type === 'damage' ? 'destructive' : 'default';
    const badgeColor = type === 'suggestion' ? "bg-amber-500 hover:bg-amber-500" : "";
    const buttonVariant = type === 'damage' ? 'destructive' : 'default';
    const buttonSelectedClasses = type === 'suggestion' ? "bg-amber-500 hover:bg-amber-600 border-amber-500 text-white" : "";


    return (
        <Card className="overflow-hidden">
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CollapsibleTrigger asChild>
                    <div className="p-3 flex items-center justify-between cursor-pointer hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                            {resource.categoryType && <CategoryIcon type={resource.categoryType} className="w-5 h-5 text-muted-foreground" />}
                            <div>
                                <p className="font-semibold">{resource.name}</p>
                                <p className="text-sm text-muted-foreground">{resource.brand} {resource.model}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {reportCount > 0 && <Badge variant={badgeVariant} className={cn(badgeColor)}>{reportCount}</Badge>}
                            <ChevronRight className={cn("h-5 w-5 transition-transform", isOpen && "rotate-90")} />
                        </div>
                    </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="pt-4 mt-4 border-t space-y-6 px-4 pb-4">
                        <div className="space-y-2">
                            <p className="text-sm font-medium">{type === 'damage' ? 'Reportar Daño' : 'Sugerencias Rápidas'}</p>
                            <div className="flex flex-wrap gap-2">
                                {options.map(option => (
                                    <Button
                                        key={option.id}
                                        type="button"
                                        variant={selectedItems.includes(option.id) ? buttonVariant : 'outline'}
                                        size="sm"
                                        onClick={() => handleToggleItem(option.id)}
                                        className={cn(selectedItems.includes(option.id) && buttonSelectedClasses)}
                                    >
                                        <option.icon className="mr-2 h-4 w-4" />
                                        {option.label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        {isOtherSelected && (
                             <FormField
                                control={form.control}
                                name={notesFieldName}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Textarea placeholder="Describe el detalle específico..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}
