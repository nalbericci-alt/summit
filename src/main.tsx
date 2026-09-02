import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { registerSW } from "virtual:pwa-register";
import { SummitProvider } from "./app/state";
import "./styles.css";

// Register the service worker at startup so every screen checks for a new build and reloads onto it.
registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SummitProvider>
      <App />
    </SummitProvider>
  </StrictMode>,
);
