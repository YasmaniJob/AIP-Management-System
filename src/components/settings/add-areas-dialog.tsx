'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { PlusCircle, X } from 'lucide-react';
import { LoadingSpinner } from '@/components/atoms/loading-spinner';
import React, { useState, KeyboardEvent } from 'react';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { addAreaAction } from '@/lib/actions/settings';
import { useServerAction } from '@/hooks/use-server-action';

interface AddAreasDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const areaSchema = z.object({
  names: z.string().min(1, 'Debe introducir al menos un nombre de área.'),
});

const commonAreas = [
    'Matemática',
    'Comunicación',
    'Ciencia y Tecnología',
    'Personal Social',
    'Arte y Cultura',
    'Educación Religiosa',
    'Educación Física',
    'Inglés como Lengua Extranjera'
];

export function AddAreasDialog({ isOpen, setIsOpen }: AddAreasDialogProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [customArea, setCustomArea] = useState('');

  const form = useForm<z.infer<typeof areaSchema>>({
    resolver: zodResolver(areaSchema),
    defaultValues: { names: '' },
  });

  const handleToggleCommonArea = (area: string) => {
    setSelectedAreas(prev => 
      prev.includes(area) ? prev.filter(g => g !== area) : [...prev, area]
    );
  };

  const handleAddCustomArea = () => {
    const trimmedArea = customArea.trim();
    if (trimmedArea && !selectedAreas.includes(trimmedArea)) {
      setSelectedAreas(prev => [...prev, trimmedArea]);
    }
    setCustomArea('');
  };
  
  const handleCustomAreaKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomArea();
    }
  }

  const handleRemoveArea = (area: string) => {
    setSelectedAreas(prev => prev.filter(g => g !== area));
  };

  const { execute: executeAddArea, isPending } = useServerAction(
    addAreaAction,
    {
      successMessage: 'Áreas añadidas exitosamente',
      onSuccess: () => {
        form.reset();
        setSelectedAreas([]);
        setIsOpen(false);
        router.refresh();
      }
    }
  );

  const onSubmit = () => {
    if (selectedAreas.length === 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Debes seleccionar o añadir al menos un área.' });
      return;
    }
    
    const values = { names: selectedAreas.join('\n') };
    executeAddArea(values);
  };
  
  React.useEffect(() => {
    if (!isOpen) {
      setSelectedAreas([]);
      setCustomArea('');
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Añadir Nuevas Áreas Curriculares</DialogTitle>
          <DialogDescription>Selecciona las áreas comunes o añade una personalizada.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-2">
            <div>
              <h4 className="text-sm font-medium mb-2">Áreas Comunes</h4>
              <div className="flex flex-wrap gap-2">
                {commonAreas.map(area => (
                  <Button
                    key={area}
                    type="button"
                    variant={selectedAreas.includes(area) ? 'default' : 'outline'}
                    onClick={() => handleToggleCommonArea(area)}
                    className="h-auto"
                  >
                    {area}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Añadir otra área</h4>
               <div className="flex gap-2">
                <Input
                  value={customArea}
                  onChange={(e) => setCustomArea(e.target.value)}
                  onKeyDown={handleCustomAreaKeyDown}
                  placeholder="Escribe un área y presiona Enter"
                />
                <Button type="button" variant="secondary" onClick={handleAddCustomArea}>
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {selectedAreas.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3">Áreas a crear ({selectedAreas.length})</h4>
                <div className="flex flex-wrap gap-2 p-3 bg-secondary rounded-lg">
                  {selectedAreas.map(area => (
                    <Badge key={area} variant="outline" className="text-base bg-background py-1 pl-3 pr-2">
                      {area}
                      <button
                        type="button"
                        onClick={() => handleRemoveArea(area)}
                        className="ml-2 rounded-full hover:bg-destructive/20 p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isPending}>Cancelar</Button>
              <Button type="submit" disabled={isPending || selectedAreas.length === 0} onClick={onSubmit}>
                {isPending && <LoadingSpinner className="mr-2 h-4 w-4" />}
                Añadir Áreas
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
