import { createRoot } from "react-dom/client";
import { App } from "./App";
import { setWebviewLocale } from "../services/i18n";
import "../styles/styles.css";

setWebviewLocale("auto", window.__PC_LOCALE__);

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(<App />);
}
