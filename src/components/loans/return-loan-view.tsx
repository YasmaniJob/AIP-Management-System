// src/components/loans/return-loan-view.tsx
'use client';
import { useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { ArrowLeft, ShieldX, MessageSquarePlus, Check, XCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/atoms/loading-spinner';
import { LoanReturnSummary } from './loan-return-summary';
import { InputOTP } from '@/components/ui/input-otp';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { ResourceReportItem } from './resource-report-item';
import { returnLoanAction } from '@/lib/actions/loans';
import { colors } from '@/lib/colors';
import { useFormSubmission } from '@/hooks/use-async-state';


const returnSchema = z.object({
  loanId: z.string(),
  dni: z.string().length(8, 'El DNI debe tener 8 dígitos.'),
  damageReports: z.array(z.object({
    resourceId: z.string(),
    damages: z.array(z.string()),
    notes: z.string().optional(),
  })).optional(),
  suggestions: z.array(z.object({
    resourceId: z.string(),
    suggestions: z.array(z.string()),
    notes: z.string().optional(),
  })).optional(),
});

interface ReturnLoanViewProps {
  loan: any;
}

export function ReturnLoanView({ loan }: ReturnLoanViewProps) {
  const router = useRouter();
  const [view, setView] = useState<'idle' | 'damages' | 'suggestions'>('idle');
  const [isInvalidInput, setIsInvalidInput] = useState(false);
  
  const { submit: submitReturn, isLoading: isSubmitting } = useFormSubmission({
    onSuccess: (result) => {
      router.refresh(); // Forzar recarga de datos
      router.push('/prestamos');
    },
    successMessage: 'Devolución registrada exitosamente',
    errorMessage: 'Error al registrar la devolución'
  });

  const form = useForm<z.infer<typeof returnSchema>>({
    resolver: zodResolver(returnSchema),
    defaultValues: { 
      loanId: loan.id,
      dni: '',
      damageReports: loan.resources.map((r:any) => ({ resourceId: r.id, damages: [], notes: '' })),
      suggestions: loan.resources.map((r:any) => ({ resourceId: r.id, suggestions: [], notes: '' })),
    },
  });

  const { fields: damageReportFields } = useFieldArray({
    control: form.control,
    name: 'damageReports',
  });
  
  const { fields: suggestionFields } = useFieldArray({
    control: form.control,
    name: 'suggestions',
  });
  
  const dniValue = form.watch('dni');
  
  const dniStatus = useMemo(() => {
    if (!dniValue || dniValue.length < 8) return 'incomplete';
    return dniValue === loan.user?.dni ? 'correct' : 'incorrect';
  }, [dniValue, loan.user?.dni]);

 const handleDniChange = (value: string) => {
    const prevValue = form.getValues('dni');
    form.setValue('dni', value, { shouldValidate: true });

    if (value.length === prevValue.length && value !== prevValue) {
        setIsInvalidInput(true);
        setTimeout(() => setIsInvalidInput(false), 200);
    }
  }

  async function onSubmit(values: z.infer<typeof returnSchema>) {
    console.log('onSubmit called with values:', values);
    console.log('dniStatus:', dniStatus);
    
    // Debug: Log damage reports in detail
    console.log('=== DAMAGE REPORTS DEBUG ===');
    if (values.damageReports) {
      values.damageReports.forEach((report, index) => {
        console.log(`Damage Report ${index}:`, {
          resourceId: report.resourceId,
          damages: report.damages,
          damagesLength: report.damages?.length || 0,
          notes: report.notes
        });
      });
    } else {
      console.log('No damage reports found');
    }
    
    // Debug: Log suggestions in detail
    console.log('=== SUGGESTIONS DEBUG ===');
    if (values.suggestions) {
      values.suggestions.forEach((suggestion, index) => {
        console.log(`Suggestion ${index}:`, {
          resourceId: suggestion.resourceId,
          suggestions: suggestion.suggestions,
          suggestionsLength: suggestion.suggestions?.length || 0,
          notes: suggestion.notes
        });
      });
    } else {
      console.log('No suggestions found');
    }
    
    if (dniStatus !== 'correct') {
      console.log('DNI validation failed');
      form.setError('dni', { message: 'El DNI ingresado no es correcto.' });
      return;
    }
    
    console.log('About to call returnLoanAction');
    try {
      const result = await returnLoanAction(values);
      console.log('returnLoanAction result:', result);
      
      if (result.success) {
        router.refresh();
        router.push('/prestamos');
      } else {
        console.error('Return loan failed:', result.error);
      }
    } catch (error) {
      console.error('Error calling returnLoanAction:', error);
    }
  }

  return (
    <div className="space-y-4">
       <h1 className="text-3xl font-bold font-headline">
          Registrar Devolución de: <span className="text-primary">{loan.user?.name}</span>
      </h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Validar Docente</CardTitle>
                <CardDescription>Ingresa el DNI de <strong>{loan.user?.name}</strong> para confirmar la devolución.</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                 <div>
                    <FormField control={form.control} name="dni" render={({ field }) => (
                      <FormItem>
                          <FormControl>
                            <InputOTP
                                maxLength={8}
                                {...field}
                                onChange={handleDniChange}
                                containerClassName={cn("flex gap-2", isInvalidInput && "animate-shake")}
                                render={({ slots }) => (
                                    <>
                                    {slots.slice(0, 8).map((slot, index) => (
                                        <div
                                        key={index}
                                        className={cn(
                                            "relative flex h-14 w-12 items-center justify-center rounded-t-md border-b-4 border-primary bg-secondary text-3xl font-semibold transition-all",
                                            slot.isActive && "scale-105",
                                            dniStatus === 'correct' && 'border-green-500',
                                            dniStatus === 'incorrect' && dniValue.length === 8 && 'border-destructive'
                                        )}
                                        >
                                        {slot.char}
                                        {slot.hasFakeCaret && (
                                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                            <div className="h-8 w-px animate-caret-blink bg-foreground duration-1000" />
                                            </div>
                                        )}
                                        </div>
                                    ))}
                                    </>
                                )}
                            />
                          </FormControl>
                          <div className="pt-2 h-6 flex justify-center">
                            {dniStatus === 'correct' ? (
                                <Badge variant="default" className={cn(colors.success.button, "gap-1.5")}>
                                    <Check className="h-4 w-4"/> DNI Correcto
                                </Badge>
                            ) : (dniValue.length === 8 && dniStatus === 'incorrect') ? (
                                <Badge variant="destructive" className="gap-1.5">
                                    <XCircle className="h-4 w-4"/> DNI Incorrecto
                                </Badge>
                            ) : null}
                          </div>
                          <FormMessage className="text-center" />
                      </FormItem>
                    )} />
                 </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
                <div className="flex gap-4">
                    <Button 
                        type="button"
                        variant={view === 'damages' ? 'destructive' : 'outline'}
                        className="w-full" 
                        onClick={() => setView(v => v === 'damages' ? 'idle' : 'damages')}
                    >
                        <ShieldX className="mr-2 h-4 w-4" />
                        Reportar Daños
                    </Button>
                     <Button
                        type="button"
                        className={cn(
                            "w-full",
                             view === 'suggestions' && "bg-amber-500 text-white hover:bg-amber-600"
                        )}
                        variant={view === 'suggestions' ? 'default' : 'outline'}
                        onClick={() => setView(v => v === 'suggestions' ? 'idle' : 'suggestions')}
                     >
                        <MessageSquarePlus className="mr-2 h-4 w-4" />
                        Añadir Sugerencias
                    </Button>
                </div>
                
                {view === 'damages' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Seleccionar Recursos Dañados</CardTitle>
                            <CardDescription>Marca los recursos que presenten algún daño. Estos se marcarán como "En Mantenimiento".</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                             {damageReportFields.map((field, index) => (
                                <ResourceReportItem 
                                    key={field.id}
                                    type="damage"
                                    resource={loan.resources[index]}
                                    form={form}
                                    index={index}
                                    categoryType={loan.resources[index].categoryType}
                                />
                             ))}
                        </CardContent>
                    </Card>
                )}

                {view === 'suggestions' && (
                     <Card>
                        <CardHeader>
                            <CardTitle>Añadir Sugerencias por Recurso</CardTitle>
                            <CardDescription>Deja sugerencias para el mantenimiento o mejora de cada recurso.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                             {suggestionFields.map((field, index) => (
                                <ResourceReportItem
                                    key={field.id}
                                    type="suggestion"
                                    resource={loan.resources[index]}
                                    form={form}
                                    index={index}
                                    categoryType={loan.resources[index].categoryType}
                                />
                             ))}
                        </CardContent>
                    </Card>
                )}
            </div>
          </div>
          <div className="lg:col-span-1 space-y-4 sticky top-8">
            <LoanReturnSummary loan={loan} />
            <Button 
                type="submit" 
                className="w-full"
                size="lg"
                disabled={isSubmitting || dniStatus !== 'correct'}
            >
                {isSubmitting ? (
                    <LoadingSpinner size="sm" />
                ) : (
                    <Check className="mr-2 h-4 w-4" />
                )}
                Confirmar Devolución
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
