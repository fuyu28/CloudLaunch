// src/App.tsx
import { Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import GameDetail from "./pages/GameDetail"

export default function App(): React.JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/games/:id" element={<GameDetail />} />
    </Routes>
  )
}
