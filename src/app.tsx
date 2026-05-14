import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { AppShell } from "./components/layout/app-shell";
import { ThemeProvider } from "./components/layout/theme-provider";
import { syncEmbedModeDom } from "./lib/embed";
import { HomePage } from "./pages/home-page";
import { ProfilePage } from "./pages/profile-page";

type AppProps = {
  embedMode?: boolean;
};

export function App({ embedMode = false }: AppProps) {
  useEffect(() => {
    syncEmbedModeDom(embedMode);

    return () => {
      syncEmbedModeDom(false);
    };
  }, [embedMode]);

  return (
    <ThemeProvider defaultTheme="light" enableSystem={false} attribute="class">
      <BrowserRouter>
        <AppShell embedMode={embedMode}>
          <Routes>
            <Route path="/" element={<HomePage embedMode={embedMode} />} />
            <Route path="/perfil/:username" element={<ProfilePage embedMode={embedMode} />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </ThemeProvider>
  );
}
