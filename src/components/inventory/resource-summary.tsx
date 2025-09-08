// src/components/inventory/resource-summary.tsx
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Package, Tag, Hash, Cpu, Info, MemoryStick, HardDrive } from 'lucide-react';
import { LoadingSpinner } from '@/components/atoms/loading-spinner';
import { isTechCategory } from '@/lib/constants/shared-schemas';

interface ResourceSummaryProps {
    category: any;
    data: {
        brand?: string;
        model?: string;
        generation?: string;
        processorBrand?: string;
        ram?: string;
        storage?: string;
        quantity: number;
    };
    isSubmitting: boolean;
    onSubmit: () => void;
}

export function ResourceSummary({ category, data, isSubmitting, onSubmit }: ResourceSummaryProps) {
    const { brand, model, generation, processorBrand, ram, storage, quantity } = data;
    
    const isCurrentlyTechCategory = isTechCategory(category.type);
    
    const isFormComplete = brand;

    const resourceName = [brand, model].filter(Boolean).join(' ') || `Nuevo(s) ${category.type}`;

    const getBrandLabel = () => {
        switch (category.type) {
            case 'Cables y Adaptadores':
            case 'Mobiliario':
            case 'Otros':
                return 'Tipo:';
            default:
                return 'Marca:';
        }
    }

    const getModelLabel = () => {
         switch (category.type) {
            case 'Cables y Adaptadores':
                return 'Longitud/Espec.:';
            case 'Mobiliario':
                return 'Descripción:';
             case 'Proyectores':
                return 'Tecnología/Mod.:';
             case 'Periféricos':
                return 'Conectividad/Mod.:';
            default:
                return 'Modelo:';
        }
    }

    return (
        <Card className="sticky top-8">
            <CardHeader>
                <CardTitle className="font-headline">{resourceName}</CardTitle>
                 <CardDescription>Para la categoría: {category.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
                <Separator />
                
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{getBrandLabel()}</span>
                        <span className="text-muted-foreground">{brand || 'N/A'}</span>
                    </div>
                     <div className="flex items-center gap-3">
                        <Info className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{getModelLabel()}</span>
                        <span className="text-muted-foreground">{model || 'N/A'}</span>
                    </div>

                     {isCurrentlyTechCategory && (
                        <>
                            <div className="flex items-center gap-3">
                                <Info className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{category.type === 'Tablets' ? 'Chipset:' : 'Serie/Gen:'}</span>
                                <span className="text-muted-foreground">{generation || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Cpu className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Procesador:</span>
                                <span className="text-muted-foreground">{processorBrand || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <MemoryStick className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">RAM:</span>
                                <span className="text-muted-foreground">{ram || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <HardDrive className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Almacenamiento:</span>
                                <span className="text-muted-foreground">{storage || 'N/A'}</span>
                            </div>
                        </>
                     )}
                </div>
                
                <Separator />

                <div className="text-center pt-2">
                    <p className="text-muted-foreground">Cantidad a crear</p>
                    <p className="text-4xl font-bold font-headline">{quantity}</p>
                </div>


            </CardContent>
            <CardFooter>
                 <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg" 
                    onClick={onSubmit} 
                    disabled={!isFormComplete || isSubmitting}
                >
                    {isSubmitting && <LoadingSpinner className="mr-2 h-4 w-4" />}
                    {isSubmitting ? 'Creando Recursos...' : `Añadir ${quantity} Recurso(s)`}
                </Button>
            </CardFooter>
        </Card>
    );
}
