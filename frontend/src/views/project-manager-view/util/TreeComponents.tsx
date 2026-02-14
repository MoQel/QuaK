import { JSX } from 'react';

/**
 * Displays empty content
 * @constructor
 */
export function Empty() {
    return <p className="text-center p-1 opacity-70 italic">Empty</p>;
}

/**
 * The default element inside the tree-view
 * @param text The text to display
 * @param icon The icon to use for the element
 * @constructor
 */
export function ListingElement({ text, icon }: Readonly<{ text: string; icon: JSX.Element }>) {
    return (
        <div className="flex self-center entry">
            {<icon.type {...icon.props} className="mr-1 h-5 w-5 self-center" />}
            {text}
        </div>
    );
}
