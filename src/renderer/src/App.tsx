// src/App.tsx
import { Routes, Route } from "react-router-dom"

import MainLayout from "./layouts/MainLayout"
import Cloud from "./pages/Cloud"
import GameDetail from "./pages/GameDetail"
import Home from "./pages/Home"
import MemoCreate from "./pages/MemoCreate"
import MemoEditor from "./pages/MemoEditor"
import MemoList from "./pages/MemoList"
import MemoView from "./pages/MemoView"
import Settings from "./pages/Settings"

export default function App(): React.JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="/game/:id" element={<GameDetail />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/cloud" element={<Cloud />} />
        {/* メモ関連ルート */}
        <Route path="/memo" element={<MemoList />} />
        <Route path="/memo/create" element={<MemoCreate />} />
        <Route path="/memo/list/:gameId" element={<MemoList />} />
        <Route path="/memo/new/:gameId" element={<MemoEditor />} />
        <Route path="/memo/edit/:memoId" element={<MemoEditor />} />
        <Route path="/memo/view/:memoId" element={<MemoView />} />
      </Route>
    </Routes>
  )
}
