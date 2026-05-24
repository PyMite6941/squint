import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import AppPage from "./pages/App";
import Pricing from "./pages/Pricing";
import Docs from "./pages/Docs";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app" element={<AppPage />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/docs" element={<Docs />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
