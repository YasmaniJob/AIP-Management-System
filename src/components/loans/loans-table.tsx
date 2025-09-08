// src/components/loans/loans-table.tsx
'use client';
import { useState, useMemo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquareWarning, User, Calendar, Book, GraduationCap, Loader2 } from 'lucide-react';
import { CategoryIcon } from '../inventory/category-icon';
import { cn, singularize, parseNotes } from '@/lib/utils';
import { colors } from '@/lib/colors';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Card, CardContent } from '../ui/card';
import { Separator } from '../ui/separator';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { LoanCard } from './loan-card';
import { LoanActions } from './loan-actions';
import { LoanStatusBadge } from './loan-status-badge';
// Removed useLoanActions hook - using server actions directly in LoanActions component
import type { LoanWithResources, User, GradeWithSections } from '@/lib/types';

interface LoansTableProps {
  loans: LoanWithResources[];
  users: User[];
  gradesWithSections: GradeWithSections[];
  isHistory?: boolean;
  isPending?: boolean;
  userRole?: string;
  actionLoading?: any;
}

export function LoansTable({ loans, users, gradesWithSections, isHistory = false, isPending = false, userRole, actionLoading }: LoansTableProps) {
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any | null>(null);
  const [selectedResource, setSelectedResource] = useState<any | null>(null);
  const [processingLoan, setProcessingLoan] = useState<string | null>(null);
  
  // Actions are now handled directly in LoanActions component

  const handleShowDetails = (loan: LoanWithResources, resource: any) => {
    console.log('🔍 handleShowDetails called with:', { loan: loan.id, resource: resource.id });
    setSelectedLoan(loan);
    setSelectedResource(resource);
    console.log('📋 Setting modal state - selectedLoan:', loan.id, 'selectedResource:', resource.id);
    setIsDetailsModalOpen(true);
    console.log('🚪 Modal should be opening...');
  };

  // Parse loan details for the modal
  const parsedLoanDetails = useMemo(() => {
    if (!selectedLoan?.notes) {
      console.log('❌ No selectedLoan.notes available');
      return null;
    }
    const parsed = parseNotes(selectedLoan.notes);
    console.log('📋 parsedLoanDetails:', parsed);
    return parsed;
  }, [selectedLoan?.notes]);

  // Find specific report for the selected resource
  const specificReport = useMemo(() => {
    if (!parsedLoanDetails || !selectedResource) {
      console.log('❌ Missing data for specificReport:', { parsedLoanDetails: !!parsedLoanDetails, selectedResource: !!selectedResource });
      return null;
    }
    const report = parsedLoanDetails.reports.find(r => r.resourceId === selectedResource.id);
    console.log('🎯 specificReport search:', {
      selectedResourceId: selectedResource.id,
      availableResourceIds: parsedLoanDetails.reports.map(r => r.resourceId),
      foundReport: !!report,
      reportDetails: report
    });
    return report;
  }, [parsedLoanDetails, selectedResource]);
  
  const usersMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);
  const gradesMap = useMemo(() => new Map(gradesWithSections.map(g => [g.id, g])), [gradesWithSections]);
  
  const getUserById = useCallback((id: string) => usersMap.get(id), [usersMap]);

  const getGradeAndSection = useCallback((gradeId?: string, sectionId?: string) => {
    if (!gradeId || !sectionId) return { grade: 'N/A', section: 'N/A' };
    const grade = gradesMap.get(gradeId);
    const section = grade?.sections.find((s:any) => s.id === sectionId);
    return {
        grade: grade?.name || 'N/A',
        section: section?.name || 'N/A'
    }
  }, [gradesMap]);
  
  const isTeacherView = userRole === 'Docente';

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {loans.length > 0 ? loans.map((loan, index) => {
          const user = getUserById(loan.teacher_id);
          const { grade, section } = getGradeAndSection(loan.grade_id, loan.section_id);
          


          return (
            <Card key={loan.id} className={cn("shadow-none", index % 2 === 1 && "bg-primary/5")}>
              <CardContent className="p-0">
                <div className="p-4 space-y-4">
                  {/* Primera fila: Usuario y botones de acción */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                       <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold">{user?.name || 'Usuario Desconocido'}</p>
                        <p className="text-sm text-muted-foreground">{user?.role}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {/* Usar el componente LoanActions para los botones */}
                        <LoanActions 
                          loan={loan}
                          userRole={userRole}
                        />
                    </div>
                  </div>

                  {/* Segunda fila: Información del préstamo y estado */}
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="text-sm">
                      <div className="flex items-center gap-4 text-muted-foreground">
                          <div className="font-bold flex items-center gap-2">
                              <Book className="h-4 w-4 text-primary" />
                              <span className="text-foreground">{loan.area}</span>
                          </div>
                          <div className="flex items-center gap-2">
                              <GraduationCap className="h-4 w-4" />
                              <span>{grade} "{section}"</span>
                          </div>
                          <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>{isHistory ? loan.formattedActualReturnDate : loan.formattedLoanDateTime}</span>
                          </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-start lg:items-end gap-2">
                        {/* Usar el componente LoanStatusBadge */}
                        <LoanStatusBadge loan={loan} userRole={userRole} />
                    </div>
                  </div>
                </div>
                
                {loan.resources.length > 0 && (
                    <>
                        <Separator />
                        <div className="p-4 space-y-2">
                             <h4 className="text-sm text-muted-foreground font-semibold">Recursos ({loan.resources.length})</h4>
                             <div className="flex flex-wrap gap-2">
                                {loan.resources.map((resource: any) => {
                                    const resourceType = resource.categoryType ? singularize(resource.categoryType) : 'Recurso';
                                    const resourceCode = `${resourceType} ${resource.number}`;
                                    const resourceBrandModel = [resource.brand, resource.model].filter(Boolean).join(' ');

                                    const badgeVariant = 'secondary';
                                    const badgeClasses = "font-normal";

                                    const badgeContent = (
                                        <Badge
                                            variant={badgeVariant}
                                            className={badgeClasses}

                                        >
                                            <CategoryIcon type={typeof resource.categoryType === 'object' ? resource.categoryType?.type || resource.categoryType?.name : resource.categoryType} className="mr-1.5 h-3.5 w-3.5" />
                                            {resourceCode}

                                        </Badge>
                                    );

                                    // Verificar si hay daños (1-2) o sugerencias para este recurso
                                    const reportInfo = isHistory && loan.notes && (() => {
                                        const parsedNotes = parseNotes(loan.notes);
                                        const resourceReport = parsedNotes.reports.find(report => report.resourceId === resource.id);
                                        if (!resourceReport) return { hasDamages: false, hasSuggestions: false };
                                        
                                        const hasDamages = resourceReport.damages.length >= 1 && resourceReport.damages.length <= 2;
                                        const hasSuggestions = resourceReport.suggestions.length > 0;
                                        
                                        return { hasDamages, hasSuggestions };
                                    })() || { hasDamages: false, hasSuggestions: false };

                                    return (
                                        <div key={resource.id} className="flex items-center gap-1">
                                            <Tooltip>
                                                <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
                                                <TooltipContent>
                                                    {resourceBrandModel || "Sin detalles"}
                                                    {resource.notes && <p className="text-xs italic mt-1 max-w-xs">{resource.notes}</p>}
                                                </TooltipContent>
                                            </Tooltip>
                                            
                                            {/* Botón rojo para daños (1-2 daños) */}
                                            {reportInfo.hasDamages && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => handleShowDetails(loan, resource)}
                                                        >
                                                            <MessageSquareWarning className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        Ver daños registrados
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                            
                                            {/* Botón naranja para sugerencias */}
                                            {reportInfo.hasSuggestions && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                                            onClick={() => handleShowDetails(loan, resource)}
                                                        >
                                                            <MessageSquareWarning className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        Ver sugerencias
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>
                                    );
                                })}
                             </div>
                        </div>
                    </>
                )}
              </CardContent>
            </Card>
          )
        }) : (
          <div className="h-24 text-center flex items-center justify-center border rounded-lg">
            <p className="text-muted-foreground">No se encontraron préstamos.</p>
          </div>
        )}
      </div>

      {/* Modal de detalles de daños y sugerencias */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <MessageSquareWarning className="h-6 w-6 text-amber-500" />
              {selectedResource ? `Incidencias: ${(() => {
                const resourceType = selectedResource.categoryType ? singularize(selectedResource.categoryType) : 'Recurso';
                const brand = selectedResource.brand ? ` (${selectedResource.brand})` : '';
                return `${resourceType} ${selectedResource.number}${brand}`;
              })()}` : 'Reporte Detallado de Incidencias'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Información del Préstamo */}
            {selectedLoan && (
              <Card>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h3 className="font-semibold text-base flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Información del Docente
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium text-muted-foreground">Nombre:</span>
                          <span className="ml-2">{(() => {
                            const user = usersMap.get(selectedLoan.teacher_id);
                            return user?.name || 'Usuario no encontrado';
                          })()}</span>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">Email:</span>
                          <span className="ml-2">{(() => {
                            const user = usersMap.get(selectedLoan.teacher_id);
                            return user?.email || 'No disponible';
                          })()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="font-semibold text-base flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        Información Académica
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div>
                           <span className="font-medium text-muted-foreground">Grado:</span>
                           <span className="ml-2">{(() => {
                             const gradeSection = getGradeAndSection(selectedLoan.grade_id, selectedLoan.section_id);
                             return gradeSection.grade || 'No especificado';
                           })()}</span>
                         </div>
                         <div>
                           <span className="font-medium text-muted-foreground">Sección:</span>
                           <span className="ml-2">{(() => {
                             const gradeSection = getGradeAndSection(selectedLoan.grade_id, selectedLoan.section_id);
                             return gradeSection.section || 'No especificada';
                           })()}</span>
                         </div>
                      </div>
                    </div>
                  </div>
                  

                </CardContent>
              </Card>
            )}
            

            
            {/* Reporte de Incidencias */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Reporte de Incidencias</h3>
                  {parsedLoanDetails?.timestamp && (
                    <span className="text-gray-600 text-xs">
                      Fecha del Reporte: {parsedLoanDetails.timestamp}
                    </span>
                  )}
                </div>
                
                {(() => {
                  console.log('🖼️ Modal rendering - specificReport:', specificReport);
                  console.log('🖼️ Modal rendering - selectedResource:', selectedResource);
                  console.log('🖼️ Modal rendering - parsedLoanDetails:', parsedLoanDetails);
                  
                  if (specificReport) {
                    console.log('✅ Rendering specificReport content');
                    return (
                      <div className="space-y-4">
                        {specificReport.damages.length > 0 && (
                          <div className="border-l-4 border-red-500 pl-4">
                            <h4 className="font-semibold text-base text-red-600 mb-3 flex items-center gap-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              Daños Reportados ({specificReport.damages.length})
                            </h4>
                            <div className="space-y-2">
                              {specificReport.damages.map((damage, index) => (
                                <div key={index} className="bg-red-50 p-2 rounded-lg">
                                  <div className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <div className="flex-1">
                                      <p className="font-medium text-red-800">{typeof damage === 'object' ? (damage.name || damage.type || 'Daño no especificado') : String(damage)}</p>
                                      <p className="text-red-600 text-sm mt-1">Requiere atención inmediata</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {specificReport.damageNotes && (
                              <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded-lg">
                                <h5 className="font-medium text-red-800 text-sm mb-2">Notas Adicionales sobre Daños:</h5>
                                <p className="text-red-700 text-sm leading-relaxed">{specificReport.damageNotes}</p>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {specificReport.suggestions.length > 0 && (
                          <div className="border-l-4 border-amber-500 pl-4">
                            <h4 className="font-semibold text-base text-amber-600 mb-3 flex items-center gap-2">
                              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                              Sugerencias de Mejora ({specificReport.suggestions.length})
                            </h4>
                            <div className="space-y-2">
                              {specificReport.suggestions.map((suggestion, index) => (
                                <div key={index} className="bg-amber-50 p-2 rounded-lg">
                                  <div className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <div className="flex-1">
                                      <p className="font-medium text-amber-800">{typeof suggestion === 'object' ? (suggestion.name || suggestion.type || 'Sugerencia no especificada') : String(suggestion)}</p>
                                      <p className="text-amber-600 text-sm mt-1">Recomendación para optimizar el recurso</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {specificReport.suggestionNotes && (
                              <div className="mt-3 p-3 bg-amber-100 border border-amber-200 rounded-lg">
                                <h5 className="font-medium text-amber-800 text-sm mb-2">Notas Adicionales sobre Sugerencias:</h5>
                                <p className="text-amber-700 text-sm leading-relaxed">{specificReport.suggestionNotes}</p>
                              </div>
                            )}
                          </div>
                        )}

                      </div>
                    );
                  } else {
                    console.log('❌ Rendering "no reports found" message');
                    return (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <MessageSquareWarning className="h-8 w-8 text-gray-400" />
                        </div>
                        <h4 className="font-medium text-gray-900 mb-2">Sin Incidencias Reportadas</h4>
                        <p className="text-gray-500 text-sm">
                          No se encontraron daños o sugerencias para este recurso en el momento de la devolución.
                        </p>
                      </div>
                    );
                  }
                })()}
              </CardContent>
            </Card>
          </div>
          
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)} className="px-6">
              Cerrar Reporte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </TooltipProvider>
  );
}
