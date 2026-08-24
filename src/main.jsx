import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router.jsx";
import { ShopProvider } from "./context/ShopContext.jsx";
import "./styles.css";

const router = getRouter();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ShopProvider>
      <RouterProvider router={router} />
    </ShopProvider>
  </React.StrictMode>
);
