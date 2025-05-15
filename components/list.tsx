"use client"

import { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Card } from "./card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, X, MoreHorizontal, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// interface CardType {
//   id: number
//   title: string
//   description: string | null
//   position: number
//   members: Array<{ id: string; name: string; email: string }>
//   labels: Array<{ id: number; name: string; color: string }>
// }
interface User {
  id: string
  name: string
  email: string
}

interface Label {
  id: number
  name: string
  color: string
}

interface CardMember {
  cardId: number
  memberId: string
  member: User
}

interface CardLabel {
  cardId: number
  labelId: number
  label: Label
}

interface Card {
  id: number
  title: string
  description: string | null
  position: number
  listId: number
  createdBy: string
  dueDate: string | null
  creator: User
  members: CardMember[]
  labels: CardLabel[]
}

interface ListProps {
  id: string
  title: string
  cards: Card[]
  onAddCard: (content: string) => void
  onRemoveCard: (cardId: string) => void
  onRemoveList: () => void
  onCardClick: (cardId: string) => void
}

export function List({ id, title, cards, onAddCard, onRemoveCard, onRemoveList, onCardClick }: ListProps) {
  const [newCardContent, setNewCardContent] = useState("")
  const [showNewCardInput, setShowNewCardInput] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    data: {
      type: "list",
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : "auto",
  }

  const handleAddCard = () => {
    if (newCardContent.trim()) {
      onAddCard(newCardContent)
      setNewCardContent("")
      setShowNewCardInput(false)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-slate-100 rounded-md shadow-sm p-3 min-w-[272px] max-w-[272px] h-fit flex flex-col ${
        isDragging ? "shadow-lg ring-2 ring-slate-200" : "hover:shadow-md"
      } transition-shadow duration-200`}
    >
      <div className="flex items-center justify-between mb-2 cursor-move" {...attributes} {...listeners}>
        <h3 className="font-medium text-slate-800">{title}</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onRemoveList} className="text-red-500 cursor-pointer">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete List
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-col gap-2 mb-2 min-h-[2px] overflow-y-auto max-h-[calc(100vh-200px)]">
        <SortableContext items={cards.map((card) => `card-${card.id}`)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <Card
              key={`card-${card.id}`}
              id={`card-${card.id}`}
              title={card.title}
              description={card.description || ""}
              members={card.members}
              labels={card.labels}
              onRemove={() => onRemoveCard(`card-${card.id}`)}
              onClick={() => onCardClick(`card-${card.id}`)}
            />
          ))}
        </SortableContext>
      </div>

      {showNewCardInput ? (
        <div className="mt-2">
          <Input
            value={newCardContent}
            onChange={(e) => setNewCardContent(e.target.value)}
            placeholder="Enter card title..."
            className="mb-2"
            autoFocus
          />
          <div className="flex gap-2">
            <Button onClick={handleAddCard} size="sm" disabled={!newCardContent.trim()}>
              Add Card
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowNewCardInput(false)
                setNewCardContent("")
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="ghost"
          className="justify-start text-slate-600 hover:bg-slate-200"
          onClick={() => setShowNewCardInput(true)}
        >
          <Plus className="h-4 w-4 mr-2" /> Add a card
        </Button>
      )}
    </div>
  )
}
