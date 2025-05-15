
import { Board } from "./_componenets/boards"

export default function Home() {
  return (
    <main className="min-h-screen  p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 text-2xl font-bold text-slate-800">Trello Clone</h1>
        <Board />
      </div>
    </main>
  )
}
