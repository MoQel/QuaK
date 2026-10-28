import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LoopBlockDialog } from './LoopBlockDialog.tsx';

describe('LoopBlockDialog', () => {
    it('renders Add Loop mode with default repeat count 2', async () => {
        const onSubmit = vi.fn();
        const onClose = vi.fn();

        render(
            <LoopBlockDialog
                draft={{ id: 'd1', operationIds: ['op1', 'op2'] }}
                onSubmit={onSubmit}
                onClose={onClose}
            />,
        );

        expect(screen.getByText('Repeat')).toBeInTheDocument();
        const input = screen.getByLabelText('Repetitions') as HTMLInputElement;
        expect(input.value).toBe('2');

        const submitBtn = screen.getByRole('button', { name: 'Add loop' });
        fireEvent.click(submitBtn);

        expect(onSubmit).toHaveBeenCalledWith(['op1', 'op2'], 2, undefined);
        expect(onClose).toHaveBeenCalled();
    });

    it('renders Edit Loop mode with initial repeat count', async () => {
        const onSubmit = vi.fn();
        const onClose = vi.fn();

        render(
            <LoopBlockDialog
                draft={{
                    id: 'd2',
                    operationIds: ['op1'],
                    initialRepeatCount: 4,
                    isEditing: true,
                    loopBlockId: 'loop-123',
                }}
                onSubmit={onSubmit}
                onClose={onClose}
            />,
        );

        expect(screen.getByText('Edit Loop')).toBeInTheDocument();
        const input = screen.getByLabelText('Repetitions') as HTMLInputElement;
        expect(input.value).toBe('4');

        fireEvent.change(input, { target: { value: '5' } });

        const saveBtn = screen.getByRole('button', { name: 'Save changes' });
        fireEvent.click(saveBtn);

        expect(onSubmit).toHaveBeenCalledWith(['op1'], 5, 'loop-123');
        expect(onClose).toHaveBeenCalled();
    });
});
