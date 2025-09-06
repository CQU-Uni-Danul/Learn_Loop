import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";     // loads Tailwind & your global styles
import App from "./App.jsx";   // now rendering App instead of Login

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
