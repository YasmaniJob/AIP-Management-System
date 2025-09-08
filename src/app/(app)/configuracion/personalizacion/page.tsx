import { Metadata } from 'next';
import { CustomizationSettings } from '@/components/settings/customization-settings';
import { getSystemSettings } from '@/lib/actions/settings';

// Evitar prerendering estático debido al uso de cookies
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Personalización | Configuración',
  description: 'Personaliza el nombre, logo y tema de la aplicación',
};

export default async function CustomizationPage() {
  const settings = await getSystemSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Personalización</h1>
        <p className="text-muted-foreground">
          Personaliza el nombre, logo y tema de la aplicación.
        </p>
      </div>
      
      <CustomizationSettings initialSettings={settings} />
    </div>
  );
}