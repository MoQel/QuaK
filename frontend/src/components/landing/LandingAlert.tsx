import * as React from 'react';

import { cn } from '@quak/ui/lib/utils';

/** Error message of the landing and sign-in pages. */
function LandingAlert({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            role="alert"
            className={cn(
                'rounded-xl border-l-4 border-landing-error-border bg-landing-error-bg px-4 py-3 text-sm text-landing-error-text',
                className,
            )}
            {...props}
        />
    );
}

export { LandingAlert };
