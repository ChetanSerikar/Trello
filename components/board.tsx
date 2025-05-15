"use client"

import { useState } from "react"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  MeasuringStrategy,
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
import { Plus, X } from "lucide-react"
import { CardDialog, type CardDetails } from "@/components/card-dialog"

// Define types for our data structure
export type CardType = {
  id: string
  title: string
  content: string
  members: Array<{ id: string; name: string; avatar?: string }>
  labels: Array<{ id: string; name: string; color: string }>
}

export type ListType = {
  id: string
  title: string
  cards: CardType[]
}

export function Board() {
  // Initial state with some example data
  const [lists, setLists] = useState<ListType[]>([
    {
      id: "list-1",
      title: "To Do",
      cards: [
        {
          id: "card-1",
          title: "Research project requirements",
          content:
            "- [ ] Review client specifications\n- [ ] Identify key stakeholders\n- [ ] Document initial requirements",
          members: [
            { id: "member-1", name: "John Doe" },
            { id: "member-2", name: "Jane Smith" },
          ],
          labels: [{ id: "label-1", name: "Research", color: "#3b82f6" }],
        },
        {
          id: "card-2",
          title: "Create project plan",
          content:
            "## Project Timeline\n\n| Phase | Duration | Deliverable |\n| ----- | -------- | ----------- |\n| Planning | 1 week | Project Plan |\n| Design | 2 weeks | Mockups |\n| Development | 4 weeks | MVP |",
          members: [{ id: "member-1", name: "John Doe" }],
          labels: [{ id: "label-2", name: "Planning", color: "#10b981" }],
        },
      ],
    },
    {
      id: "list-2",
      title: "In Progress",
      cards: [
        {
          id: "card-3",
          title: "Design UI mockups",
          content: "Create high-fidelity mockups for:\n\n- Dashboard\n- User profile\n- Settings page",
          members: [{ id: "member-3", name: "Alex Johnson" }],
          labels: [{ id: "label-3", name: "Design", color: "#f97316" }],
        },
        {
          id: "card-4",
          title: "Set up development environment",
          content: "- [x] Install dependencies\n- [x] Configure linting\n- [ ] Set up CI/CD pipeline",
          members: [],
          labels: [{ id: "label-4", name: "Dev Ops", color: "#8b5cf6" }],
        },
      ],
    },
    {
      id: "list-3",
      title: "Done",
      cards: [
        {
          id: "card-5",
          title: "Initial project setup",
          content: "Created repository and project structure",
          members: [{ id: "member-1", name: "John Doe" }],
          labels: [{ id: "label-4", name: "Dev Ops", color: "#8b5cf6" }],
        },
      ],
    },
  ])

  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeList, setActiveList] = useState<string | null>(null)
  const [newListTitle, setNewListTitle] = useState("")
  const [showNewListInput, setShowNewListInput] = useState(false)
  const [selectedCard, setSelectedCard] = useState<CardDetails | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Find the active card and its list
  const findCardList = (cardId: string) => {
    return lists.find((list) => list.cards.some((card) => card.id === cardId))
  }

  const findCard = (cardId: string) => {
    const list = findCardList(cardId)
    return list?.cards.find((card) => card.id === cardId)
  }

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Handle drag start
  const handleDragStart = (event: any) => {
    const { active } = event
    setActiveId(active.id)

    // Find which list the card belongs to
    const list = findCardList(active.id)
    if (list) {
      setActiveList(list.id)
    }
  }

  // Handle drag end
  const handleDragEnd = (event: any) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      setActiveList(null)
      return
    }

    // Handle list reordering
    if (active.id.startsWith("list-") && over.id.startsWith("list-") && active.id !== over.id) {
      setLists((lists) => {
        const oldIndex = lists.findIndex((list) => list.id === active.id)
        const newIndex = lists.findIndex((list) => list.id === over.id)
        return arrayMove(lists, oldIndex, newIndex)
      })
    }

    // Handle card movement
    if (active.id.startsWith("card-")) {
      const sourceList = findCardList(active.id)

      // If dropping onto a list
      if (over.id.startsWith("list-")) {
        const destinationList = lists.find((list) => list.id === over.id)

        if (sourceList && destinationList && sourceList.id !== destinationList.id) {
          // Move card to a different list
          setLists((lists) => {
            const card = findCard(active.id)
            if (!card) return lists

            return lists.map((list) => {
              // Remove from source list
              if (list.id === sourceList.id) {
                return {
                  ...list,
                  cards: list.cards.filter((c) => c.id !== active.id),
                }
              }
              // Add to destination list
              if (list.id === destinationList.id) {
                return {
                  ...list,
                  cards: [...list.cards, card],
                }
              }
              return list
            })
          })
        }
      }

      // If dropping onto another card
      if (over.id.startsWith("card-")) {
        const destinationList = findCardList(over.id)

        if (sourceList && destinationList) {
          setLists((lists) => {
            const card = findCard(active.id)
            if (!card) return lists

            // If same list, reorder cards
            if (sourceList.id === destinationList.id) {
              const listIndex = lists.findIndex((l) => l.id === sourceList.id)
              const cards = [...lists[listIndex].cards]
              const oldIndex = cards.findIndex((c) => c.id === active.id)
              const newIndex = cards.findIndex((c) => c.id === over.id)

              const newLists = [...lists]
              newLists[listIndex] = {
                ...lists[listIndex],
                cards: arrayMove(cards, oldIndex, newIndex),
              }

              return newLists
            } else {
              // Move to different list
              return lists.map((list) => {
                // Remove from source list
                if (list.id === sourceList.id) {
                  return {
                    ...list,
                    cards: list.cards.filter((c) => c.id !== active.id),
                  }
                }
                // Add to destination list at specific position
                if (list.id === destinationList.id) {
                  const cards = [...list.cards]
                  const insertIndex = cards.findIndex((c) => c.id === over.id)
                  cards.splice(insertIndex, 0, card)

                  return {
                    ...list,
                    cards,
                  }
                }
                return list
              })
            }
          })
        }
      }
    }

    setActiveId(null)
    setActiveList(null)
  }

  // Add a new list
  const handleAddList = () => {
    if (newListTitle.trim()) {
      const newList: ListType = {
        id: `list-${Date.now()}`,
        title: newListTitle,
        cards: [],
      }
      setLists([...lists, newList])
      setNewListTitle("")
      setShowNewListInput(false)
    }
  }

  // Remove a list
  const handleRemoveList = (listId: string) => {
    console.log(`Removing list ${listId}`)
    setLists(lists.filter((list) => list.id !== listId))
  }

  // Add a card to a list
  const handleAddCard = (listId: string, content: string) => {
    setLists(
      lists.map((list) => {
        if (list.id === listId) {
          const newCard: CardType = {
            id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            title: content,
            content: "",
            members: [],
            labels: [],
          }
          return {
            ...list,
            cards: [...list.cards, newCard],
          }
        }
        return list
      }),
    )
  }

  // Remove a card from a list
  const handleRemoveCard = (listId: string, cardId: string) => {
    console.log(`Removing card ${cardId} from list ${listId}`)
    setLists(
      lists.map((list) => {
        if (list.id === listId) {
          return {
            ...list,
            cards: list.cards.filter((card) => card.id !== cardId),
          }
        }
        return list
      }),
    )
  }

  // Handle card click to open dialog
  const handleCardClick = (listId: string, cardId: string) => {
    const list = lists.find((list) => list.id === listId)
    const card = list?.cards.find((card) => card.id === cardId)

    if (card) {
      setSelectedCard(card)
      setDialogOpen(true)
    }
  }

  // Save card changes
  const handleSaveCard = (updatedCard: CardDetails) => {
    setLists(
      lists.map((list) => {
        return {
          ...list,
          cards: list.cards.map((card) => {
            if (card.id === updatedCard.id) {
              return updatedCard
            }
            return card
          }),
        }
      }),
    )
  }

  // Render the active card during drag
  const renderActiveCard = () => {
    if (!activeId || !activeId.startsWith("card-")) return null

    const card = findCard(activeId)
    if (!card) return null

    return (
      <div className="transform scale-105 rotate-1 shadow-xl">
        <Card
          id={card.id}
          title={card.title}
          content={card.content}
          members={card.members}
          labels={card.labels}
          onRemove={() => {}}
          onClick={() => {}}
          isDragging={true}
        />
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[]}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always,
        },
      }}
    >
      <div className="flex flex-col gap-4">
        <div className="flex overflow-x-auto pb-4 gap-4">
          <SortableContext items={lists.map((list) => list.id)} strategy={horizontalListSortingStrategy}>
            {lists.map((list) => (
              <List
                key={list.id}
                id={list.id}
                title={list.title}
                cards={list.cards}
                onAddCard={handleAddCard}
                onRemoveCard={handleRemoveCard}
                onRemoveList={handleRemoveList}
                onCardClick={handleCardClick}
              />
            ))}
          </SortableContext>

          {showNewListInput ? (
            <div className="bg-white rounded-md shadow-sm p-3 min-w-[272px] h-fit">
              <Input
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                placeholder="Enter list title..."
                className="mb-2"
                autoFocus
              />
              <div className="flex gap-2">
                <Button onClick={handleAddList} size="sm">
                  Add List
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowNewListInput(false)
                    setNewListTitle("")
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="min-w-[272px] justify-start bg-white/80 hover:bg-white"
              onClick={() => setShowNewListInput(true)}
            >
              <Plus className="h-4 w-4 mr-2" /> Add another list
            </Button>
          )}
        </div>
      </div>

      <DragOverlay>{renderActiveCard()}</DragOverlay>

      <CardDialog card={selectedCard} open={dialogOpen} onOpenChange={setDialogOpen} onSave={handleSaveCard} />
    </DndContext>
  )
}
