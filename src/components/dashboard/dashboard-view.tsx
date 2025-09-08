// src/components/dashboard/dashboard-view.tsx
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Box, ArrowRightLeft, UserCheck, BellRing } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '../ui/chart';

interface DashboardViewProps {
    stats: {
        totalResources: number;
        availableResources: number;
        activeLoans: number;
        dueToday: number;
    };
    loanActivity: any[];
    resourceDistribution: any[];
}

export function DashboardView({ stats: dashboardStats, loanActivity, resourceDistribution }: DashboardViewProps) {
    const {
        totalResources,
        availableResources,
        activeLoans,
        dueToday
    } = dashboardStats;

    const stats = [
        { title: 'Recursos Totales', value: totalResources, icon: Box, color: 'text-primary' },
        { title: 'Disponibles', value: availableResources, icon: UserCheck, color: 'text-green-500' },
        { title: 'Préstamos Activos', value: activeLoans, icon: ArrowRightLeft, color: 'text-orange-500' },
        { title: 'Devoluciones Hoy', value: dueToday, icon: BellRing, color: 'text-red-500' },
    ];

    const chartConfig = {
        prestamos: {
          label: "Préstamos",
          color: "hsl(var(--primary))",
        },
    } satisfies any;
    
    const resourceChartConfig = resourceDistribution.reduce((acc, entry) => {
        acc[entry.name] = {
            label: entry.name,
            color: entry.color,
        };
        return acc;
    }, {} as any)

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 flex-shrink-0">
                {stats.map((stat) => (
                    <Card key={stat.title} className="shadow-none border">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                            <div className={`bg-secondary p-2 rounded-lg`}>
                                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>
             <div className="grid gap-4 md:grid-cols-2 flex-1 min-h-0">
                <Card className="flex flex-col">
                    <CardHeader className="flex-shrink-0">
                        <CardTitle>Actividad de Préstamos (Últimos 7 días)</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-0">
                         <ChartContainer config={chartConfig} className="h-full min-h-[200px]">
                            <BarChart data={loanActivity} width={455} height={256} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })} />
                                <YAxis allowDecimals={false} />
                                <Tooltip
                                    content={<ChartTooltipContent />}
                                    cursor={{ fill: "hsl(var(--muted))" }}
                                />
                                <Bar dataKey="count" fill="var(--color-prestamos)" radius={4} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
                 <Card className="flex flex-col">
                    <CardHeader className="flex-shrink-0">
                        <CardTitle>Distribución de Recursos</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-0">
                         <ChartContainer config={resourceChartConfig} className="h-full min-h-[200px]">
                            <PieChart width={455} height={256}>
                                <Tooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                                <Pie data={resourceDistribution} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                    {resourceDistribution.map((entry) => (
                                        <Cell key={`cell-${entry.name}`} fill={entry.color} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
