// src/components/settings/section-header.tsx
'use client';
import { Button } from '@/components/ui/button';
import { LucideIcon, Plus } from 'lucide-react';

interface SectionHeaderProps {
    title: string;
    icon: LucideIcon;
    buttonText: string;
    onButtonClick: () => void;
    description?: string;
}

export function SectionHeader({ 
    title, 
    icon: Icon, 
    buttonText, 
    onButtonClick, 
    description 
}: SectionHeaderProps) {
    return (
        <div className="relative">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent rounded-xl" />
            
            <div className="relative flex items-center justify-between p-6 border border-border/50 rounded-xl bg-card/50 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-md" />
                        <div className="relative p-3 rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                            <Icon className="h-6 w-6 text-primary-foreground" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            {title}
                        </h3>
                        {description && (
                            <p className="text-muted-foreground font-medium">{description}</p>
                        )}
                    </div>
                </div>
                <Button 
                    onClick={onButtonClick}
                    className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    size="lg"
                >
                    <Plus className="mr-2 h-5 w-5" />
                    {buttonText}
                </Button>
            </div>
        </div>
    );
}