import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { GroupCompositeDialog } from './GroupCompositeDialog.tsx';

describe('GroupCompositeDialog', () => {
    it('renders input for composite gate name and calls onSubmit on submit', async () => {
        const onSubmit = vi.fn();
        const onOpenChange = vi.fn();

        render(<GroupCompositeDialog open={true} onOpenChange={onOpenChange} operationCount={2} onSubmit={onSubmit} />);

        expect(screen.getByText('Create Composite Gate')).toBeInTheDocument();
        const input = screen.getByLabelText('Gate Name');
        expect(input).toBeInTheDocument();

        fireEvent.change(input, { target: { value: 'my_composite' } });

        const submitBtn = screen.getByRole('button', { name: 'Group' });
        fireEvent.click(submitBtn);

        expect(onSubmit).toHaveBeenCalledWith('my_composite');
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('disables submit for invalid identifier', async () => {
        const onSubmit = vi.fn();
        render(<GroupCompositeDialog open={true} onOpenChange={vi.fn()} operationCount={1} onSubmit={onSubmit} />);

        const input = screen.getByLabelText('Gate Name');
        fireEvent.change(input, { target: { value: '123-invalid' } });

        const submitBtn = screen.getByRole('button', { name: 'Group' });
        expect(submitBtn).toBeDisabled();
    });
});
