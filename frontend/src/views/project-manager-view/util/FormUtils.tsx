import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField } from '@/components/ui/form.tsx';
import { DialogCloseButtons, TextInput } from '@/views/project-manager-view/util/FormComponents.tsx';
import { useFocusSelection } from '@/hooks/useFocusSelection.ts';

const nameSchema = z.object({
    name: z.string().min(1, { message: 'Must be at least 1 character.' }),
});

interface EntityFormProps {
    defaultName?: string;
    onSubmit: (name: string) => void;
    label?: string;
    placeholder?: string;
    ignoreExtension?: boolean;
}

export function EntityForm({
    defaultName = '',
    onSubmit,
    label = 'Name',
    placeholder = 'Enter name',
    ignoreExtension = false,
}: Readonly<EntityFormProps>) {
    const inputRef = useFocusSelection(defaultName, ignoreExtension);

    const form = useForm<z.infer<typeof nameSchema>>({
        resolver: zodResolver(nameSchema),
        defaultValues: { name: defaultName },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => onSubmit(v.name))}>
                <FormField
                    name="name"
                    control={form.control}
                    render={({ field }) => (
                        <TextInput inputRef={inputRef} placeholder={placeholder} label={label} field={field} />
                    )}
                />
                <DialogCloseButtons submit="Save" />
            </form>
        </Form>
    );
}
