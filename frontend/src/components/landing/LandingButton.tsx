import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@quak/ui/lib/utils';

const landingButtonVariants = cva(
    'flex w-full rounded-xl cursor-pointer items-center justify-center gap-3 px-5 py-3.5 text-sm font-bold',
    {
        variants: {
            variant: {
                light: 'border border-landing-control-border bg-landing-surface hover:border-landing-accent hover:text-landing-accent-strong',
                dark: 'bg-landing-button-dark text-white hover:bg-black',
                dashed: 'border border-dashed border-landing-control-border bg-transparent hover:border-landing-accent hover:text-landing-accent-strong disabled:cursor-wait disabled:opacity-60',
            },
        },
        defaultVariants: {
            variant: 'light',
        },
    },
);

/** Full-width button of the landing and sign-in pages. */
function LandingButton({
    className,
    variant,
    type = 'button',
    ...props
}: React.ComponentProps<'button'> & VariantProps<typeof landingButtonVariants>) {
    return <button type={type} className={cn(landingButtonVariants({ variant }), className)} {...props} />;
}

export { LandingButton };
