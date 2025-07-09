import React from "react"
import { Link } from "react-router-dom"
import { IoIosPlay } from "react-icons/io"
import DynamicImage from "./DynamicImage"

type GameCardProps = {
  id: string
  title: string
  publisher: string
  imagePath: string
  exePath: string
  onLaunchGame: (exePath: string) => void
}

export default function GameCard({
  id,
  title,
  publisher,
  imagePath,
  exePath,
  onLaunchGame
}: GameCardProps): React.JSX.Element {
  return (
    <div
      className="
        bg-base-100 rounded-xl overflow-hidden
        shadow-lg transform transition
        hover:shadow-xl
      "
    >
      <Link to={`/games/${id}`}>
        <div className="group relative h-40 w-full bg-gray-100">
          <DynamicImage
            src={imagePath || ""}
            alt={title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div
            className="
            absolute inset-0
            flex items-center justify-center
            opacity-0 group-hover:opacity-100
            transition-opacity
          "
          >
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                onLaunchGame(exePath)
              }}
              aria-label="ゲームを起動"
              className="bg-white/80
              rounded-full p-2 shadow-md
              flex items-center justify-center
              hover:bg-white/90 focus:outline-none
              focus:ring-2 focus:ring-primary
              transition"
            >
              <IoIosPlay size={32} className="pl-1 text-gray-600" />
            </button>
          </div>
        </div>
        <div className="p-2 h-20">
          <h3 className="text-base font-semibold line-clamp-2">{title}</h3>
          <p className="text-sm text-gray-500 line-clamp-2">{publisher}</p>
        </div>
      </Link>
    </div>
  )
}
