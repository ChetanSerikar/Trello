"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card as CardUI } from "@/components/ui/card"
import { X } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface CardProps {
  id: string
  content: string
  title?: string
  members?: Array<{ id: string; name: string; avatar?: string }>
  labels?: Array<{ id: string; name: string; color: string }>
  onRemove: () => void
  onClick: () => void
  isDragging?: boolean
}

export function Card({
  id,
  content,
  title,
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
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const displayTitle = title || content

  return (
    <CardUI
      ref={setNodeRef}
      style={style}
      className="p-3 gap-1  group relative cursor-grab"
      {...attributes}
      {...listeners}
      onClick={(e) => {
        console.log("Card clicked");
        // Only trigger onClick if we're not clicking the remove button
        if (!(e.target as HTMLElement).closest("button")) {
          onClick();
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

      {/* Card Title/Content */}
      <div
        className="pr-6 mb-1 cursor-pointer select-none"
        onClick={() => onClick()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {displayTitle}
      </div>

      {/* Members */}
      {members.length > 0 && (
        <div className="flex -space-x-2 mt-1">
          {members.map((member) => (
            <Avatar key={member.id} className="h-6 w-6 border-2">
              {/* <AvatarImage src={member.avatar || "/placeholder.svg"} /> */}
              <AvatarFallback className="text-xs">
                {member.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
      )}

      {/* Remove Button */}
      <button
        onClick={(e) => {
     
          onRemove()
        }}
         onPointerDown={(e) => e.stopPropagation()}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4 text-slate-400 hover:text-slate-700" />
      </button>
    </CardUI>
  );
}
