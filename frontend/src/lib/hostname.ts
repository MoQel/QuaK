const KIT_DOMAIN = 'kit.edu';

export function isKitHostname(hostname: string): boolean {
    const normalizedHostname = hostname.toLowerCase().replace(/\.$/, '');
    return normalizedHostname === KIT_DOMAIN || normalizedHostname.endsWith(`.${KIT_DOMAIN}`);
}
