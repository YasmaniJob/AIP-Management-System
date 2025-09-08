import { getUsers } from "@/lib/data/users";
import { getSystemSettings } from "@/lib/data/settings";
import { DocentesViewClient } from "./docentes-view-client";

export async function DocentesView() {
    const users = await getUsers({ role: 'Docente' });
    const settings = await getSystemSettings();
    
    return (
        <DocentesViewClient 
            initialUsers={users}
            allowRegistration={settings?.allow_registration ?? false}
        />
    );
}