import { and, eq } from "drizzle-orm"
import type { DrizzleDB } from "~/db"
import {
	type BandTable,
	bandAvailabilityTable,
	bandParticipationTable,
	bandTable,
	liveTable,
} from "~/db/schema"
import { RepositoryError } from "~/domain/data/errors"
import type { Band } from "~/domain/entities/band"
import type { BandAvailability } from "~/domain/entities/band-availability"
import type { BandParticipation } from "~/domain/entities/band-participation"
import { plainTimeToMinutes } from "~/lib/plain-datetime-utils"
import { PlainTime } from "~/lib/plain-time"
import { fail, type Result, success, wrapPromise } from "~/lib/result"

export interface BandRepository {
	getById(id: number): Promise<Result<Band | null, RepositoryError>>
	getByLiveId(
		liveId: number,
	): Promise<Result<BandParticipation[], RepositoryError>>
	create(
		bandName: string,
		leaderId: number,
		liveId: number,
	): Promise<Result<Band, RepositoryError>>
	getIsApproved(id: number): Promise<Result<boolean, RepositoryError>>

	approveBandApplication(bandId: number): Promise<Result<null, RepositoryError>>

	getAvailabilities(
		bandId: number,
		liveId: number,
	): Promise<Result<BandAvailability[], RepositoryError>>
	createAvailability(
		bandId: number,
		liveId: number,
		liveDayId: number,
		start: PlainTime,
		end: PlainTime,
	): Promise<Result<null, RepositoryError>>
	deleteAvailability(
		availabilityId: number,
		bandId: number,
	): Promise<Result<null, RepositoryError>>
}

export class BandRepositoryImpl implements BandRepository {
	private readonly db: DrizzleDB
	constructor(db: DrizzleDB) {
		this.db = db
	}
	async getAvailabilities(
		bandId: number,
		liveId: number,
	): Promise<Result<BandAvailability[], RepositoryError>> {
		const result = await wrapPromise(
			this.db
				.select()
				.from(bandAvailabilityTable)
				.where(
					and(
						eq(bandAvailabilityTable.bandId, bandId),
						eq(bandAvailabilityTable.liveId, liveId),
					),
				),
		)

		if (!result.success)
			return fail(
				new RepositoryError("BandAvailabilityTableの処理が失敗しました"),
			)

		// start は "h:m" 形式のテキスト列なので SQL では正しく並ばない
		const availabilities = result.value
			.map(
				(row) =>
					({
						id: row.id,
						bandId: row.bandId,
						liveId: row.liveId,
						liveDayId: row.liveDayId,
						start: PlainTime.serde.deserialize(row.start),
						end: PlainTime.serde.deserialize(row.end),
					}) satisfies BandAvailability,
			)
			.sort((a, b) => plainTimeToMinutes(a.start) - plainTimeToMinutes(b.start))

		return success(availabilities)
	}
	async createAvailability(
		bandId: number,
		liveId: number,
		liveDayId: number,
		start: PlainTime,
		end: PlainTime,
	): Promise<Result<null, RepositoryError>> {
		const result = await wrapPromise(
			this.db.insert(bandAvailabilityTable).values({
				bandId,
				liveId,
				liveDayId,
				start: PlainTime.serde.serialize(start),
				end: PlainTime.serde.serialize(end),
			}),
		)

		if (!result.success)
			return fail(
				new RepositoryError("BandAvailabilityTableの処理が失敗しました"),
			)

		return success(null)
	}
	async deleteAvailability(
		availabilityId: number,
		bandId: number,
	): Promise<Result<null, RepositoryError>> {
		const result = await wrapPromise(
			this.db
				.delete(bandAvailabilityTable)
				.where(
					and(
						eq(bandAvailabilityTable.id, availabilityId),
						eq(bandAvailabilityTable.bandId, bandId),
					),
				),
		)

		if (!result.success)
			return fail(
				new RepositoryError("BandAvailabilityTableの処理が失敗しました"),
			)

		return success(null)
	}
	async approveBandApplication(
		bandId: number,
	): Promise<Result<null, RepositoryError>> {
		const result = await wrapPromise(
			this.db
				.update(bandParticipationTable)
				.set({ approved: true })
				.where(eq(bandParticipationTable.bandId, bandId)),
		)

		if (!result.success)
			return fail(
				new RepositoryError("BandParticipationTableの処理が失敗しました"),
			)

		return success(null)
	}
	async getIsApproved(id: number): Promise<Result<boolean, RepositoryError>> {
		const result = await wrapPromise(
			this.db
				.select({ approved: bandParticipationTable.approved })
				.from(bandParticipationTable)
				.where(eq(bandParticipationTable.bandId, id)),
		)

		if (!result.success)
			return fail(
				new RepositoryError("BandParticipationTableの処理が失敗しました"),
			)

		return success(result.value[0].approved)
	}
	async create(
		bandName: string,
		leaderId: number,
		liveId: number,
	): Promise<Result<Band, RepositoryError>> {
		const result = await wrapPromise(
			this.db.transaction(async (tx) => {
				const [band] = await tx
					.insert(bandTable)
					.values({ name: bandName, leaderId })
					.returning()

				await tx
					.insert(bandParticipationTable)
					.values({ bandId: band.id, liveId, approved: false })

				return band
			}),
		)

		if (!result.success)
			return fail(new RepositoryError("BandTableの処理が失敗しました"))

		const row = result.value
		const band: Band = {
			id: row.id,
			name: row.name,
			leaderId: row.leaderId,
		}

		return success(band)
	}
	async getByLiveId(
		liveId: number,
	): Promise<Result<BandParticipation[], RepositoryError>> {
		const result = await wrapPromise(
			this.db
				.select()
				.from(bandParticipationTable)
				.innerJoin(bandTable, eq(bandParticipationTable.bandId, bandTable.id))
				.innerJoin(liveTable, eq(bandParticipationTable.liveId, liveTable.id))
				.where(eq(bandParticipationTable.liveId, liveId)),
		)

		if (!result.success) {
			return fail(new RepositoryError("BandTableの処理が失敗しました"))
		}

		const rows = result.value

		const bandParticipations: BandParticipation[] = rows.map(
			(row) =>
				({
					id: row.band_participation.id,
					live: {
						id: row.live.id,
						name: row.live.name,
						description: row.live.description,
						ownerId: row.live.ownerId,
					},
					band: {
						id: row.band.id,
						name: row.band.name,
						leaderId: row.band.leaderId,
					},
					approved: row.band_participation.approved,
				}) satisfies BandParticipation,
		)

		return success(bandParticipations)
	}

	async getById(id: number): Promise<Result<Band | null, RepositoryError>> {
		const result = await wrapPromise(
			this.db.select().from(bandTable).where(eq(bandTable.id, id)),
		)

		if (!result.success) {
			return fail(new RepositoryError("BandTableの処理が失敗しました"))
		}

		const bandRow = result.value[0] as BandTable | undefined

		if (!bandRow) return success(null)

		const band: Band = {
			id: bandRow.id,
			name: bandRow.name,
			leaderId: bandRow.leaderId,
		}

		return success(band)
	}
}
