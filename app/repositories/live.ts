import { eq } from "drizzle-orm"
import type { DrizzleDB } from "~/db"
import {
	type LiveApplicationTable,
	type LiveTable,
	liveApplicationTable,
	liveDayTable,
	liveTable,
} from "~/db/schema"
import { RepositoryError } from "~/domain/data/errors"
import type { Live } from "~/domain/entities/live"
import type { LiveApplication } from "~/domain/entities/live-application"
import type { LiveDay } from "~/domain/entities/live-day"
import { PlainDate } from "~/lib/plain-date"
import {
	PlainDateTimeSerde,
	plainTimeToMinutes,
} from "~/lib/plain-datetime-utils"
import { PlainTime } from "~/lib/plain-time"
import { fail, type Result, success, wrapPromise } from "~/lib/result"

export type NewLiveDay = {
	date: PlainDate
	start: PlainTime
	end: PlainTime
}

export interface LiveRepository {
	getById(id: number): Promise<Result<Live | null, RepositoryError>>
	getByOwnerId(ownerId: number): Promise<Result<Live[], RepositoryError>>
	create(
		name: string,
		description: string,
		ownerId: number,
		liveDays: NewLiveDay[],
	): Promise<Result<Live, RepositoryError>>
	getLiveDays(liveId: number): Promise<Result<LiveDay[], RepositoryError>>
	getAllApplications(
		id: number,
	): Promise<Result<LiveApplication[], RepositoryError>>
	createApplication(
		liveId: number,
		name: string,
		available: boolean,
	): Promise<Result<null, RepositoryError>>

	suspendApplication(
		applicationId: number,
	): Promise<Result<null, RepositoryError>>
	enableApplication(
		applicationId: number,
	): Promise<Result<null, RepositoryError>>
	verifyApplicationToken(
		token: string,
	): Promise<
		Result<
			| { status: "verified"; liveId: number }
			| { status: "suspended" }
			| { status: "notFound" },
			RepositoryError
		>
	>
}

export class LiveRepositoryImpl implements LiveRepository {
	private readonly db: DrizzleDB
	constructor(db: DrizzleDB) {
		this.db = db
	}

	async create(
		name: string,
		description: string,
		ownerId: number,
		liveDays: NewLiveDay[],
	): Promise<Result<Live, RepositoryError>> {
		const result = await wrapPromise(
			this.db.transaction(async (tx) => {
				const [live] = await tx
					.insert(liveTable)
					.values({ name, description, ownerId })
					.returning()

				if (liveDays.length > 0) {
					await tx.insert(liveDayTable).values(
						liveDays.map((liveDay) => ({
							liveId: live.id,
							date: PlainDate.serde.serialize(liveDay.date),
							start: PlainTime.serde.serialize(liveDay.start),
							end: PlainTime.serde.serialize(liveDay.end),
						})),
					)
				}

				return live
			}),
		)

		if (!result.success)
			return fail(new RepositoryError("LiveTableの処理が失敗しました"))

		const row = result.value
		const live: Live = {
			id: row.id,
			name: row.name,
			description: row.description,
			ownerId: row.ownerId,
		}

		return success(live)
	}

	async getLiveDays(
		liveId: number,
	): Promise<Result<LiveDay[], RepositoryError>> {
		const result = await wrapPromise(
			this.db
				.select()
				.from(liveDayTable)
				.where(eq(liveDayTable.liveId, liveId)),
		)

		if (!result.success)
			return fail(new RepositoryError("LiveDayTableの処理が失敗しました"))

		// date / start は0埋めされないテキスト列なので SQL では正しく並ばない
		const liveDays = result.value
			.map(
				(row) =>
					({
						id: row.id,
						liveId: row.liveId,
						date: PlainDate.serde.deserialize(row.date),
						start: PlainTime.serde.deserialize(row.start),
						end: PlainTime.serde.deserialize(row.end),
					}) satisfies LiveDay,
			)
			.sort(
				(a, b) =>
					a.date.year - b.date.year ||
					a.date.month - b.date.month ||
					a.date.day - b.date.day ||
					plainTimeToMinutes(a.start) - plainTimeToMinutes(b.start),
			)

		return success(liveDays)
	}

