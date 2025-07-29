import { useAtom } from "jotai"
import { useEffect, useState, useCallback } from "react"
import { IoIosAdd } from "react-icons/io"

import FloatingButton from "@renderer/components/FloatingButton"
import GameGrid from "@renderer/components/GameGrid"
import GameFormModal from "@renderer/components/GameModal"
import GameSearchFilter from "@renderer/components/GameSearchFilter"

import { CONFIG, MESSAGES } from "../../../constants"
import { useDebounce } from "../hooks/useDebounce"
import { useGameActions } from "../hooks/useGameActions"
import { useLoadingState } from "../hooks/useLoadingState"
import {
  searchWordAtom,
  filterAtom,
  sortAtom,
  sortDirectionAtom,
  visibleGamesAtom
} from "../state/home"
import type { GameType } from "src/types/game"

export default function Home(): React.ReactElement {
  const [searchWord, setSearchWord] = useAtom(searchWordAtom)
  const [filter, setFilter] = useAtom(filterAtom)
  const [sort, setSort] = useAtom(sortAtom)
  const [sortDirection, setSortDirection] = useAtom(sortDirectionAtom)
  const [visibleGames, setVisibleGames] = useAtom(visibleGamesAtom)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 検索語をデバウンス
  const debouncedSearchWord = useDebounce(searchWord, CONFIG.TIMING.SEARCH_DEBOUNCE_MS)

  // ローディング状態管理
  const gameListLoading = useLoadingState()
  const gameActionLoading = useLoadingState()

  // ゲーム操作フック
  const { createGameAndRefreshList } = useGameActions({
    searchWord: debouncedSearchWord,
    filter,
    sort,
    sortDirection,
    onGamesUpdate: setVisibleGames,
    onModalClose: () => setIsModalOpen(false)
  })

  useEffect(() => {
    let cancelled = false

    const fetchGames = async (): Promise<void> => {
      const games = await gameListLoading.executeWithLoading(
        () => window.api.database.listGames(debouncedSearchWord, filter, sort, sortDirection),
        {
          errorMessage: MESSAGES.GAME.LIST_FETCH_FAILED,
          showToast: true
        }
      )

      if (!cancelled && games) {
        setVisibleGames(games as GameType[])
      }
    }

    fetchGames()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchWord, filter, sort, sortDirection])

  const handleAddGame = createGameAndRefreshList

  const handleLaunchGame = useCallback(
    async (exePath: string) => {
      await gameActionLoading.executeWithLoading(
        async () => {
          const result = await window.api.game.launchGame(exePath)
          if (!result.success) {
            throw new Error(result.message)
          }
          return result
        },
        {
          loadingMessage: MESSAGES.GAME.LAUNCHING,
          successMessage: MESSAGES.GAME.LAUNCHED,
          errorMessage: MESSAGES.GAME.LAUNCH_FAILED,
          showToast: true
        }
      )
    },
    [gameActionLoading]
  )

  return (
    <div className="flex flex-col h-full min-h-0 relative">
      {/* 検索・フィルタ領域 */}
      <GameSearchFilter
        searchWord={searchWord}
        sort={sort}
        sortDirection={sortDirection}
        filter={filter}
        onSearchWordChange={setSearchWord}
        onSortChange={setSort}
        onSortDirectionChange={setSortDirection}
        onFilterChange={setFilter}
      />

      {/* ゲーム一覧 */}
      <GameGrid games={visibleGames} onLaunchGame={handleLaunchGame} />

      {/* ゲーム追加ボタン */}
      <FloatingButton
        onClick={() => setIsModalOpen(true)}
        ariaLabel="ゲームを追加"
        positionClass="bottom-16 right-6"
      >
        <IoIosAdd size={28} />
      </FloatingButton>

      {/* ゲーム登録モーダル */}
      <GameFormModal
        mode="add"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddGame}
      />
    </div>
  )
}
