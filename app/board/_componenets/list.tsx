"use client"

import { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Card } from "./card"
import type { CardType } from "./boards"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, X, MoreHorizontal, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface ListProps {
  id: string
  title: string
  cards: CardType[]
  onAddCard: (listId: string, content: string) => void
  onRemoveCard: (listId: string, cardId: string) => void
  onRemoveList: (listId: string) => void
  onCardClick: (listId: string, cardId: string) => void
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
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleAddCard = () => {
    if (newCardContent.trim()) {
      onAddCard(id, newCardContent)
      setNewCardContent("")
      setShowNewCardInput(false)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-card text-card-foreground border-1 border-gray-200 rounded-md shadow-lg p-3 min-w-[272px] max-w-[272px] h-fit flex flex-col"
    >
      <div className="flex items-center justify-between mb-2 cursor-move" {...attributes} {...listeners}>
        <h3 className="font-medium ">{title}</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem  onClick={() => console.log("Delete List")} className="text-red-500">
              {/* <Button variant="ghost"  className="w-full text-left">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete List
              </Button> */}

              {/* <Trash2 className="h-4 w-4 mr-2" />
              Delete List */}
              Click
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-col gap-2 mb-2 min-h-[2px]">
        <SortableContext items={cards.map((card) => card.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <Card
              key={card.id}
              id={card.id}
              title={card.title}
              content={card.content}
              members={card.members}
              labels={card.labels}
              onRemove={() => onRemoveCard(id, card.id)}
              onClick={() => onCardClick(id, card.id)}
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
            <Button onClick={handleAddCard} size="sm">
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
