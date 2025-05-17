export interface User {
  id: string
  name: string | null
  email: string
}

export interface Workspace {
  id: number
  name: string
  ownerId: string
  createdAt: Date
  updatedAt: Date
}

export interface Board {
  id: number
  name: string
  workspaceId: number
  created_by: string
  created_at: Date
  updated_at: Date
  workspace?: Workspace
  creator?: User
  lists?: List[]
  members?: BoardMember[]
}

export interface List {
  id: number
  name: string
  boardId: number
  position: number
  createdAt: Date
  updatedAt: Date
  cards?: Card[]
}

export interface Card {
  id: number
  title: string
  description: string | null
  list_id: number
  position: number
  createdBy: string
  due_date: Date | null
  createdAt: Date
  updatedAt: Date
  creator?: User
  members?: User[]
  labels?: Label[]
}

export interface Label {
  id: number
  name: string
  color: string
  createdAt: Date
  updatedAt: Date
}

export interface CardLabel {
  cardId: number
  labelId: number
  createdAt: Date
  label?: Label
}

export interface CardMember {
  cardId: number
  memberId: string
  createdAt: Date
  member?: User
}

export interface BoardMember {
  id: string
  name: string | null
  email: string
}
