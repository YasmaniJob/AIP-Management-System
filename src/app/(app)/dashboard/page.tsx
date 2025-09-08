// src/app/(app)/dashboard/page.tsx
import { DashboardView } from '@/components/dashboard/dashboard-view';
import { TeacherDashboardView } from '@/components/dashboard/teacher-dashboard-view';
import AdminQuickAccess from '@/components/dashboard/admin-quick-access';
import { Suspense } from 'react';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';
import { TeacherDashboardSkeleton } from '@/components/dashboard/teacher-dashboard-skeleton';
import { getDashboardStats, getLoanActivity, getResourceDistribution } from '@/lib/data/dashboard';
import { 
    getTeacherDashboardStats, 
    getTeacherUpcomingBookings, 
    getTeacherActiveLoans, 
    getTeacherWeeklyActivity, 
    getTeacherResourceUsage 
} from '@/lib/data/teacher-dashboard';
import { getCurrentUser } from '@/lib/actions/auth';
import { redirect } from 'next/navigation';

async function AdminDashboardData() {
    return (
        <AdminQuickAccess />
    );
}

async function AdminDetailedDashboardData() {
    const stats = await getDashboardStats();
    const loanActivity = await getLoanActivity();
    const resourceDistribution = await getResourceDistribution();

    return (
        <DashboardView 
            stats={stats}
            loanActivity={loanActivity}
            resourceDistribution={resourceDistribution}
        />
    );
}

async function TeacherDashboardData({ teacherId, teacherName }: { teacherId: string; teacherName: string }) {
    const [stats, upcomingBookings, activeLoans, weeklyActivity, resourceUsage] = await Promise.all([
        getTeacherDashboardStats(teacherId),
        getTeacherUpcomingBookings(teacherId),
        getTeacherActiveLoans(teacherId),
        getTeacherWeeklyActivity(teacherId),
        getTeacherResourceUsage(teacherId)
    ]);

    return (
        <TeacherDashboardView 
            stats={stats}
            upcomingBookings={upcomingBookings}
            activeLoans={activeLoans}
            weeklyActivity={weeklyActivity}
            resourceUsage={resourceUsage}
            teacherName={teacherName}
        />
    );
}

export default async function DashboardPage() {
    const user = await getCurrentUser();
    
    if (!user) {
        redirect('/');
    }

    const isTeacher = user.role === 'Docente';
    const dashboardTitle = isTeacher ? 'Mi Espacio Académico' : 'Visión General';

    return (
        <div className="h-full flex flex-col">
            <Suspense fallback={isTeacher ? <TeacherDashboardSkeleton /> : <DashboardSkeleton />}>
                {isTeacher ? (
                    <TeacherDashboardData teacherId={user.id} teacherName={user.name} />
                ) : (
                    <AdminDashboardData />
                )}
            </Suspense>
        </div>
    );
}
