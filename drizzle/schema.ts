// schema.ts
import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  varchar,
  primaryKey
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users (Clerk)
export const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(), // Clerk user ID
  name: text("name"),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const workspaces = pgTable("workspaces", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: varchar("owner_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const boards = pgTable("boards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  workspaceId: integer("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  createdBy: varchar("created_by", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const lists = pgTable("lists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  boardId: integer("board_id")
    .notNull()
    .references(() => boards.id, { onDelete: 'cascade' }),
  position: integer("position").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const cards = pgTable("cards", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  listId: integer("list_id")
    .notNull()
    .references(() => lists.id, { onDelete: 'cascade' }),
  position: integer("position").notNull(),
  createdBy: varchar("created_by", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: 'set null' }),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const labels = pgTable("labels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: varchar("color", { length: 7 }).notNull(), // e.g., #f97316
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// --- Card ↔ Labels (Many-to-Many)
export const cardLabels = pgTable("card_labels", {
  cardId: integer("card_id")
    .notNull()
    .references(() => cards.id, { onDelete: "cascade" }),
  labelId: integer("label_id")
    .notNull()
    .references(() => labels.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.cardId, table.labelId] })
}))

// --- Card ↔ Members (Many-to-Many)
export const cardMembers = pgTable("card_members", {
  cardId: integer("card_id")
    .notNull()
    .references(() => cards.id, { onDelete: "cascade" }),
  memberId: varchar("member_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.cardId, table.memberId] })
}))

// --- Board ↔ Members (Many-to-Many)
export const boardMembers = pgTable("board_members", {
  boardId: integer("board_id")
    .notNull()
    .references(() => boards.id, { onDelete: "cascade" }),
  memberId: varchar("member_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.boardId, table.memberId] })
}))

// relations.ts
export const userRelations = relations(users, ({ many }) => ({
  workspaces: many(workspaces),
  boards: many(boards),
  cards: many(cards),
}));

export const workspaceRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, {
    fields: [workspaces.ownerId],
    references: [users.id],
  }),
  boards: many(boards),
}));

export const boardRelations = relations(boards, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [boards.workspaceId],
    references: [workspaces.id],
  }),
  creator: one(users, {
    fields: [boards.createdBy],
    references: [users.id],
  }),
  lists: many(lists),
  members: many(boardMembers), 
}));

export const listRelations = relations(lists, ({ one, many }) => ({
  board: one(boards, {
    fields: [lists.boardId],
    references: [boards.id],
  }),
  cards: many(cards),
}));

export const cardRelations = relations(cards, ({ one , many}) => ({
  list: one(lists, {
    fields: [cards.listId],
    references: [lists.id],
  }),
  creator: one(users, {
    fields: [cards.createdBy],
    references: [users.id],
  }),
  labels: many(cardLabels),
  members: many(cardMembers),
}));

export const labelRelations = relations(labels, ({ many }) => ({
  cards: many(cardLabels),
}))

export const cardLabelRelations = relations(cardLabels, ({ one }) => ({
  card: one(cards, {
    fields: [cardLabels.cardId],
    references: [cards.id],
  }),
  label: one(labels, {
    fields: [cardLabels.labelId],
    references: [labels.id],
  }),
}))

export const cardMemberRelations = relations(cardMembers, ({ one }) => ({
  card: one(cards, {
    fields: [cardMembers.cardId],
    references: [cards.id],
  }),
  member: one(users, {
    fields: [cardMembers.memberId],
    references: [users.id],
  }),
}))

export const boardMemberRelations = relations(boardMembers, ({ one }) => ({
  board: one(boards, {
    fields: [boardMembers.boardId],
    references: [boards.id],
  }),
  member: one(users, {
    fields: [boardMembers.memberId],
    references: [users.id],
  }),
}))
