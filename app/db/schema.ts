import { integer, text } from "drizzle-orm/sqlite-core/columns"
import { sqliteTable } from "drizzle-orm/sqlite-core/table"
import { unique } from "drizzle-orm/sqlite-core/unique-constraint"

const id = () => integer({ mode: "number" }).notNull()
const primaryId = () => id().primaryKey({ autoIncrement: true })

export const liveTable = sqliteTable("live", {
	id: primaryId(),
	name: text().notNull(),
	description: text().notNull(),
	ownerId: id().references(() => userTable.id),
})

export type LiveTable = typeof liveTable.$inferSelect

export const liveDayTable = sqliteTable(
	"live_day",
	{
		id: primaryId(),
		liveId: id().references(() => liveTable.id),
		date: text().notNull(), // yyyy/mm/dd
		start: text().notNull(), // hh:mm 24時間表示
		end: text().notNull(), // hh:mm 24時間表示
	},
	(t) => [unique().on(t.id, t.date)],
)

export type LiveDayTable = typeof liveDayTable.$inferSelect

export const userTable = sqliteTable("user", {
	id: primaryId(),
	name: text().notNull(),
	mail: text().notNull().unique(),
	passwordHash: text().notNull(),
})

export type UserTable = typeof userTable.$inferSelect

export const bandTable = sqliteTable("band", {
	id: primaryId(),
	name: text().notNull(),
	leaderId: id().references(() => userTable.id),
})

export type BandTable = typeof bandTable.$inferSelect

export const bandParticipationTable = sqliteTable(
	"band_participation",
	{
		id: primaryId(),
		liveId: id().references(() => liveTable.id),
		bandId: id().references(() => bandTable.id),
		approved: integer({ mode: "boolean" }).notNull(),
	},
	(t) => [unique().on(t.liveId, t.bandId)],
)

export type BandParticipationTable = typeof bandParticipationTable.$inferSelect

export const bandAvailabilityTable = sqliteTable("band_availability", {
	id: primaryId(),
	bandId: id().references(() => bandTable.id),
	liveId: id().references(() => liveTable.id),
	liveDayId: id().references(() => liveDayTable.id),
	start: text().notNull(), // hh:mm 24時間表示
	end: text().notNull(), // hh:mm 24時間表示
})

export type BandAvailabilityTable = typeof bandAvailabilityTable.$inferSelect

export const liveApplicationTable = sqliteTable("live_application_table", {
	id: primaryId(),
	name: text().notNull(),
	liveId: id().references(() => liveTable.id),
	token: text().notNull().unique(),
	available: integer({ mode: "boolean" }).notNull(),
	updatedAt: text().notNull(), // "yyyy/mm/dd-hh:mm"
})

export type LiveApplicationTable = typeof liveApplicationTable.$inferSelect
