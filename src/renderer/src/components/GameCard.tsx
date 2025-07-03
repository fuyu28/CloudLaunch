import React from "react"
import { Link } from "react-router-dom"
import { IoIosPlay } from "react-icons/io"
import DynamicImage from "./DynamicImage"

type GameCardProps = {
  id: number
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
        group
        bg-base-100 rounded-xl overflow-hidden
        shadow-lg transform transition
        hover:shadow-xl
      "
    >
      <button className="relative h-40 w-full bg-gray-100" onClick={() => onLaunchGame(exePath)}>
        {imagePath && (
          <DynamicImage
            src={imagePath}
            alt={title}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement
              img.onerror = null
              img.style.opacity = "0"
            }}
          />
        )}
        <div
          className="
            absolute inset-0
            flex items-center justify-center
            opacity-0 group-hover:opacity-100 transition-opacity
          "
        >
          <div className="bg-white/80  rounded-full p-2 shadow-md">
            <IoIosPlay size={40} className="pl-1 text-gray-700" />
          </div>
        </div>
      </button>
      <Link to={`/games/${id}`}>
        <div className="p-2 h-20">
          <h3 className="text-base font-semibold line-clamp-2">{title}</h3>
          <p className="text-sm text-gray-500 line-clamp-2">{publisher}</p>
        </div>
      </Link>
    </div>
  )
}
