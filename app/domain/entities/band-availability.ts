import type { PlainTime } from "~/lib/plain-time"

export type BandAvailability = {
	id: number
	bandId: number
	liveId: number
	liveDayId: number
	start: PlainTime
	end: PlainTime
}
