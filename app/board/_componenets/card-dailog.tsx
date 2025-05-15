"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { X, Plus, User, Tag } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { DialogTitle } from "@radix-ui/react-dialog"

export type Member = {
  id: string
  name: string
  avatar?: string
}

export type Label = {
  id: string
  name: string
  color: string
}

export type CardDetails = {
  id: string
  title: string
  content: string
  members: Member[]
  labels: Label[]
}

interface CardDialogProps {
  card: CardDetails | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (card: CardDetails) => void
}

export function CardDialog({ card, open, onOpenChange, onSave }: CardDialogProps) {
  const [editedCard, setEditedCard] = useState<CardDetails | null>(null)
  const [newMemberName, setNewMemberName] = useState("")
  const [newLabelName, setNewLabelName] = useState("")
  const [newLabelColor, setNewLabelColor] = useState("#3b82f6") // Default blue
  const [showMemberInput, setShowMemberInput] = useState(false)
  const [showLabelInput, setShowLabelInput] = useState(false)
  const [activeTab, setActiveTab] = useState("edit")

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
    }
  }, [card])

  if (!editedCard) return null

  const handleSave = () => {
    if (editedCard) {
      onSave(editedCard)
      onOpenChange(false)
    }
  }

  const handleAddMember = () => {
    if (newMemberName.trim() && editedCard) {
      const newMember: Member = {
        id: `member-${Date.now()}`,
        name: newMemberName.trim(),
        avatar: undefined,
      }
      setEditedCard({
        ...editedCard,
        members: [...editedCard.members, newMember],
      })
      setNewMemberName("")
      setShowMemberInput(false)
    }
  }

  const handleRemoveMember = (memberId: string) => {
    if (editedCard) {
      setEditedCard({
        ...editedCard,
        members: editedCard.members.filter((member) => member.id !== memberId),
      })
    }
  }

  const handleAddLabel = () => {
    if (newLabelName.trim() && editedCard) {
      const newLabel: Label = {
        id: `label-${Date.now()}`,
        name: newLabelName.trim(),
        color: newLabelColor,
      }
      setEditedCard({
        ...editedCard,
        labels: [...editedCard.labels, newLabel],
      })
      setNewLabelName("")
      setShowLabelInput(false)
    }
  }

  const handleRemoveLabel = (labelId: string) => {
    if (editedCard) {
      setEditedCard({
        ...editedCard,
        labels: editedCard.labels.filter((label) => label.id !== labelId),
      })
    }
  }

  const handleCancel = (e : boolean) => {
    console.log("Cancel" , e)
    // setEditedCard(null)

    setNewMemberName("")
    setNewLabelName("")
    setNewLabelColor("#3b82f6") // Reset to default color
    setShowMemberInput(false)
    setShowLabelInput(false)
    setActiveTab("edit")
    onOpenChange(e)

  }

  return (
    <Dialog open={open} onOpenChange={(e) => handleCancel(e)}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto ">
        <DialogTitle className="sr-only">card-dailog</DialogTitle>
        <DialogHeader>
          <Input
            value={editedCard.title}
            onChange={(e) => setEditedCard({ ...editedCard, title: e.target.value })}
            className="text-xl font-semibold mb-2 pt-2"
          />
        </DialogHeader>

        <div className="space-y-4">
          {/* Members Section */}
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <User className="h-4 w-4 mr-2" /> Members
            </h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {editedCard.members.map((member) => (
                <div key={member.id} className="flex items-center bg-slate-100 rounded-full pl-1 pr-2 py-1">
                  <Avatar className="h-6 w-6 mr-1">
                    <AvatarImage src={member.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{member.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{member.name}</span>
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="ml-1 text-slate-400 hover:text-slate-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {!showMemberInput && (
                <Button variant="outline" size="sm" className="h-8" onClick={() => setShowMemberInput(true)}>
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              )}
            </div>
            {showMemberInput && (
              <div className="flex gap-2 mb-2">
                <Input
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Member name"
                  className="flex-1"
                  autoFocus
                />
                <Button size="sm" onClick={handleAddMember}>
                  Add
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowMemberInput(false)
                    setNewMemberName("")
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Labels Section */}
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <Tag className="h-4 w-4 mr-2" /> Labels
            </h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {editedCard.labels.map((label) => (
                <div
                  key={label.id}
                  className="flex items-center rounded-full pl-2 pr-1 py-1 text-white"
                  style={{ backgroundColor: label.color }}
                >
                  <span className="text-sm">{label.name}</span>
                  <button onClick={() => handleRemoveLabel(label.id)} className="ml-1 text-white/70 hover:text-white">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {!showLabelInput && (
                <Button variant="outline" size="sm" className="h-8" onClick={() => setShowLabelInput(true)}>
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              )}
            </div>
            {showLabelInput && (
              <div className="space-y-2 mb-2">
                <Input
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  placeholder="Label name"
                  className="w-full"
                  autoFocus
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
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddLabel}>
                    Add Label
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowLabelInput(false)
                      setNewLabelName("")
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
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
                  value={editedCard.content}
                  onChange={(e) => setEditedCard({ ...editedCard, content: e.target.value })}
                  placeholder="Use markdown to format text, create checklists, tables, etc."
                  className="min-h-[200px]"
                />
                <div className="text-xs text-slate-500 mt-1">
                  Supports Markdown: **bold**, *italic*, - [ ] checklist, tables, etc.
                </div>
              </TabsContent>
              <TabsContent value="preview" className="min-h-[200px] border rounded-md p-3">
                {editedCard.content ? (
                    // className="prose prose-sm max-w-none"
                  <ReactMarkdown >{editedCard.content}</ReactMarkdown>
                ) : (
                  <div className="text-slate-400 italic">No content yet</div>
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
