"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { X, Plus, User, Tag, Calendar } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import type { Card, User as UserType, Label, CardMember, BoardMember } from "@/lib/types"

interface CardDialogProps {
  card: Card | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (card: Card) => void
  boardMembers:(BoardMember | undefined)[]
  boardId: string
}

export function CardDialog({ card, open, onOpenChange, onSave, boardMembers , boardId }: CardDialogProps) {
  const [editedCard, setEditedCard] = useState<Card | null>(null)
  const [activeTab, setActiveTab] = useState("edit")
  const [availableLabels, setAvailableLabels] = useState<Label[]>([])
  const [newLabelName, setNewLabelName] = useState("")
  const [newLabelColor, setNewLabelColor] = useState("#3b82f6")
  const [showLabelInput, setShowLabelInput] = useState(false)
  const [date, setDate] = useState<Date | undefined>(undefined)

  // Available colors for labels
  const labelColors = [
    "#ef4444", // red
    "#f97316", // orange
    "#f59e0b", // amber
    "#84cc16", // lime
    "#10b981", // emerald
    "#06b6d4", // cyan
    "#3b82f6", // blue
    "#8b5cf6", // violet
    "#d946ef", // fuchsia
  ]

  useEffect(() => {
    if (card) {
      setEditedCard({ ...card })
      if (card.due_date) {
        setDate(new Date(card.due_date))
      } else {
        setDate(undefined)
      }
    }
  }, [card])

  useEffect(() => {
    const fetchLabels = async () => {
      try {
        const res = await fetch("/api/labels")
        if (!res.ok) throw new Error("Failed to fetch labels")
        const data = await res.json()
        setAvailableLabels(data)
      } catch (error) {
        console.error("Error fetching labels:", error)
      }
    }

    if (open) {
      fetchLabels()
    }
  }, [open])

  if (!editedCard) return null

  const handleSave = () => {
    if (editedCard) {
      onSave(editedCard)
      onOpenChange(false)
    }
  }

  const handleAddMember = async (memberId: string) => {
    if (!editedCard) return

    try {
      const res = await fetch(`/api/cards/${editedCard.id}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ memberId }),
      })

      if (!res.ok) throw new Error("Failed to add member")

      const member = boardMembers.find((m) => m?.id === memberId)
      if (member) {
        setEditedCard({
          ...editedCard,
          members: [
            ...(editedCard?.members || []),
            {
              ...member,
            },
          ],
        })
      }
    } catch (error) {
      console.error("Error adding member:", error)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!editedCard) return

    try {
      const res = await fetch(`/api/cards/${editedCard.id}/members?memberId=${memberId}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to remove member")

      setEditedCard({
        ...editedCard,
        members: (editedCard.members || []).filter((member) => member.id !== memberId),
      })
    } catch (error) {
      console.error("Error removing member:", error)
    }
  }

  const handleAddLabel = async () => {
    if (!newLabelName.trim() || !editedCard) return

    try {
      // First create the label if it doesn't exist
      let labelId: number
      const existingLabel = availableLabels.find(
        (l) => l.name.toLowerCase() === newLabelName.toLowerCase() && l.color === newLabelColor,
      )

      if (existingLabel) {
        labelId = existingLabel.id
      } else {
        const createRes = await fetch("/api/labels", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newLabelName,
            color: newLabelColor,
          }),
        })

        if (!createRes.ok) throw new Error("Failed to create label")
        const newLabel = await createRes.json()
        labelId = newLabel.id
        setAvailableLabels([...availableLabels, newLabel])
      }

      // Then add the label to the card
      const res = await fetch(`/api/cards/${editedCard.id}/labels`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ labelId }),
      })

      if (!res.ok) throw new Error("Failed to add label to card")

      const label = availableLabels.find((l) => l.id === labelId) || {
        id: labelId,
        name: newLabelName,
        color: newLabelColor,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      setEditedCard({
        ...editedCard,
        labels: [
          ...(editedCard.labels || []),
          {
           ...label,
          },
        ],
      })

      setNewLabelName("")
      setShowLabelInput(false)
    } catch (error) {
      console.error("Error adding label:", error)
    }
  }

  const handleAddExistingLabel = async (labelId: number) => {
    if (!editedCard) return

    // Check if label is already added
    if (editedCard.labels?.some((l) => l.id === labelId)) return

    try {
      const res = await fetch(`/api/cards/${editedCard.id}/labels`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ labelId }),
      })

      if (!res.ok) throw new Error("Failed to add label to card")

      const label = availableLabels.find((l) => l.id === labelId)
      if (label) {
        setEditedCard({
          ...editedCard,
          labels: [
            ...(editedCard.labels || []),
            {
              ...label,
              createdAt: new Date(),
            },
          ],
        })
      }
    } catch (error) {
      console.error("Error adding label:", error)
    }
  }

  const handleRemoveLabel = async (labelId: number) => {
    if (!editedCard) return

    try {
      const res = await fetch(`/api/cards/${editedCard.id}/labels?labelId=${labelId}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to remove label")

      setEditedCard({
        ...editedCard,
        labels: (editedCard.labels || []).filter((label) => label.id !== labelId),
      })
    } catch (error) {
      console.error("Error removing label:", error)
    }
  }

  const handleDateChange = async (date: Date | undefined) => {
    setDate(date)

    if (!editedCard) return

    try {
      const res = await fetch(`/api/cards/${editedCard.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dueDate: date ? date.toISOString() : null,
        }),
      })

      if (!res.ok) throw new Error("Failed to update due date")

      setEditedCard({
        ...editedCard,
        due_date: date || null,
      })
    } catch (error) {
      console.error("Error updating due date:", error)
    }
  }

  const handleTitleChange = async (title: string) => {
    if (!editedCard) return

    setEditedCard({
      ...editedCard,
      title,
    })
  }

  const handleDescriptionChange = async (description: string) => {
    if (!editedCard) return

    setEditedCard({
      ...editedCard,
      description,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
           <DialogTitle className="sr-only">Card Title</DialogTitle>
          <Input
            value={editedCard.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="text-xl font-semibold mb-2 mt-5"
          />
        </DialogHeader>

        <div className="space-y-4">
          {/* Due Date Section */}
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <Calendar  className="h-4 w-4 mr-2" /> Due Date
            </h3>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-start text-left font-normal ${!editedCard?.due_date && "text-muted-foreground"}`}
                >
                  {editedCard?.due_date ? format(editedCard?.due_date, "PPP") : "Set due date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent mode="single"  selected={editedCard?.due_date ? new Date(editedCard.due_date) : undefined} onSelect={handleDateChange} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          {/* Members Section */}
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <User className="h-4 w-4 mr-2" /> Members
            </h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {editedCard.members?.map((member) => (
                <div key={member.id} className="flex items-center border rounded-full pl-1 pr-2 py-1">
                  <Avatar className="h-6 w-6 mr-1">
                    <AvatarImage
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member?.name || "User")}&background=random`}
                    />
                    <AvatarFallback>{(member?.name || "U").charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{member?.name}</span>
                  <button
                    onClick={() => handleRemoveMember(member?.id)}
                    className="ml-1 text-slate-400 hover:text-slate-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="start">
                  <div className="p-2">
                    <h4 className="text-sm font-medium mb-2">Board Members</h4>
                    <div className="space-y-1">
                      {boardMembers
                        .filter((member) => !editedCard.members?.some((m) => m.id === member?.id))
                        .map((member) => (
                          <Button
                            key={member?.id}
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => handleAddMember(member?.id as string)}
                          >
                            <Avatar className="h-6 w-6 mr-2">
                              <AvatarImage
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member?.name || "User")}&background=random`}
                              />
                              <AvatarFallback>{(member?.name || "U").charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{member?.name}</span>
                          </Button>
                        ))}
                      {boardMembers.filter((member) => !editedCard.members?.some((m) => m.id === member?.id))
                        .length === 0 && <p className="text-sm text-muted-foreground p-2">All members added</p>}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Labels Section */}
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <Tag className="h-4 w-4 mr-2" /> Labels
            </h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {editedCard.labels?.map((cardLabel ) => (
                <div
                  key={cardLabel.id}
                  className="flex items-center  rounded-full px-3 py-1 "
                  style={{ backgroundColor: cardLabel?.color }}
                >
                  <span className="text-sm">{cardLabel?.name}</span>
                  <button
                    onClick={() => handleRemoveLabel(cardLabel.id)}
                    className="ml-1 "
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[250px] p-0" align="start">
                  <div className="p-2">
                    <h4 className="text-sm font-medium mb-2">Available Labels</h4>
                    <div className="space-y-1 max-h-[150px] overflow-y-auto mb-2">
                      {availableLabels
                        .filter((label) => !editedCard.labels?.some((l) => l.id === label.id))
                        .map((label) => (
                          <Button
                            key={label.id}
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => handleAddExistingLabel(label.id)}
                          >
                            <div className="h-4 w-4 rounded-full mr-2" style={{ backgroundColor: label.color }} />
                            <span className="text-sm">{label.name}</span>
                          </Button>
                        ))}
                      {availableLabels.filter((label) => !editedCard.labels?.some((l) => l.id === label.id))
                        .length === 0 && <p className="text-sm text-muted-foreground p-2">No more labels available</p>}
                    </div>
                    <div className="border-t pt-2">
                      <h4 className="text-sm font-medium mb-2">Create New Label</h4>
                      <Input
                        value={newLabelName}
                        onChange={(e) => setNewLabelName(e.target.value)}
                        placeholder="Label name"
                        className="w-full mb-2"
                      />
                      <div className="flex flex-wrap gap-2 mb-2">
                        {labelColors.map((color) => (
                          <div
                            key={color}
                            className={`h-6 w-6 rounded-full cursor-pointer ${
                              color === newLabelColor ? "ring-2 ring-offset-2" : ""
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setNewLabelColor(color)}
                          />
                        ))}
                      </div>
                      <Button size="sm" onClick={handleAddLabel} disabled={!newLabelName.trim()} className="w-full">
                        Create & Add
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Content Section with Markdown */}
          <div>
            <h3 className="text-sm font-medium mb-2">Description</h3>
            <Tabs defaultValue="edit" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-2">
                <TabsTrigger value="edit">Edit</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              <TabsContent value="edit">
                <Textarea
                  value={editedCard.description || ""}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  placeholder="Use markdown to format text, create checklists, tables, etc."
                  className="min-h-[200px]"
                />
                <div className="text-xs text-slate-500 mt-1">
                  Supports Markdown: **bold**, *italic*, - [ ] checklist, tables, etc.
                </div>
              </TabsContent>
              <TabsContent value="preview" className="min-h-[200px] border rounded-md p-3">
                {editedCard.description ? (
                  <ReactMarkdown >{editedCard.description}</ReactMarkdown>
                ) : (
                  <div className="text-slate-400 italic">No description yet</div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
