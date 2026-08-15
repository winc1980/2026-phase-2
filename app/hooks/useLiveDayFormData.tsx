import { useCallback, useState } from "react"
import type { PlainDate } from "~/lib/plain-date"
import type { PlainTime } from "~/lib/plain-time"

type LiveDayFormData = {
	id: string // ランタイムで生成
	date: PlainDate
	start: PlainTime
	end: PlainTime
}

export function useLiveDayFormData() {
	const [liveDays, setLiveDays] = useState<LiveDayFormData[]>([])

	const add = useCallback(
		(date: PlainDate, start: PlainTime, end: PlainTime) => {
			setLiveDays((prevs) => [
				...prevs.filter((prev) => prev.date !== date),
				{
					id: crypto.randomUUID(),
					date,
					start,
					end,
				},
			])
		},
		[setLiveDays],
	)

	const remove = useCallback(
		(id: string) => {
			setLiveDays((prev) => prev.filter((day) => day.id !== id))
		},
		[setLiveDays],
	)

	return { liveDays, addLiveDay: add, removeLiveDay: remove }
}
