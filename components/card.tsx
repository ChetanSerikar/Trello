"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card as CardUI } from "@/components/ui/card"
import { X } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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
interface CardProps {
  id: string
  title: string
  description: string
  members?: Array<{ id: string; name: string; email: string }>
  labels?: Array<{ id: number; name: string; color: string }>
  onRemove: () => void
  onClick: () => void
  isDragging?: boolean
}

export function Card({
  id,
  title,
  description,
  members = [],
  labels = [],
  onRemove,
  onClick,
  isDragging = false,
}: CardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id,
    data: {
      type: "card",
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : "auto",
  }

  return (
    <CardUI
      ref={setNodeRef}
      style={style}
      className={`p-3 bg-white cursor-move group relative ${
        isDragging ? "shadow-lg" : "hover:shadow-md"
      } transition-shadow duration-200`}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        // Only trigger onClick if we're not clicking the remove button
        if (!(e.target as HTMLElement).closest("button")) {
          onClick()
        }
      }}
    >
      {/* Labels */}
      {labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {labels.map((label) => (
            <div
              key={label.id}
              className="h-2 w-16 rounded-sm"
              style={{ backgroundColor: label.color }}
              title={label.name}
            />
          ))}
        </div>
      )}

      {/* Card Title */}
      <div className="pr-6 mb-2 font-medium cursor-pointer" onPointerDown={(e) => e.stopPropagation()}>{title}</div>

      {/* Card Description (truncated) */}
      {description && <div className="text-sm text-slate-600 mb-2 line-clamp-2">{description}</div>}

      {/* Members */}
      {members.length > 0 && (
        <div className="flex -space-x-2 mt-2">
          {members.map((member) => (
            <Avatar key={member.id} className="h-6 w-6 border-2 border-white">
              <AvatarImage
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`}
              />
              <AvatarFallback className="text-xs">{member.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          ))}
        </div>
      )}

      {/* Remove Button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          onRemove()
        }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        aria-label="Remove card"
      >
        <X className="h-4 w-4 text-slate-400 hover:text-slate-700" />
      </button>
    </CardUI>
  )
}
