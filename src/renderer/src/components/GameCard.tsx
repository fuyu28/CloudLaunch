import React from "react"
import { Link } from "react-router-dom"
import { IoIosPlay } from "react-icons/io"
import type { Game } from "src/types/game"

type GameCardType = {
  game: Game
}

export default function GameCard({ game }: GameCardType): React.JSX.Element {
  return (
    <Link
      key={game.id}
      to={`/games/${game.id}`}
      className="
                bg-base-100 rounded-xl overflow-hidden
                shadow-lg transform transition
                 hover:shadow-xl
              "
    >
      <div className="relative h-40 w-full bg-gray-100">
        <img
          src={game.coverUrl}
          alt={game.title}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement
            img.onerror = null
            img.style.opacity = "0"
          }}
        />
        <div
          className="
                  absolute inset-0 bg-black bg-opacity-30
                  flex items-center justify-center
                  opacity-0 hover:opacity-100 transition
                "
        >
          <IoIosPlay size={40} className="text-white" />
        </div>
      </div>
      <div className="p-2 h-20">
        <h3 className="text-base font-semibold line-clamp-2">{game.title}</h3>
        <p className="text-sm text-gray-500 line-clamp-2">{game.publisher}</p>
      </div>
    </Link>
  )
}
