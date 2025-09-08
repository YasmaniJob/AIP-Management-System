// src/components/settings/security-settings.tsx
'use client';

import { useState } from 'react';
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from '@/hooks/use-toast';
import { updateSettingsAction } from '@/lib/actions/settings';
import { useServerAction } from '@/hooks/use-server-action';
import type { SystemSettings } from '@/lib/types';

interface SecuritySettingsProps {
    settings: SystemSettings | null;
}

export function SecuritySettings({ settings }: SecuritySettingsProps) {
    const [allowRegistration, setAllowRegistration] = useState(settings?.allow_registration || false);
    const { toast } = useToast();

    const { execute: executeUpdateSettings } = useServerAction(
        updateSettingsAction,
        {
            successMessage: 'Configuración actualizada correctamente'
        }
    );

    const handleToggle = (checked: boolean) => {
        setAllowRegistration(checked);
        executeUpdateSettings({ allow_registration: checked });
    }

    return (
        <div className="flex items-center space-x-4 rounded-lg border p-4">
            <div className="flex-1 space-y-1">
                 <Label htmlFor="registration-switch" className="text-base font-semibold">
                    Habilitar Registro Público
                </Label>
                <p className="text-sm text-muted-foreground">
                    Permite que nuevos usuarios (docentes) se registren por su cuenta. 
                    Cuando está desactivado, solo los administradores pueden crear nuevos usuarios.
                </p>
            </div>
             <Switch
                id="registration-switch"
                checked={allowRegistration}
                onCheckedChange={handleToggle}
            />
        </div>
    );
}
