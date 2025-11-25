import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from "react-router-dom";
import { router } from "./router.tsx";

// Enable dark mode globally
document.documentElement.classList.add('dark');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
