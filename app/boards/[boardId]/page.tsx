"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable"
import { List } from "@/components/list"
import { Card } from "@/components/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, X, ArrowLeft, MoreHorizontal, Loader2, ChevronLeftCircle, ChevronLeft } from "lucide-react"
import { CardDialog } from "@/components/card-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import type { Board, Card as CardType } from "@/lib/types"
import { useParams } from 'next/navigation'
import { ModeToggle } from "@/components/ThemeToggle"
import { cn } from "@/lib/utils"
import { BoardMembers } from "@/components/board-members"
import { currentUser } from "@/lib/auth"
import { useUser } from "@clerk/nextjs"

export default function BoardPage() {
  const {  user, isLoaded } = useUser();
  const params = useParams<{ boardId: string}>()
  const router = useRouter()
  const [board, setBoard] = useState<Board | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeList, setActiveList] = useState<string | null>(null)

  const [newListName, setNewListName] = useState("")
  const [showNewListInput, setShowNewListInput] = useState(false)
  const [addingList, setAddingList] = useState(false)

  const [selectedCard, setSelectedCard] = useState<CardType | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const [renameBoardDialogOpen, setRenameBoardDialogOpen] = useState(false)
  const [newBoardName, setNewBoardName] = useState("")
  const [renamingBoard, setRenamingBoard] = useState(false)

  const [deleteBoardDialogOpen, setDeleteBoardDialogOpen] = useState(false)
  const [deletingBoard, setDeletingBoard] = useState(false)

  useEffect(() => {
    const fetchBoard = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/boards/${params.boardId}`)
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Board not found")
          }
          throw new Error("Failed to fetch board")
        }
        const data = await res.json()
        setBoard(data)
        setNewBoardName(data.name)
      } catch (error) {
        console.error("Error fetching board:", error)
        setError(error instanceof Error ? error.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchBoard()
  }, [params.boardId])

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Find the active card and its list
  const findCardList = (cardId: string) => {
    if (!board) return null
    const numericCardId = Number.parseInt(cardId.replace("card-", ""))
    return board.lists?.find((list) => list.cards?.some((card) => card.id === numericCardId))
  }

  const findCard = (cardId: string) => {
    if (!board) return null
    const numericCardId = Number.parseInt(cardId.replace("card-", ""))
    for (const list of board.lists || []) {
      const card = list.cards?.find((card) => card.id === numericCardId)
      if (card) return card
    }
    return null
  }

  // Handle drag start
  const handleDragStart = (event: any) => {
    const { active } = event
    setActiveId(active.id)

    // Find which list the card belongs to
    if (active.id.startsWith("card-")) {
      const list = findCardList(active.id)
      if (list) {
        setActiveList(`list-${list.id}`)
      }
    }
  }

  // Handle drag end
  const handleDragEnd = async (event: any) => {
    const { active, over } = event

    if (!over || !board) {
      setActiveId(null)
      setActiveList(null)
      return
    }

    // Handle list reordering
    if (active.id.startsWith("list-") && over.id.startsWith("list-") && active.id !== over.id) {
      const activeListId = Number.parseInt(active.id.replace("list-", ""))
      const overListId = Number.parseInt(over.id.replace("list-", ""))

      const activeListIndex = board.lists?.findIndex((list) => list.id === activeListId) ?? -1
      const overListIndex = board.lists?.findIndex((list) => list.id === overListId) ?? -1

      if (activeListIndex !== -1 && overListIndex !== -1 && board.lists) {
        const newLists = arrayMove(board.lists, activeListIndex, overListIndex)

        // Update positions
        const updatedLists = newLists.map((list, index) => ({
          ...list,
          position: index + 1,
        }))

        // Optimistically update UI
        setBoard({
          ...board,
          lists: updatedLists,
        })

        // Update in database
        try {
          for (const list of updatedLists) {
            await fetch(`/api/lists/${list.id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ position: list.position }),
            })
          }
        } catch (error) {
          console.error("Error updating list positions:", error)
          // Revert optimistic update on error
          fetchBoard()
        }
      }
    }

    // Handle card movement
    if (active.id.startsWith("card-") && (over.id.startsWith("list-") || over.id.startsWith("card-"))) {
      const activeCardId = Number.parseInt(active.id.replace("card-", ""))
      const sourceList = findCardList(active.id)

      if (!sourceList) {
        setActiveId(null)
        setActiveList(null)
        return
      }

      // If dropping onto a list
      if (over.id.startsWith("list-")) {
        const destinationListId = Number.parseInt(over.id.replace("list-", ""))
        const destinationList = board.lists?.find((list) => list.id === destinationListId)

        if (destinationList && sourceList.id !== destinationList.id) {
          // Calculate new position (at the end of the destination list)
          const newPosition =
            destinationList.cards && destinationList.cards.length > 0
              ? Math.max(...destinationList.cards.map((c) => c.position)) + 1
              : 1

          // Find the card
          const card = sourceList.cards?.find((c) => c.id === activeCardId)

          if (card) {
            // Optimistically update UI
            const newSourceCards = sourceList.cards?.filter((c) => c.id !== activeCardId) || []
            const newDestCards = [
              ...(destinationList.cards || []),
              { ...card, listId: destinationList.id, position: newPosition },
            ]

            const newLists =
              board.lists?.map((list) => {
                if (list.id === sourceList.id) {
                  return { ...list, cards: newSourceCards }
                }
                if (list.id === destinationList.id) {
                  return { ...list, cards: newDestCards }
                }
                return list
              }) || []

            setBoard({
              ...board,
              lists: newLists,
            })

            // Update in database
            try {
              await fetch(`/api/cards/${activeCardId}`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  listId: destinationList.id,
                  position: newPosition,
                }),
              })
            } catch (error) {
              console.error("Error moving card:", error)
              // Revert optimistic update on error
              fetchBoard()
            }
          }
        }
      }

      // If dropping onto another card
      if (over.id.startsWith("card-")) {
        const overCardId = Number.parseInt(over.id.replace("card-", ""))
        const destinationList = findCardList(over.id)

        if (!destinationList) {
          setActiveId(null)
          setActiveList(null)
          return
        }

        const card = sourceList.cards?.find((c) => c.id === activeCardId)
        const overCard = destinationList.cards?.find((c) => c.id === overCardId)

        if (card && overCard) {
          // Same list, reorder cards
          if (sourceList.id === destinationList.id) {
            const oldIndex = sourceList.cards?.findIndex((c) => c.id === activeCardId) ?? -1
            const newIndex = sourceList.cards?.findIndex((c) => c.id === overCardId) ?? -1

            if (oldIndex !== -1 && newIndex !== -1 && sourceList.cards) {
              const newCards = arrayMove(sourceList.cards, oldIndex, newIndex)

              // Update positions
              const updatedCards = newCards.map((card, index) => ({
                ...card,
                position: index + 1,
              }))

              // Optimistically update UI
              const newLists =
                board.lists?.map((list) => {
                  if (list.id === sourceList.id) {
                    return { ...list, cards: updatedCards }
                  }
                  return list
                }) || []

              setBoard({
                ...board,
                lists: newLists,
              })

              // Update in database
              try {
                for (const card of updatedCards) {
                  await fetch(`/api/cards/${card.id}`, {
                    method: "PATCH",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ position: card.position }),
                  })
                }
              } catch (error) {
                console.error("Error updating card positions:", error)
                // Revert optimistic update on error
                fetchBoard()
              }
            }
          } else {
            // Different list, move card to new list at specific position
            const newIndex = destinationList.cards?.findIndex((c) => c.id === overCardId) ?? -1

            if (newIndex !== -1) {
              // Calculate new position
              const newPosition = overCard.position

              // Optimistically update UI
              const newSourceCards = sourceList.cards?.filter((c) => c.id !== activeCardId) || []

              // Insert card at the right position and update all subsequent positions
              const newDestCards = [...(destinationList.cards || [])]
              newDestCards.splice(newIndex, 0, { ...card, list_id: destinationList.id, position: newPosition })

              // Update positions for all cards in the destination list
              const updatedDestCards = newDestCards.map((card, index) => ({
                ...card,
                position: index + 1,
              }))

              const newLists =
                board.lists?.map((list) => {
                  if (list.id === sourceList.id) {
                    return { ...list, cards: newSourceCards }
                  }
                  if (list.id === destinationList.id) {
                    return { ...list, cards: updatedDestCards }
                  }
                  return list
                }) || []

              setBoard({
                ...board,
                lists: newLists,
              })

              // Update in database
              try {
                // First update the moved card's list
                await fetch(`/api/cards/${activeCardId}`, {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    listId: destinationList.id,
                    position: newPosition,
                  }),
                })

                // Then update all positions in the destination list
                for (const card of updatedDestCards) {
                  await fetch(`/api/cards/${card.id}`, {
                    method: "PATCH",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ position: card.position }),
                  })
                }
              } catch (error) {
                console.error("Error moving card between lists:", error)
                // Revert optimistic update on error
                fetchBoard()
              }
            }
          }
        }
      }
    }

    setActiveId(null)
    setActiveList(null)
  }

  const handleAddList = async () => {
    if (!newListName.trim() || !board) return

    setAddingList(true)
    try {
      const res = await fetch(`/api/boards/${board.id}/lists`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newListName }),
      })

      if (!res.ok) throw new Error("Failed to add list")

      const newList = await res.json()

      // Update board state
      setBoard({
        ...board,
        lists: [...(board.lists || []), { ...newList, cards: [] }],
      })

      setNewListName("")
      setShowNewListInput(false)
    } catch (error) {
      console.error("Error adding list:", error)
    } finally {
      setAddingList(false)
    }
  }

  const handleRemoveList = async (listId: number) => {
    if (!board) return
    // console.log(listId, "listId")
    // Optimistically update UI
    const newLists = board.lists?.filter((list) => list.id !== listId) || []

    setBoard({
      ...board,
      lists: newLists,
    })

    // Update in database
    try {
      await fetch(`/api/lists/${listId}`, {
        method: "DELETE",
      })
    } catch (error) {
      console.error("Error removing list:", error)
      // Revert optimistic update on error
      fetchBoard()
    }
  }

  const handleAddCard = async (listId: number, title: string) => {
    if (!title.trim() || !board) return

    try {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          listId,
        }),
      })

      if (!res.ok) throw new Error("Failed to add card")

      const newCard = await res.json()

      // Update board state
      const newLists =
        board.lists?.map((list) => {
          if (list.id === listId) {
            return {
              ...list,
              cards: [
                ...(list.cards || []),
                {
                  ...newCard,
                  creator: board.creator, // Assuming current user is the creator
                  members: [],
                  labels: [],
                },
              ],
            }
          }
          return list
        }) || []

      setBoard({
        ...board,
        lists: newLists,
      })
    } catch (error) {
      console.error("Error adding card:", error)
    }
  }

  const handleRemoveCard = async (listId: number, cardId: number) => {
    if (!board) return

    // Optimistically update UI
    const newLists =
      board.lists?.map((list) => {
        if (list.id === listId) {
          return {
            ...list,
            cards: list.cards?.filter((card) => card.id !== cardId) || [],
          }
        }
        return list
      }) || []

    setBoard({
      ...board,
      lists: newLists,
    })

    // Update in database
    try {
      await fetch(`/api/cards/${cardId}`, {
        method: "DELETE",
      })
    } catch (error) {
      console.error("Error removing card:", error)
      // Revert optimistic update on error
      fetchBoard()
    }
  }

  const handleCardClick = (listId: number, cardId: number) => {
    if (!board) return

    const list = board.lists?.find((list) => list.id === listId)
    if (!list) return

    const card = list.cards?.find((card) => card.id === cardId)
    if (!card) return

    setSelectedCard(card)
    setDialogOpen(true)
  }

  const handleSaveCard = async (updatedCard: CardType) => {
    if (!board) return

    const list = board.lists

    // Optimistically update UI
    const newLists =
      board.lists?.map((list) => {
        if (list.id === updatedCard.list_id) {
          return {
            ...list,
            cards: list.cards?.map((card) => (card.id === updatedCard.id ? updatedCard : card)) || [],
          }
        }
        return list
      }) || []

    setBoard({
      ...board,
      lists: newLists,
    })

    // Update in database
    try {
      await fetch(`/api/cards/${updatedCard.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: updatedCard.title,
          description: updatedCard.description,
          due_date: updatedCard.due_date,
        }),
      })

    } catch (error) {
      console.error("Error updating card:", error)
      // Revert optimistic update on error
      fetchBoard()
    }
  }

  const handleRenameBoard = async () => {
    if (!board || !newBoardName.trim()) return

    setRenamingBoard(true)
    try {
      const res = await fetch(`/api/boards/${board.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newBoardName }),
      })

      if (!res.ok) throw new Error("Failed to rename board")

      const updatedBoard = await res.json()

      // Update board state
      setBoard({
        ...board,
        name: updatedBoard.name,
      })

      setRenameBoardDialogOpen(false)
    } catch (error) {
      console.error("Error renaming board:", error)
    } finally {
      setRenamingBoard(false)
    }
  }

  const handleDeleteBoard = async () => {
    if (!board) return

    setDeletingBoard(true)
    try {
      const res = await fetch(`/api/boards/${board.id}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to delete board")

      // Redirect to boards page
      router.push("/boards")
    } catch (error) {
      console.error("Error deleting board:", error)
      setDeletingBoard(false)
      setDeleteBoardDialogOpen(false)
    }
  }

  const fetchBoard = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/boards/${params.boardId}`)
      if (!res.ok) throw new Error("Failed to fetch board")
      const data = await res.json()
      setBoard(data)
    } catch (error) {
      console.error("Error fetching board:", error)
    } finally {
      setLoading(false)
    }
  }

  // Render the active card during drag
  const renderActiveCard = () => {
    if (!activeId || !activeId.startsWith("card-") || !board) return null

    const card = findCard(activeId)
    if (!card) return null

    return (
      <div className="transform scale-105 rotate-1 shadow-xl">
        <Card
          key={card.id}
          id={`card-${card.id}`}
          title={card.title}
          description={card.description || ""}
          members={card.members }
          labels={card.labels }
          onRemove={() => {}}
          onClick={() => {}}
          isDragging={true}
        />
      </div>
    )
  }

  if (loading || !isLoaded) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <h2 className="text-xl font-semibold text-red-500 mb-4">Error: {error}</h2>
        <Button onClick={() => router.push("/boards")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Boards
        </Button>
      </div>
    )
  }

  if (!board) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <h2 className="text-xl font-semibold mb-4">Board not found</h2>
        <Button onClick={() => router.push("/boards")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Boards
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen ">
      <div className="p-4 border-b shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push("/boards")}>
              <ChevronLeft className="h-4 w-4 " /> Boards
            </Button>
            <h1 className="text-xl font-bold">{board.name}</h1>
          </div>
          <div className="flex items-center gap-4">
             <BoardMembers boardId={board.id} created_by={board.created_by} isCreator={board.created_by === (user?.id || "")} />

            <Button asChild size="sm" className="mr-2">
              <ModeToggle />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setRenameBoardDialogOpen(true)}
                >
                  Rename Board
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeleteBoardDialogOpen(true)}
                  className="text-red-500"
                >
                  Delete Board
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex overflow-x-auto pb-4 gap-4 min-h-[calc(100vh-150px)]">
            <SortableContext
              items={(board.lists || []).map((list) => `list-${list.id}`)}
              strategy={horizontalListSortingStrategy}
            >
              {(board.lists || []).map((list) => (
                <List
                  key={`list-${list.id}`}
                  id={`list-${list.id}`}
                  title={list.name}
                  cards={list.cards || []}
                  onAddCard={(title) => handleAddCard(list.id, title)}
                  onRemoveCard={(cardId) =>
                    handleRemoveCard(
                      list.id,
                      Number.parseInt(cardId.replace("card-", ""))
                    )
                  }
                  onRemoveList={() => handleRemoveList(list.id)}
                  onCardClick={(cardId) =>
                    handleCardClick(
                      list.id,
                      Number.parseInt(cardId.replace("card-", ""))
                    )
                  }
                />
              ))}
            </SortableContext>

            {showNewListInput ? (
              <div className=" rounded-md border-2 shadow-sm p-3 min-w-[272px] h-fit">
                <Input
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="Enter list title..."
                  className="mb-2"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddList}
                    size="sm"
                    disabled={addingList || !newListName.trim()}
                  >
                    {addingList ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add List"
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowNewListInput(false);
                      setNewListName("");
                    }}
                    disabled={addingList}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="min-w-[272px] justify-start"
                onClick={() => setShowNewListInput(true)}
              >
                <Plus className="h-4 w-4 mr-2" /> Add another list
              </Button>
            )}
          </div>

          <DragOverlay>{renderActiveCard()}</DragOverlay>
        </DndContext>

        {selectedCard && (
          <CardDialog
            key={selectedCard.id}
            card={selectedCard}
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            onSave={handleSaveCard}
            boardMembers={board.members || []}
            boardId={params.boardId}
          />
        )}

        <Dialog
          open={renameBoardDialogOpen}
          onOpenChange={setRenameBoardDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename Board</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                placeholder="Enter board name"
                className="w-full"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRenameBoardDialogOpen(false)}
                disabled={renamingBoard}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRenameBoard}
                disabled={renamingBoard || !newBoardName.trim()}
              >
                {renamingBoard ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={deleteBoardDialogOpen}
          onOpenChange={setDeleteBoardDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Board</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>
                Are you sure you want to delete this board? This action cannot
                be undone.
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteBoardDialogOpen(false)}
                disabled={deletingBoard}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteBoard}
                disabled={deletingBoard}
              >
                {deletingBoard ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
