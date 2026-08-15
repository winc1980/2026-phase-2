import * as v from "valibot"
import { PlainDate, type PlainDateLike } from "./plain-date"
import { PlainTime, type PlainTimeLike } from "./plain-time"
import type { Serde } from "./serde"

// yyyy/mm/dd-hh/mm

const Deserializer = v.pipe(
	v.string(),
	v.transform((input) => input.split("-")),
	v.tuple([v.string(), v.string()]),
	v.transform<[string, string], [PlainDate, PlainTime]>(
		(inputs) =>
			[
				PlainDate.serde.deserialize(inputs[0]),
				PlainTime.serde.deserialize(inputs[1]),
			] as const,
	),
)

type r = v.InferOutput<typeof Deserializer>

export const PlainDateTimeSerde: Serde<[PlainDate, PlainTime], string> = {
	serialize: (s: [PlainDate, PlainTime]): string => {
		return `${PlainDate.serde.serialize(s[0])}-${PlainTime.serde.serialize(s[1])}`
	},
	deserialize: (s: string): [PlainDate, PlainTime] => {
		return v.parse(Deserializer, s)
	},
}
export function formatPlainDate(
	date: PlainDateLike,
	options: { useYear?: boolean } = { useYear: false },
) {
	if (options.useYear)
		return `${date.year.toString().padStart(4, "0")}/${date.month.toString()}/${date.day.toString()}`
	return `${date.month.toString()}/${date.day.toString()}`
}
export function plainTimeToMinutes(time: PlainTimeLike) {
	return time.hour * 60 + time.minute
}

export function formatPlainTime(time: PlainTimeLike) {
	return `${time.hour.toString()}:${time.minute.toString().padStart(2, "0")}`
}

export function formatPlainDateTime(dateTime: [PlainDateLike, PlainTimeLike]) {
	return `${formatPlainDate(dateTime[0])} ${formatPlainTime(dateTime[1])}`
}
