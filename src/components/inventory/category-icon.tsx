import {
  Laptop,
  Tablet,
  Projector,
  Headphones,
  HardDrive,
  Mouse,
  Router,
  Cable,
  Camera,
  Video,
  Monitor,
  Armchair,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: any = {
  Laptops: Laptop,
  Tablets: Tablet,
  Proyectores: Projector,
  'Cámaras Fotográficas': Camera,
  Filmadoras: Video,
  Periféricos: Mouse,
  Redes: Router,
  'Cables y Adaptadores': Cable,
  Audio: Headphones,
  'PCs de Escritorio': Monitor,
  Mobiliario: Armchair,
  Otros: HardDrive,
};

interface CategoryIconProps {
  type?: any;
  category?: any;
  color?: string;
  className?: string;
}

export function CategoryIcon({ type, category, color, className }: CategoryIconProps) {
  // Handle cases where type or category might be an object with name/type properties
  const categoryValue = type || category;
  const categoryKey = typeof categoryValue === 'object' ? categoryValue?.name || categoryValue?.type : categoryValue;
  const Icon = iconMap[categoryKey] || HardDrive;
  return <Icon className={cn("w-6 h-6", className)} style={{ color }} />;
}
