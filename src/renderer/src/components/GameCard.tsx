import React from "react"
import { Link } from "react-router-dom"
import { IoIosPlay } from "react-icons/io"

type GameCardProps = {
  id: number
  title: string
  publisher: string
  imagePath: string
}

export default function GameCard({
  id,
  title,
  publisher,
  imagePath
}: GameCardProps): React.JSX.Element {
  return (
    <Link
      to={`/games/${id}`}
      className="
        bg-base-100 rounded-xl overflow-hidden
        shadow-lg transform transition
        hover:shadow-xl
      "
    >
      <div className="relative h-40 w-full bg-gray-100">
        {imagePath && (
          <img
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
            absolute inset-0 bg-black bg-opacity-30
            flex items-center justify-center
            opacity-0 hover:opacity-100 transition
          "
        >
          <IoIosPlay size={40} className="text-white" />
        </div>
      </div>
      <div className="p-2 h-20">
        <h3 className="text-base font-semibold line-clamp-2">{title}</h3>
        <p className="text-sm text-gray-500 line-clamp-2">{publisher}</p>
      </div>
    </Link>
  )
}
