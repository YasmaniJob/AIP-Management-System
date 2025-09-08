// src/components/reuniones/meetings-view.tsx
'use client';
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ListTodo, Users2, Calendar, Check, Circle, Hourglass, Briefcase, UserCog, User, Hand, MoreHorizontal, Search } from "lucide-react";
import { colors } from "@/lib/colors";
import { useToast } from "@/hooks/use-toast";
import { updateTaskStatusAction } from "@/lib/actions/meetings";
import { cn } from "@/lib/utils";
import { Card } from "../ui/card";
import { roleColorMap } from "@/lib/constants";
import type { MeetingWithDetails } from "@/lib/types";
import { Button } from "../ui/button";

const statusCycle: TaskStatus[] = ['Pendiente', 'En Progreso', 'Completada'];

const statusConfig = {
    'Pendiente': { variant: 'destructive', icon: Circle, label: 'Pendiente' },
    'En Progreso': { variant: 'default', icon: Hourglass, label: 'En Progreso' },
    'Completada': { variant: 'secondary', icon: Check, label: 'Completada' },
} as const;

type TaskStatus = keyof typeof statusConfig;

const participantIconMap: Record<string, React.ElementType> = {
    "Director(a)": Briefcase,
    "Sub-Director(a)": UserCog,
    "Coordinadores": Users2,
    "Docentes": User,
    "Auxiliares": Hand,
    "Otros": MoreHorizontal,
};

const getParticipantBaseInfo = (groupName: string) => {
    const baseName = groupName.split(' ')[0].split('(')[0];
    const Icon = participantIconMap[baseName] || participantIconMap[groupName] || MoreHorizontal;
    const color = roleColorMap[baseName] || roleColorMap[groupName] || roleColorMap['Otros'];
    return { Icon, color };
};

export function MeetingsView({ initialMeetings }: { initialMeetings: MeetingWithDetails[] }) {
    const [meetings, setMeetings] = useState(initialMeetings);
    const { toast } = useToast();

    const handleStatusChange = (taskId: string, currentStatus: TaskStatus) => {
        const currentIndex = statusCycle.indexOf(currentStatus);
        const nextIndex = (currentIndex + 1) % statusCycle.length;
        const newStatus = statusCycle[nextIndex];
        
        updateTaskStatusAction({ taskId: taskId, status: newStatus }).then(result => {
             if (result.success) {
                toast({ title: 'Estado actualizado', description: `La tarea ahora está ${newStatus.toLowerCase()}.` });
                 setMeetings(currentMeetings => 
                    currentMeetings.map(meeting => ({
                        ...meeting,
                        tasks: meeting.tasks.map((task: any) => 
                            task.id === taskId ? { ...task, status: newStatus } : task
                        )
                    }))
                );
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            }
        });
    }

    if (initialMeetings.length === 0) {
        return (
            <div className="text-center py-16 border border-dashed rounded-lg">
                <p className="text-muted-foreground">No hay reuniones registradas.</p>
                <p className="text-sm text-muted-foreground mt-2">Empieza por crear una nueva reunión.</p>
            </div>
        );
    }
    
    return (
        <Accordion type="single" collapsible className="w-full space-y-4">
            {meetings.map((meeting, index) => {
                const totalTasks = meeting.tasks.length;
                const completedTasks = meeting.tasks.filter((task: any) => task.status === 'Completada').length;

                const TaskStatusBadge = () => {
                    if (totalTasks === 0) {
                        return <div className="flex items-center gap-1 text-sm text-muted-foreground"><ListTodo className="h-4 w-4" /><span>Sin Tareas</span></div>;
                    }
                    if (totalTasks === completedTasks) {
                        return <Badge variant="secondary" className={colors.success.badge}><CheckCircle2 className="h-4 w-4 mr-1.5"/> Tareas Completadas</Badge>;
                    }
                    return <div className="flex items-center gap-1 text-sm"><ListTodo className="h-4 w-4 text-muted-foreground" /><span>{completedTasks}/{totalTasks} Tareas Completadas</span></div>;
                }

                return (
                <AccordionItem value={meeting.id} key={meeting.id} className="border-b-0">
                    <Card className={cn("shadow-none border", index % 2 === 1 && "bg-primary/5")}>
                        <AccordionTrigger className="p-4 hover:no-underline text-foreground data-[state=open]:text-primary data-[state=open]:font-bold">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full text-left gap-4">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg">{meeting.title}</h3>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                        <Calendar className="h-4 w-4" />
                                        <time dateTime={meeting.date}>
                                            {format(new Date(meeting.date), "dd 'de' MMMM, yyyy", { locale: es })}
                                        </time>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <TaskStatusBadge />
                                    <div className="flex items-center gap-1 text-sm">
                                        <Users2 className="h-4 w-4 text-muted-foreground" />
                                        <span>{meeting.participant_groups.length} Participantes</span>
                                    </div>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="p-4 pt-0">
                                <div className="border-t pt-4 space-y-4">
                                     <div>
                                        <h4 className="font-semibold text-sm mb-2">Actores Educativos</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {meeting.participant_groups.map((group: string, index: number) => {
                                                const { Icon, color } = getParticipantBaseInfo(group);
                                                return (
                                                    <Badge key={index} variant="secondary" className="text-white" style={{ backgroundColor: color }}>
                                                      <Icon className="mr-1.5 h-3.5 w-3.5" />
                                                      {group}
                                                    </Badge>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm mb-2">Acuerdos y Tareas</h4>
                                        <div className="space-y-2">
                                            {meeting.tasks.length > 0 ? meeting.tasks.map((task: any, index: number) => {
                                                const config = statusConfig[task.status as TaskStatus] || statusConfig['Pendiente'];
                                                return (
                                                    <Button 
                                                        key={task.id} 
                                                        variant="ghost"
                                                        className="w-full h-auto justify-between p-2 rounded-md bg-muted/50 text-foreground hover:bg-muted/50 hover:text-foreground focus:bg-muted/60"
                                                        onClick={() => handleStatusChange(task.id, task.status)}
                                                    >
                                                        <div className="flex items-center gap-3 text-left">
                                                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-background border shrink-0">
                                                                <span className="font-bold text-sm text-primary">{index + 1}</span>
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-sm">{task.title}</p>
                                                                {task.notes && <p className="text-xs text-muted-foreground">{task.notes}</p>}
                                                            </div>
                                                        </div>
                                                        <Badge variant={config.variant as any} className={cn("h-auto px-2 py-1 text-xs", task.status === 'Completada' && colors.success.badge)}>
                                                            <config.icon className="mr-1.5 h-3 w-3" />
                                                            {config.label}
                                                        </Badge>
                                                    </Button>
                                            )}) : <p className="text-sm text-muted-foreground text-center py-4">No se definieron tareas para esta reunión.</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </AccordionContent>
                    </Card>
                </AccordionItem>
                )})}
        </Accordion>
    );
}
