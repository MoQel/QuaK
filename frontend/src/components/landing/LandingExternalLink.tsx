import * as React from 'react';

/** Link to an external site that opens in a new tab. */
function LandingExternalLink({ children, ...props }: Readonly<Omit<React.ComponentProps<'a'>, 'target' | 'rel'>>) {
    return (
        <a target="_blank" rel="noopener noreferrer" {...props}>
            {children}
        </a>
    );
}

export { LandingExternalLink };
