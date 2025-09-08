// src/components/inventory/new-resource-form.tsx
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { cn } from '@/lib/utils';

import { ResourceSummary } from './resource-summary';
import React from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { ChevronRight } from 'lucide-react';
import { Slider } from '../ui/slider';
import { addResourceAction } from '@/lib/actions/inventory';
import { useServerAction } from '@/hooks/use-server-action';


const resourceSchema = z.object({
  brand: z.string().min(1, 'La marca o tipo es obligatoria.'),
  model: z.string().optional(),
  processorBrand: z.string().optional(),
  generation: z.string().optional(),
  ram: z.string().optional(),
  storage: z.string().optional(),
  notes: z.string().optional(),
  quantity: z.number().min(1, 'La cantidad debe ser al menos 1.'),
  categoryId: z.string(),
});

const laptopProcessorBrands: any[] = ['Intel', 'AMD', 'Otro'];
const laptopGenerationSuggestions: Record<string, string[]> = {
    Intel: ['Core i3', 'Core i5', 'Core i7', 'Core i9', 'Pentium', 'Celeron'],
    AMD: ['Ryzen 3', 'Ryzen 5', 'Ryzen 7', 'Ryzen 9', 'Athlon'],
    Otro: [],
};

const tabletProcessorBrands: any[] = ['Apple', 'Qualcomm', 'Samsung', 'MediaTek', 'Google', 'Otro'];

const ramSuggestions = ['2GB', '4GB', '8GB', '12GB', '16GB', '32GB'];
const storageSuggestions = ['128GB', '256GB', '512GB', '1TB', '2TB'];

const brandSuggestions: Partial<Record<any, string[]>> = {
    Laptops: ['HP', 'Dell', 'Lenovo', 'Apple', 'Asus', 'Acer', 'Toshiba'],
    'PCs de Escritorio': ['Dell', 'HP', 'Lenovo', 'Apple', 'Genérico'],
    Tablets: ['Apple', 'Samsung', 'Lenovo', 'ALDO', 'Amazon', 'Huawei'],
    Proyectores: ['Epson', 'BenQ', 'Sony', 'ViewSonic', 'LG', 'Optoma'],
    'Cámaras Fotográficas': ['Canon', 'Nikon', 'Sony', 'Panasonic', 'Fujifilm'],
    Filmadoras: ['Sony', 'Canon', 'Panasonic', 'JVC', 'Blackmagic'],
    Periféricos: ['Logitech', 'Microsoft', 'Razer', 'HP', 'Genius', 'Micronics'],
    Redes: ['TP-Link', 'Cisco', 'Netgear', 'Ubiquiti', 'MikroTik'],
    Audio: ['Sony', 'JBL', 'Bose', 'Logitech', 'Skullcandy', 'Micronics'],
    'Cables y Adaptadores': ['Cable de Poder', 'Cable HDMI', 'Cable VGA', 'Cable UTP', 'Adaptador USB-C', 'Adaptador HDMI a VGA'],
    Mobiliario: ['Mesa', 'Silla', 'Estante', 'Armario', 'Pizarra', 'Rack'],
    Otros: []
}


