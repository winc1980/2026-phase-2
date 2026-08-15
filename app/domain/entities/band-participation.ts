import type { Band } from "./band"
import type { Live } from "./live"

export type BandParticipation = {
	id: number
	live: Live
	band: Band
	approved: boolean
}
