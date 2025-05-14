import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Set document title
document.title = "Piglet Gambling Bot - Virtual Casino";

createRoot(document.getElementById("root")!).render(<App />);
