import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { AppShell } from "./components/layout/app-shell";
import { ThemeProvider } from "./components/layout/theme-provider";
import { HomePage } from "./pages/home-page";
import { ProfilePage } from "./pages/profile-page";

export function App() {
  return (
    <ThemeProvider defaultTheme="light" enableSystem={false} attribute="class">
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/perfil/:username" element={<ProfilePage />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </ThemeProvider>
  );
}
