import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Set document title 
document.title = "Piglet Gambling Bot - Virtual Casino";

// Basic error handling for the root render
try {
  const rootElement = document.getElementById("root");
  if (rootElement) {
    createRoot(rootElement).render(<App />);
    console.log("App rendered successfully!");
  } else {
    console.error("Root element not found!");
    document.body.innerHTML = `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px; color: #333;">
        <h1>Piglet Gambling Bot</h1>
        <p>Unable to load the application. Please try refreshing the page.</p>
      </div>
    `;
  }
} catch (error) {
  console.error("Error rendering the app:", error);
  document.body.innerHTML = `
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px; color: #333;">
      <h1>Piglet Gambling Bot</h1>
      <p>An error occurred while loading the application. Please try again later.</p>
    </div>
  `;
}
