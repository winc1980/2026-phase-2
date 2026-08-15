import type { PlainDate } from "~/lib/plain-date"
import type { PlainTime } from "~/lib/plain-time"

export type LiveDay = {
	id: number
	liveId: number
	date: PlainDate
	start: PlainTime
	end: PlainTime
}
