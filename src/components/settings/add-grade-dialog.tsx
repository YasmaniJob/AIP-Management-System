'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { PlusCircle, X } from 'lucide-react';
import { LoadingSpinner } from '@/components/atoms/loading-spinner';
import React, { useState, KeyboardEvent } from 'react';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { addGradeAction } from '@/lib/actions/settings';
import { useServerAction } from '@/hooks/use-server-action';
import { useToast } from '@/hooks/use-toast';

interface AddGradeDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const gradeSchema = z.object({
  names: z.string().min(1, 'Debe introducir al menos un nombre de grado.'),
});

const commonGrades = [
    'Primero',
    'Segundo',
    'Tercero',
    'Cuarto',
    'Quinto',
    'Sexto'
];

export function AddGradeDialog({ isOpen, setIsOpen }: AddGradeDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [customGrade, setCustomGrade] = useState('');
  
  const { execute: executeAddGrade, isPending: isSubmitting } = useServerAction(
    addGradeAction,
    {
      successMessage: 'Los nuevos grados se han guardado correctamente',
      onSuccess: () => {
        form.reset();
        setSelectedGrades([]);
        setIsOpen(false);
        router.refresh();
      }
    }
  );

  const form = useForm<z.infer<typeof gradeSchema>>({
    resolver: zodResolver(gradeSchema),
    defaultValues: { names: '' },
  });
  
  const handleToggleCommonGrade = (grade: string) => {
    setSelectedGrades(prev => 
      prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade]
    );
  };

  const handleAddCustomGrade = () => {
    if (customGrade && !selectedGrades.includes(customGrade)) {
      setSelectedGrades(prev => [...prev, customGrade.trim()]);
    }
    setCustomGrade('');
  };
  
  const handleCustomGradeKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomGrade();
    }
  }

  const handleRemoveGrade = (grade: string) => {
    setSelectedGrades(prev => prev.filter(g => g !== grade));
  };


  const onSubmit = () => {
    if (selectedGrades.length === 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Debes seleccionar o añadir al menos un grado.' });
      return;
    }
    
    const values = { names: selectedGrades.join('\n') };
    executeAddGrade(values);
  };
  
  React.useEffect(() => {
    if (!isOpen) {
      setSelectedGrades([]);
      setCustomGrade('');
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Añadir Nuevos Grados</DialogTitle>
          <DialogDescription>Selecciona los grados comunes o añade uno personalizado.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-2">
            <div>
              <h4 className="text-sm font-medium mb-2">Grados Comunes</h4>
              <div className="flex flex-wrap gap-2">
                {commonGrades.map(grade => (
                  <Button
                    key={grade}
                    type="button"
                    variant={selectedGrades.includes(grade) ? 'default' : 'outline'}
                    onClick={() => handleToggleCommonGrade(grade)}
                    className="rounded-full"
                  >
                    {grade}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Añadir otro grado</h4>
               <div className="flex gap-2">
                <Input
                  value={customGrade}
                  onChange={(e) => setCustomGrade(e.target.value)}
                  onKeyDown={handleCustomGradeKeyDown}
                  placeholder="Escribe un grado y presiona Enter"
                />
                <Button type="button" variant="secondary" onClick={handleAddCustomGrade}>
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {selectedGrades.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3">Grados a crear ({selectedGrades.length})</h4>
                <div className="flex flex-wrap gap-2 p-3 bg-secondary rounded-lg">
                  {selectedGrades.map(grade => (
                    <Badge key={grade} variant="outline" className="text-base bg-background py-1 pl-3 pr-2">
                      {grade}
                      <button
                        type="button"
                        onClick={() => handleRemoveGrade(grade)}
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
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting || selectedGrades.length === 0} onClick={onSubmit}>
                {isSubmitting && <LoadingSpinner className="mr-2 h-4 w-4" />}
                Añadir Grados
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
