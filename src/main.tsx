
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log("🚀 Iniciando main.tsx...");
createRoot(document.getElementById("root")!).render(<App />);
console.log("✅ App renderizada en el DOM");
