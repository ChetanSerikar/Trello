"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Loader2, Plus, X } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { User, BoardMember } from "@/lib/types"

interface BoardMembersProps {
  boardId: number
  isCreator: boolean
  created_by: string
}

export function BoardMembers({ boardId, isCreator , created_by }: BoardMembersProps) {
  const [members, setMembers] = useState<BoardMember[]>([])
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [addingMember, setAddingMember] = useState(false)
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null)

  useEffect(() => {
    fetchMembers()
  }, [boardId ])

  const fetchMembers = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/boards/${boardId}/members`)
      if (!res.ok) throw new Error("Failed to fetch board members")
      const data = await res.json()
      setMembers(data)
    } catch (error) {
      console.error("Error fetching board members:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableUsers = async () => {
    try {
      const res = await fetch(`/api/boards/${boardId}/available-members`)
      if (!res.ok) throw new Error("Failed to fetch available users")
      const data = await res.json()
      setAvailableUsers(data)
    } catch (error) {
      console.error("Error fetching available users:", error)
    }
  }

  const handleAddMember = async (userId: string) => {
    setAddingMember(true)
    try {
      const res = await fetch(`/api/boards/${boardId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ memberId: userId }),
      })

      if (!res.ok) throw new Error("Failed to add member")

      const newMember = await res.json()
      setMembers([...members, newMember])

      // Remove from available users
      setAvailableUsers(availableUsers.filter((user) => user.id !== userId))
    } catch (error) {
      console.error("Error adding member:", error)
    } finally {
      setAddingMember(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    setRemovingMemberId(memberId)
    try {
      const res = await fetch(`/api/boards/${boardId}/members?memberId=${memberId}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to remove member")

      // Remove from members list
      setMembers(members.filter((member) => member.id !== memberId))

      // Refresh available users if popover is open
      if (availableUsers.length > 0) {
        fetchAvailableUsers()
      }
    } catch (error) {
      console.error("Error removing member:", error)
    } finally {
      setRemovingMemberId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center ">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }


  return (
    <div className="flex items-center gap-1">
      <div className="flex -space-x-2 mr-2">
        {members.map((member) => (
          <TooltipProvider key={member.id} delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-8 w-8 border-2 border-white">
                  <AvatarImage
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || "User")}&background=random`}
                  />
                  <AvatarFallback>{(member.name || "U").charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="flex items-center gap-2">
                  <span>{member.name}</span>
                  {isCreator && member.id !== created_by && (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleRemoveMember(member.id)
                      }}
                      className="text-red-500 hover:text-red-700"
                      disabled={removingMemberId === member.id}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>

      {isCreator && (
        <Popover
          onOpenChange={(open) => {
            if (open) fetchAvailableUsers()
          }}
        >
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 w-8 rounded-full p-0">
              <Plus className="h-4 w-4" />
              <span className="sr-only">Add member</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 p-0">
            <div className="p-2 border-b">
              <h4 className="text-sm font-medium">Add members</h4>
            </div>
            <ScrollArea className="h-72 p-2">
              {availableUsers.length > 0 ? (
                availableUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-2 hover:bg-slate-100 rounded-md">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "User")}&background=random`}
                        />
                        <AvatarFallback>{(user.name || "U").charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{user.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 rounded-full"
                      onClick={() => handleAddMember(user.id)}
                      disabled={addingMember}
                    >
                      <Plus className="h-4 w-4" />
                      <span className="sr-only">Add</span>
                    </Button>
                  </div>
                ))
              ) : (
                <div className="p-2 text-sm text-slate-500 text-center">No more users available to add</div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
