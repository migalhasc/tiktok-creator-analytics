import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { App } from "./app";
import { isEmbedModeSearch, syncEmbedModeDom } from "./lib/embed";
import { queryClient } from "./lib/trpc";
import "./index.css";

const initialEmbedMode = isEmbedModeSearch(window.location.search);

syncEmbedModeDom(initialEmbedMode);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App embedMode={initialEmbedMode} />
    </QueryClientProvider>
  </React.StrictMode>,
);
