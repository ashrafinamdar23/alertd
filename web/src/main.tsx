import React from "react";
import ReactDOM from "react-dom/client";
import "antd/dist/reset.css";
import { BrowserRouter } from "react-router-dom";
import App from "./App";


// Derive basename from Vite's base (build = "/app/", dev = "/")
const basename =
  (import.meta as any).env?.BASE_URL?.replace(/\/$/, "") || "";


ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);