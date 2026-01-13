import {DialogClose, DialogFooter} from "@/components/ui/dialog.tsx";
import {Button} from "@/components/ui/button.tsx";
import {ControllerRenderProps, FieldPath, FieldValues} from "react-hook-form";
import {FormControl, FormItem, FormLabel} from "@/components/ui/form.tsx";
import {Input} from "@/components/ui/input.tsx";

/**
 * Provides a {@link DialogFooter} with two buttons.
 * The submit-button is of type <i>submit</i>.
 * @param cancel The label of the cancel-button
 * @param submit The label of the submit-button
 * @constructor
 */
export function DialogCloseButtons({cancel = "Cancel", submit = "Submit"}: { cancel?: string, submit?: string }) {
    return (<DialogFooter>
        <DialogClose asChild>
            <Button variant="secondary">{cancel}</Button>
        </DialogClose>
        <DialogClose asChild>
            <Button variant="outline">{submit}</Button>
        </DialogClose>
    </DialogFooter>)
}

//This type is influenced by ControllerProps in 'react-hook-form'
type Field<TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>> = ControllerRenderProps<TFieldValues, TName>

/**
 * Provides a Text-input with a label
 * @param placeholder The placeholder text inside the {@link Input}
 * @param label The label to use for the input
 * @param field The field-object provided by the form
 * @constructor
 */
export function TextInput({placeholder, label, field}: {placeholder: string, label: string, field: Field}) {
    return (
        <FormItem className="pb-2">
            <FormLabel>{label}</FormLabel>
            <FormControl>
                <Input placeholder={placeholder} {...field}/>
            </FormControl>
        </FormItem>
    )
}