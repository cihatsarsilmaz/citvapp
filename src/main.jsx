import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { startPwa } from "./pwa";
import "./styles.css";
import "./slot5.css";
import "./character.css";
import "./gate.css";
import "./lux.css";
import "./play.css";
import "./floor.css";

startPwa();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
