import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from "react-router-dom";
import { router } from "./router.tsx";
import { ThemeProvider } from "@/theme";
import {initQulacs} from "qulacs-wasm";

// Enable dark mode globally
//document.documentElement.classList.add('dark');
initQulacs().then(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <ThemeProvider>
            <RouterProvider router={router} />
        </ThemeProvider>
      </StrictMode>
    )
}).catch((err) => {
    console.error("Fehler beim Laden von qulacs-wasm:", err);
});
