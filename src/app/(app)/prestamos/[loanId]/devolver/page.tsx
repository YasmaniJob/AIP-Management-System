// src/app/(app)/prestamos/[loanId]/devolver/page.tsx
import { ReturnLoanView } from "@/components/loans/return-loan-view";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getLoanById } from "@/lib/data/loans";

export default async function DevolverPrestamoPage({ params }: { params: { loanId: string } }) {
    const { loanId } = await params;
    const loanData = await getLoanById(loanId);

    if (!loanData || !loanData.user) {
        notFound();
    }
    
    return (
        <div className="space-y-4">
             <div className="flex justify-between items-center">
                <Breadcrumbs items={[
                    { label: 'Préstamos', href: '/prestamos' },
                    { label: 'Devolver Préstamo' }
                ]} />
                 <Button variant="outline" asChild>
                    <Link href="/prestamos">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Atrás
                    </Link>
                </Button>
            </div>
            <ReturnLoanView loan={loanData} />
        </div>
    );
}