	async verifyApplicationToken(
		token: string,
	): Promise<
		Result<
			| { status: "verified"; liveId: number }
			| { status: "suspended" }
			| { status: "notFound" },
			RepositoryError
		>
	> {
		const result = await wrapPromise(
			this.db
				.select()
				.from(liveApplicationTable)
				.where(eq(liveApplicationTable.token, token))
				.limit(1),
		)

		if (!result.success)
			return fail(
				new RepositoryError("LiveApplicationTableの処理が失敗しました"),
			)

		const row = result.value[0] as LiveApplicationTable | undefined
		if (!row) return success({ status: "notFound" })
		if (!row.available) return success({ status: "suspended" })
		return success({ status: "verified", liveId: row.liveId })
	}

	async suspendApplication(
		applicationId: number,
	): Promise<Result<null, RepositoryError>> {
		const result = await wrapPromise(
			this.db
				.update(liveApplicationTable)
				.set({ available: false })
				.where(eq(liveApplicationTable.id, applicationId)),
		)

		if (!result.success)
			return fail(
				new RepositoryError("LiveApplicationTableの処理が失敗しました"),
			)
		return success(null)
	}

	async enableApplication(
		applicationId: number,
	): Promise<Result<null, RepositoryError>> {
		const result = await wrapPromise(
			this.db
				.update(liveApplicationTable)
				.set({ available: true })
				.where(eq(liveApplicationTable.id, applicationId)),
		)

		if (!result.success)
			return fail(
				new RepositoryError("LiveApplicationTableの処理が失敗しました"),
			)
		return success(null)
	}

	async createApplication(
		liveId: number,
		name: string,
		available: boolean,
	): Promise<Result<null, RepositoryError>> {
		const now = PlainDateTimeSerde.serialize([PlainDate.now(), PlainTime.now()])
		const result = await wrapPromise(
			this.db.insert(liveApplicationTable).values({
				name,
				liveId,
				available,
				token: crypto.randomUUID(),
				updatedAt: now,
			}),
		)

		if (!result.success) {
			return fail(
				new RepositoryError("LiveApplicationTableの処理が失敗しました"),
			)
		}

		return success(null)
	}

	async getAllApplications(
		id: number,
	): Promise<Result<LiveApplication[], RepositoryError>> {
		const result = await wrapPromise(
			this.db
				.select()
				.from(liveApplicationTable)
				.where(eq(liveApplicationTable.liveId, id)),
		)

		if (!result.success)
			return fail(new RepositoryError("LiveTableの処理が失敗しました"))

		const rows = result.value

		const applications = rows.map(
			(row) =>
				({
					id: row.id,
					name: row.name,
					liveId: row.liveId,
					token: row.token,
					available: row.available,
					updatedAt: PlainDateTimeSerde.deserialize(row.updatedAt),
				}) satisfies LiveApplication,
		)

		return success(applications)
	}

	async getByOwnerId(
		ownerId: number,
	): Promise<Result<Live[], RepositoryError>> {
		const result = await wrapPromise(
			this.db.select().from(liveTable).where(eq(liveTable.ownerId, ownerId)),
		)

		if (!result.success)
			return fail(new RepositoryError("LiveTableの処理が失敗しました"))

		const lives: Live[] = result.value.map((row) => ({
			id: row.id,
			name: row.name,
			description: row.description,
			ownerId: row.ownerId,
		}))

		return success(lives)
	}

	async getById(id: number): Promise<Result<Live | null, RepositoryError>> {
		const result = await wrapPromise(
			this.db.select().from(liveTable).where(eq(liveTable.id, id)).limit(1),
		)
		if (!result.success)
			return fail(new RepositoryError("LiveTableの処理が失敗しました"))

		const liveRow = result.value[0] as LiveTable | undefined

		if (!liveRow) return success(null)

		const live: Live = {
			id: liveRow.id,
			name: liveRow.name,
			description: liveRow.description,
			ownerId: liveRow.ownerId,
		}

		return success(live)
	}
}
