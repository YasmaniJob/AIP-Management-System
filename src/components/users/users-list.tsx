// src/components/users/users-list.tsx
import { getUsers } from "@/lib/data/users";
import { getSystemSettings } from "@/lib/data/settings";
import { UsersView } from "./users-view";

interface UsersListProps {
    role: 'Docente' | 'Administrador';
}

export async function UsersList({ role }: UsersListProps) {
    const users = await getUsers({ role });
    // This call is now only for the teacher view, handled inside UsersView
    const settings = role === 'Docente' ? await getSystemSettings() : null;
    
    return (
        <UsersView 
            initialUsers={users}
            role={role}
            allowRegistration={settings?.allow_registration ?? false}
        />
    )
}
