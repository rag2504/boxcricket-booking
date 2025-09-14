// Import jsxDEV fix first
import './lib/jsxdev-fix';

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
