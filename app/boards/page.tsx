"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, Layout } from "lucide-react"

interface Workspace {
  id: number
  name: string
}

interface Board {
  id: number
  name: string
  workspaceId: number
  created_at: string
}

export default function BoardsPage() {
  const router = useRouter()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null)

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newBoardName, setNewBoardName] = useState("")
  const [newBoardWorkspace, setNewBoardWorkspace] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const res = await fetch("/api/workspaces")
        if (!res.ok) throw new Error("Failed to fetch workspaces")
        const data = await res.json()
        setWorkspaces(data)

        if (data.length > 0) {
          setSelectedWorkspace(data[0].id.toString())
          setNewBoardWorkspace(data[0].id.toString())
        }
      } catch (error) {
        console.error("Error fetching workspaces:", error)
      }
    }

    fetchWorkspaces()
  }, [])

  useEffect(() => {
    const fetchBoards = async () => {
      if (!selectedWorkspace) return

      setLoading(true)
      try {
        const res = await fetch(`/api/boards?workspaceId=${selectedWorkspace}`)
        if (!res.ok) throw new Error("Failed to fetch boards")
        const data = await res.json()
        setBoards(data)
      } catch (error) {
        console.error("Error fetching boards:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBoards()
  }, [selectedWorkspace])

  const handleCreateBoard = async () => {
    if (!newBoardName.trim() || !newBoardWorkspace) return

    setCreating(true)
    try {
      const res = await fetch("/api/boards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newBoardName,
          workspaceId: newBoardWorkspace,
        }),
      })

      if (!res.ok) throw new Error("Failed to create board")

      const newBoard = await res.json()
      setCreateDialogOpen(false)
      setNewBoardName("")

      // Refresh boards if we're viewing the same workspace
      if (selectedWorkspace === newBoardWorkspace) {
        setBoards((prev) => [...prev, newBoard])
      }

      // Navigate to the new board
      router.push(`/boards/${newBoard.id}`)
    } catch (error) {
      console.error("Error creating board:", error)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-2 ">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Boards</h1>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Board
        </Button>
      </div>

      {workspaces.length > 0 && (
        <div className="mb-6">
          <Select value={selectedWorkspace || undefined} onValueChange={(value) => setSelectedWorkspace(value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select workspace" />
            </SelectTrigger>
            <SelectContent>
              {workspaces.map((workspace) => (
                <SelectItem key={workspace.id} value={workspace.id.toString()}>
                  {workspace.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : boards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boards.map((board) => (
            <Link href={`/boards/${board.id}`} key={board.id}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Layout className="h-5 w-5 mr-2 text-primary" />
                    {board.name}
                  </CardTitle>
                  <CardDescription>Created {new Date(board.created_at).toLocaleDateString()}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Click to view board details and lists</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center p-12 border rounded-lg bg-muted/50">
          <h3 className="text-lg font-medium mb-2">No boards found</h3>
          <p className="text-muted-foreground mb-4">Create your first board to get started</p>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Board
          </Button>
        </div>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Board</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Board Name
              </label>
              <Input
                id="name"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                placeholder="Enter board name"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="workspace" className="text-sm font-medium">
                Workspace
              </label>
              <Select value={newBoardWorkspace || undefined} onValueChange={(value) => setNewBoardWorkspace(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select workspace" />
                </SelectTrigger>
                <SelectContent>
                  {workspaces.map((workspace) => (
                    <SelectItem key={workspace.id} value={workspace.id.toString()}>
                      {workspace.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={handleCreateBoard} disabled={creating || !newBoardName.trim() || !newBoardWorkspace}>
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Board"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
