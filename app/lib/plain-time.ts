import type { Serde } from "./serde"

export type PlainTimeLike = {
	hour: number
	minute: number
}

export class PlainTime implements PlainTimeLike {
	hour: number
	minute: number

	static serde: Serde<PlainTime, string> = {
		serialize(s) {
			return `${s.hour}:${s.minute}`
		},
		deserialize(s) {
			const result = s.match(/(\d{1,2}):(\d{1,2})/)
			if (result === null) {
				throw new Error(`${s} を PlainTime にパースすることに失敗しました`)
			}
			const hour = parseInt(result[1], 10)
			const minute = parseInt(result[2], 10)

			return new PlainTime({
				hour,
				minute,
			})
		},
	}

	constructor({ hour, minute }: { hour: number; minute: number }) {
		if (hour < 0 || hour >= 24) {
			throw new Error(`hour: ${hour}は0~23の範囲にある必要があります`)
		}
		if (minute < 0 || minute >= 60) {
			throw new Error(`minute: ${minute}は0~59の範囲にある必要があります`)
		}
		this.hour = hour
		this.minute = minute
	}

	static now(): PlainTime {
		const date = new Date()
		return new PlainTime({ hour: date.getHours(), minute: date.getMinutes() })
	}
}
