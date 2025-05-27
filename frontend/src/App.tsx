import './App.css'
import {useEffect} from "react";
import ModelView from "@/components/ModelView.tsx";
import {Button} from "@/components/ui/button.tsx";

function App() {
    useEffect(() => {
        document.documentElement.classList.add('dark');
    }, []);
    return (
        <>
            <div className="flex flex-col h-screen">
                <div className="flex-1 overflow-auto">
                    <ModelView/>
                </div>
                <Button variant="secondary" className="cursor-pointer">Transform</Button>
            </div>
        </>
    )
}

export default App
