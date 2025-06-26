import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { HashRouter } from "react-router-dom"
import { CredentialsProvider } from "./context/CredentialsProvider"
import App from "./App"
import "./assets/tailwind.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CredentialsProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </CredentialsProvider>
  </StrictMode>
)
