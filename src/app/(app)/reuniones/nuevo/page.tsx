// src/app/(app)/reuniones/nuevo/page.tsx
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { AddReunionView } from "@/components/reuniones/add-reunion-view";
import { getAreas } from "@/lib/data/settings";
import { getUsers } from "@/lib/data/users";

export default async function NuevaReunionPage() {
    const areasPromise = getAreas();
    const adminsPromise = getUsers({ role: 'Administrador' });

    const [areas, admins] = await Promise.all([areasPromise, adminsPromise]);

    return (
        <div className="space-y-4">
            <Breadcrumbs items={[
                { label: "Reuniones", href: "/reuniones" },
                { label: "Nueva Reunión" }
            ]}/>
            <AddReunionView areas={areas} admins={admins} />
        </div>
    );
}
