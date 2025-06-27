// src/App.tsx
import { Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import GameDetail from "./pages/GameDetail"
import Settings from "./pages/Settings"
import MainLayout from "./layouts/MainLayout"

export default function App(): React.JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="/games/:id" element={<GameDetail />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
