import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Prevent browser from restoring scroll position on reload
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}
window.scrollTo(0, 0);

createRoot(document.getElementById("root")!).render(<App />);
