import { describe, expect, it } from 'vitest';
import { isKitHostname } from './hostname';

describe('isKitHostname', () => {
    it.each(['kit.edu', 'quak.kit.edu', 'service.subdomain.kit.edu'])('accepts the KIT hostname %s', (hostname) => {
        expect(isKitHostname(hostname)).toBe(true);
    });

    it.each(['localhost', 'example.com', 'kit.edu.example.com', 'notkit.edu'])(
        'rejects the non-KIT hostname %s',
        (hostname) => {
            expect(isKitHostname(hostname)).toBe(false);
        },
    );
});