export function NewResourceForm({ category, onFormSubmit }: { category: any; onFormSubmit: () => void; }) {
    const router = useRouter();
    const { toast } = useToast();
    const [isTechDetailsOpen, setIsTechDetailsOpen] = React.useState(false);


    const form = useForm<z.infer<typeof resourceSchema>>({
        resolver: zodResolver(resourceSchema),
        defaultValues: {
            brand: '',
            model: '',
            notes: '',
            ram: '',
            storage: '',
            processorBrand: '',
            generation: '',
            quantity: 1,
            categoryId: category.id,
        },
    });

    const { execute: executeAddResource, isPending } = useServerAction(
        addResourceAction,
        {
            successMessage: 'Recursos Añadidos',
            onSuccess: () => {
                form.reset({
                    brand: '',
                    model: '',
                    notes: '',
                    ram: '',
                    storage: '',
                    processorBrand: '',
                    generation: '',
                    quantity: 1,
                    categoryId: category.id,
                });
                onFormSubmit();
                router.refresh();
            }
        }
    );
    
    const isTechCategory = category.type === 'Laptops' || category.type === 'Tablets' || category.type === 'PCs de Escritorio';
    const isLaptop = category.type === 'Laptops' || category.type === 'PCs de Escritorio';
    const isTablet = category.type === 'Tablets';
    
    const processorBrandOptions = isTablet ? tabletProcessorBrands : laptopProcessorBrands;
    const currentBrandSuggestions = brandSuggestions[category.type as keyof typeof brandSuggestions] || [];
    
    const selectedProcessorBrand = form.watch('processorBrand');

    const getFieldLabels = () => {
        switch (category.type) {
            case 'Cables y Adaptadores':
                return { brand: 'Tipo de Cable / Adaptador', model: 'Longitud / Especificación (Opcional)' };
            case 'Mobiliario':
                return { brand: 'Tipo de Mueble', model: 'Descripción (Opcional)' };
            case 'Otros':
                return { brand: 'Tipo de Equipo', model: 'Marca / Modelo (Opcional)' };
            case 'Proyectores':
                return { brand: 'Marca', model: 'Tecnología / Modelo (Opcional)' };
            case 'Periféricos':
                return { brand: 'Marca', model: 'Conectividad / Modelo (Opcional)' };
            default:
                return { brand: 'Marca (Obligatorio)', model: 'Modelo (Opcional)' };
        }
    }
    const fieldLabels = getFieldLabels();

    function onSubmit(values: z.infer<typeof resourceSchema>) {
        if (isTechCategory && isTechDetailsOpen) {
            if (values.processorBrand && !values.generation) {
                form.setError('generation', { message: 'Debes especificar una serie o modelo de procesador.' });
                return;
            }
        }
        
        executeAddResource(values);
    }
    
    const formValues = form.watch();

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Detalles del Recurso</CardTitle>
                            <CardDescription>Completa la información clave del nuevo recurso a crear.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            
                             <div className="grid md:grid-cols-2 gap-6">
                                <FormField control={form.control} name="brand" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{fieldLabels.brand}</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder={
                                                category.type === 'Cables y Adaptadores' ? 'Ej: Cable HDMI' : 
                                                category.type === 'Mobiliario' ? 'Ej: Silla, Mesa' :
                                                category.type === 'Otros' ? 'Ej: Router 4G, Lector de Barras' :
                                                'Ej: HP, Epson, Logitech'
                                            } />
                                        </FormControl>
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {currentBrandSuggestions.map(brand => (
                                                <Button
                                                    type="button"
                                                    key={brand}
                                                    variant={field.value === brand ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => field.onChange(field.value === brand ? '' : brand)}
                                                >
                                                    {brand}
                                                </Button>
                                            ))}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="model" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{fieldLabels.model}</FormLabel>
                                        <FormControl><Input {...field} placeholder={
                                            category.type === 'Cables y Adaptadores' ? 'Ej: 1.5m, USB 3.0' :
                                            category.type === 'Mobiliario' ? 'Ej: de madera, 2 cajones' :
                                            category.type === 'Proyectores' ? 'Ej: LCD, 3500 Lúmenes' :
                                            category.type === 'Periféricos' ? 'Ej: Inalámbrico, USB' :
                                            'Ej: Pavilion, PowerLite'
                                        } /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                             </div>
                             
                           {isTechCategory && (
                            <Collapsible open={isTechDetailsOpen} onOpenChange={setIsTechDetailsOpen}>
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" className="w-full justify-between border-y py-3 px-2 h-auto">
                                        <span className="font-medium text-sm">Detalles Técnicos (Opcional)</span>
                                        <ChevronRight className={cn("h-5 w-5 transition-transform", isTechDetailsOpen && "rotate-90")} />
                                    </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="pt-6 space-y-6 animate-in fade-in duration-300">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="processorBrand"
                                            render={({ field }) => (
                                            <FormItem className="space-y-3">
                                                <FormLabel>Marca del Procesador</FormLabel>
                                                <FormControl>
                                                <div className="flex flex-wrap gap-2">
                                                    {processorBrandOptions.map((brand) => (
                                                        <Button
                                                            type="button"
                                                            key={brand}
                                                            variant={field.value === brand ? 'default' : 'outline'}
                                                            onClick={() => {
                                                                const newValue = field.value === brand ? '' : brand;
                                                                field.onChange(newValue);
                                                                form.setValue('generation', '');
                                                            }}
                                                        >
                                                            {brand}
                                                        </Button>
                                                    ))}
                                                </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                            )}
                                        />

                                        {selectedProcessorBrand && (
                                            <div className="animate-in fade-in duration-300">
                                                <FormField
                                                    control={form.control}
                                                    name="generation"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>{isTablet ? 'Generación / Modelo del Chip' : 'Serie / Modelo del Procesador'}</FormLabel>
                                                            <FormControl>
                                                                <div className="space-y-2">
                                                                    {isLaptop && selectedProcessorBrand && laptopGenerationSuggestions[selectedProcessorBrand]?.length > 0 ? (
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {laptopGenerationSuggestions[selectedProcessorBrand].map(suggestion => (
                                                                                <Button
                                                                                    type="button"
                                                                                    key={suggestion}
                                                                                    variant={field.value === suggestion ? 'default' : 'outline'}
                                                                                    size="sm"
                                                                                    onClick={() => {
                                                                                        const newValue = field.value === suggestion ? '' : suggestion;
                                                                                        field.onChange(newValue);
                                                                                    }}
                                                                                >
                                                                                    {suggestion}
                                                                                </Button>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <Input {...field} placeholder={isTablet ? "Ej: M2, A15 Bionic, Tensor G2" : "Ej: 11th Gen, 5000 Series"} />
                                                                    )}
                                                                </div>
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <Separator/>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <FormField control={form.control} name="ram" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Memoria RAM</FormLabel>
                                            <FormControl>
                                                <div>
                                                        <div className="flex flex-wrap gap-2">
                                                        {ramSuggestions.map(ram => (
                                                            <Button
                                                                type="button"
                                                                key={ram}
                                                                variant={field.value === ram ? 'default' : 'outline'}
                                                                onClick={() => field.onChange(field.value === ram ? '' : ram)}
                                                            >
                                                                {ram}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                    <Input {...field} placeholder="O especifica un valor (ej: 6GB)" className="mt-2" />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )} />
                                        <FormField control={form.control} name="storage" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Almacenamiento</FormLabel>
                                            <FormControl>
                                                <div>
                                                        <div className="flex flex-wrap gap-2">
                                                        {storageSuggestions.map(storage => (
                                                            <Button
                                                                type="button"
                                                                key={storage}
                                                                variant={field.value === storage ? 'default' : 'outline'}
                                                                onClick={() => field.onChange(field.value === storage ? '' : storage)}
                                                            >
                                                                {storage}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                    <Input {...field} placeholder="O especifica un valor (ej: 1.5TB)" className="mt-2" />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )} />
                                    </div>
                                </CollapsibleContent>
                             </Collapsible>
                           )}
                            
                            <Separator />
                            <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Cantidad a crear</FormLabel>
                                    <FormControl>
                                        <div className='flex items-center gap-4'>
                                            <Slider
                                                min={1}
                                                max={30}
                                                step={1}
                                                value={[field.value]}
                                                onValueChange={(value) => field.onChange(value[0])}
                                                className="w-full"
                                            />
                                            <Input
                                                type="number"
                                                min={1}
                                                className="w-20 text-center font-bold text-lg"
                                                value={field.value}
                                                onChange={(e) => {
                                                    const value = e.target.value === '' ? 1 : parseInt(e.target.value, 10);
                                                     if (!isNaN(value) && value >= 1) {
                                                        field.onChange(value);
                                                    }
                                                }}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Notas (Opcional)</FormLabel>
                                    <FormControl><Textarea {...field} placeholder="Cualquier detalle adicional sobre el recurso (ej: cargador europeo, teclado sin ñ, etc.)"/></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                    <ResourceSummary
                        category={category}
                        data={formValues}
                        isSubmitting={isPending}
                        onSubmit={form.handleSubmit(onSubmit)}
                    />
                </div>
            </form>
        </Form>
    );
}
