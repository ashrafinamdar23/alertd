import React from "react";
import ReactDOM from "react-dom/client";
import "antd/dist/reset.css";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { message } from "antd";
import ToastProvider from "./providers/ToastProvider";

message.config({ maxCount: 3, top: 16 });
// Derive basename from Vite's base (build = "/app/", dev = "/")
const basename =
  (import.meta as any).env?.BASE_URL?.replace(/\/$/, "") || "";


ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
     <ToastProvider>
      <App />
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);