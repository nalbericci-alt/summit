import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { SummitProvider } from "./app/state";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SummitProvider>
      <App />
    </SummitProvider>
  </StrictMode>,
);
