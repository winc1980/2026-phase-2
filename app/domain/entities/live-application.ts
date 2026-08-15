import type { PlainDate } from "~/lib/plain-date"
import type { PlainTime } from "~/lib/plain-time"

export type LiveApplication = {
	id: number
	name: string
	liveId: number
	token: string
	available: boolean
	updatedAt: [PlainDate, PlainTime]
}
