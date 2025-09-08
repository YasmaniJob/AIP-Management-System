// src/components/dashboard/teacher-dashboard-view.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, BookOpen, Package, Clock, AlertTriangle, TrendingUp, Eye } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface TeacherDashboardViewProps {
    stats: {
        totalBookings: number;
        todayBookings: number;
        upcomingBookings: number;
        activeLoans: number;
        overdueLoans: number;
    };
    upcomingBookings: any[];
    activeLoans: any[];
    weeklyActivity: any[];
    resourceUsage: any[];
    teacherName: string;
}

export function TeacherDashboardView({
    stats,
    upcomingBookings,
    activeLoans,
    weeklyActivity,
    resourceUsage,
    teacherName
}: TeacherDashboardViewProps) {
    const chartConfig = {
        bookings: {
            label: "Reservas",
            color: "hsl(var(--chart-1))",
        },
        loans: {
            label: "Préstamos",
            color: "hsl(var(--chart-2))",
        },
    };

    return (
        <div className="space-y-6">
            {/* Header de bienvenida */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">¡Hola, {teacherName}!</h1>
                <p className="text-muted-foreground">
                    Aquí tienes un resumen de tu actividad académica de hoy, {format(new Date(), "EEEE, dd 'de' MMMM", { locale: es })}.
                </p>
            </div>

            {/* Estadísticas principales */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Reservas de Hoy</CardTitle>
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.todayBookings}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.todayBookings === 0 ? "No tienes reservas hoy" : 
                             stats.todayBookings === 1 ? "Tienes 1 reserva" : 
                             `Tienes ${stats.todayBookings} reservas`}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Próximas Reservas</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.upcomingBookings}</div>
                        <p className="text-xs text-muted-foreground">
                            En los próximos 7 días
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Préstamos Activos</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeLoans}</div>
                        <p className="text-xs text-muted-foreground">
                            Recursos en uso
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Préstamos Atrasados</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{stats.overdueLoans}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.overdueLoans === 0 ? "¡Todo al día!" : "Requieren atención"}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Reservas</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalBookings}</div>
                        <p className="text-xs text-muted-foreground">
                            Historial completo
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Próximas reservas */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Próximas Reservas</CardTitle>
                            <CardDescription>
                                Tus reservas más cercanas
                            </CardDescription>
                        </div>
                        <Button asChild variant="outline" size="sm">
                            <Link href="/reservas">
                                <Eye className="h-4 w-4 mr-2" />
                                Ver todas
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {upcomingBookings.length === 0 ? (
                            <div className="text-center py-6 text-muted-foreground">
                                <CalendarDays className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>No tienes reservas próximas</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {upcomingBookings.map((booking) => (
                                    <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Badge variant={booking.isToday ? "default" : booking.isTomorrow ? "secondary" : "outline"}>
                                                    {booking.isToday ? "Hoy" : booking.isTomorrow ? "Mañana" : booking.formattedDate}
                                                </Badge>
                                                <span className="text-sm font-medium">{booking.hour}</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {booking.area} • {booking.grade} {booking.section}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {booking.activity}
                                            </p>
                                        </div>
                                        <div className="text-right text-xs text-muted-foreground">
                                            {booking.hour}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Préstamos activos */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Préstamos Activos</CardTitle>
                            <CardDescription>
                                Recursos que tienes en uso
                            </CardDescription>
                        </div>
                        <Button asChild variant="outline" size="sm">
                            <Link href="/prestamos">
                                <Eye className="h-4 w-4 mr-2" />
                                Ver todos
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {activeLoans.length === 0 ? (
                            <div className="text-center py-6 text-muted-foreground">
                                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>No tienes préstamos activos</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {activeLoans.map((loan) => (
                                    <div key={loan.id} className="p-3 border rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <Badge variant={loan.isOverdue ? "destructive" : "default"}>
                                                {loan.isOverdue ? "Atrasado" : "Activo"}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {loan.formattedLoanDate}
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium">
                                                {loan.area} • {loan.grade} {loan.section}
                                            </p>
                                            <div className="flex flex-wrap gap-1">
                                                {loan.resources.map((resource, index) => (
                                                    <Badge key={index} variant="outline" className="text-xs">
                                                        {resource.name}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Actividad semanal */}
                <Card>
                    <CardHeader>
                        <CardTitle>Actividad de la Semana</CardTitle>
                        <CardDescription>
                            Reservas y préstamos de los últimos 7 días
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig}>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={weeklyActivity}>
                                    <XAxis dataKey="day" />
                                    <YAxis />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="bookings" fill="var(--color-bookings)" name="Reservas" />
                                    <Bar dataKey="loans" fill="var(--color-loans)" name="Préstamos" />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Uso de recursos */}
                <Card>
                    <CardHeader>
                        <CardTitle>Uso de Recursos</CardTitle>
                        <CardDescription>
                            Categorías de recursos más utilizadas
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {resourceUsage.length === 0 ? (
                            <div className="text-center py-6 text-muted-foreground">
                                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>No has utilizado recursos aún</p>
                            </div>
                        ) : (
                            <ChartContainer config={{}}>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={resourceUsage}
                                            dataKey="count"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            label={({ name, count }) => `${name}: ${count}`}
                                        >
                                            {resourceUsage.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}