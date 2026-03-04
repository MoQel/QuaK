import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';

export function ProjectSection({
    title,
    description,
    icon,
    headerActions,
    children,
}: Readonly<{
    title: string;
    description: React.ReactNode;
    icon: React.ReactNode;
    headerActions?: React.ReactNode;
    children: React.ReactNode;
}>) {
    return (
        <Card className="border-2">
            <CardHeader>
                <div className="flex items-start gap-3">
                    {icon}
                    <div className="flex-1">
                        <CardTitle className="text-2xl text-left">{title}</CardTitle>
                        <CardDescription className="text-left">{description}</CardDescription>
                    </div>
                    {headerActions ? <div className="flex items-center gap-2">{headerActions}</div> : null}
                </div>
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}
