import { Toaster } from '@/components/ui/sonner';
import { IdeLayout } from '@/components/IdeLayout';
import { usePreventKeyboardActions } from '@/hooks/usePreventKeyboardActions.ts';

function App() {
    usePreventKeyboardActions();
    return (
        <div className="h-full w-full bg-background text-foreground">
            <IdeLayout />

            <Toaster />
        </div>
    );
}

export default App;
