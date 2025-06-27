// src/pages/Home.tsx
import { Link, useOutletContext } from "react-router-dom"
import { IoIosAdd } from "react-icons/io"
import type { sortName, filterName } from "src/types/menu"

type Game = {
  id: string
  title: string
  subtitle: string
  coverUrl: string
}

const sampleGames: Game[] = [
  {
    id: "1",
    title: "サクラノ刻 -櫻の森の下を歩む-",
    subtitle: "枕",
    coverUrl: "/assets/covers/1.jpg"
  },
  {
    id: "2",
    title: "2",
    subtitle: "2",
    coverUrl: "/assets/covers/2.jpg"
  },
  {
    id: "3",
    title: "3",
    subtitle: "3",
    coverUrl: "/assets/covers/3.jpg"
  },
  {
    id: "4",
    title: "4",
    subtitle: "4",
    coverUrl: "/assets/covers/4.jpg"
  },
  {
    id: "5",
    title: "5",
    subtitle: "5",
    coverUrl: "/assets/covers/5.jpg"
  },
  {
    id: "6",
    title: "6",
    subtitle: "6",
    coverUrl: "/assets/covers/6.jpg"
  }
]

type OutletContext = {
  sort: sortName
  filter: filterName
}

export default function Home(): React.JSX.Element {
  const { sort, filter } = useOutletContext<OutletContext>()
  return (
    <div className="min-h-screen bg-base-200 p-6">
      {/* グリッド */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {sampleGames.map((game) => (
          <Link
            key={game.id}
            to={`/games/${game.id}`}
            className="card card-compact bg-base-100 shadow hover:shadow-lg transition"
          >
            <figure>
              <img src={game.coverUrl} alt={game.title} className="h-40 w-full object-cover" />
            </figure>
            <div className="card-body p-4">
              <h3 className="card-title text-lg truncate">{game.title}</h3>
              <p className="text-sm text-gray-500 truncate">{game.subtitle}</p>
            </div>
          </Link>
        ))}
      </div>
      <button
        className="btn btn-primary btn-circle fixed bottom-6 right-6 shadow-lg h-15 w-15"
        aria-label="New"
      >
        <IoIosAdd className="p-2 w-full h-full" />
      </button>
    </div>
  )
}
