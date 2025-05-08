import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { supabase } from "./lib/supabase";

import { TempoDevtools } from "tempo-devtools";
TempoDevtools.init();

// Initialize Supabase auth listener
supabase.auth.onAuthStateChange((event, session) => {
  console.log("Auth state changed:", event, !!session);

  // If user is signed out, clear localStorage
  if (event === "SIGNED_OUT") {
    localStorage.removeItem("currentUser");
  }
});

const basename = import.meta.env.BASE_URL;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
