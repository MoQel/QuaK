import { Toaster } from '@/components/ui/sonner';
import { IdeLayout } from '@/components/IdeLayout';

function App() {
    return (
        <div className="h-full w-full bg-background text-foreground">
            {/* The entire IDE logic and state is encapsulated here */}
            <IdeLayout />

            <Toaster />
        </div>
    );
}

export default App;
