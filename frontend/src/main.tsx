import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "@/app/App";
import { AppProviders } from "@/app/providers/AppProviders";
import "@fontsource-variable/manrope";
import "@fontsource-variable/dm-sans";
import "@/app/styles/index.css";

const initialUrl = new URL(window.location.href);
if (initialUrl.searchParams.has("faixa") || initialUrl.searchParams.has("faixaAtiva")) {
  initialUrl.searchParams.delete("faixa");
  initialUrl.searchParams.delete("faixaAtiva");
  window.history.replaceState(window.history.state, "", initialUrl);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AppProviders>
        <App />
      </AppProviders>
    </BrowserRouter>
  </StrictMode>,
);
