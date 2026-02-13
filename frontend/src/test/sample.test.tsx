import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// Example component test
describe('Sample Test Suite', () => {
    it('should pass basic assertion', () => {
        expect(true).toBe(true);
    });

    it('should perform basic math', () => {
        expect(2 + 2).toBe(4);
    });
});

// Example: Testing a simple component
function HelloWorld({ name }: { name: string }) {
    return <h1>Hello, {name}!</h1>;
}

describe('HelloWorld Component', () => {
    it('should render with name prop', () => {
        render(<HelloWorld name="QuaK" />);
        expect(screen.getByText('Hello, QuaK!')).toBeInTheDocument();
    });
});
