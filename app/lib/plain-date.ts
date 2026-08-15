import type { Serde } from "./serde"

export type PlainDateLike = {
	year: number
	month: number
	day: number
}

export class PlainDate implements PlainDateLike {
	year: number
	month: number
	day: number

	static serde: Serde<PlainDate, string> = {
		serialize(s: PlainDate): string {
			return `${s.year.toString().padStart(4, "0")}/${s.month.toString()}/${s.day.toString()}`
		},
		deserialize(s: string): PlainDate {
			const result = s.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/)
			if (result === null) {
				throw new Error(`${s} を PlainDate にパースすることに失敗しました`)
			}
			const year = parseInt(result[1], 10)
			const month = parseInt(result[2], 10)
			const day = parseInt(result[3], 10)

			return new PlainDate({
				year,
				month,
				day,
			})
		},
	}

	constructor({
		year,
		month,
		day,
	}: { year: number; month: number; day: number }) {
		if (month < 1 || month > 12) {
			throw new Error(`month: ${month}は1~12の範囲にある必要があります`)
		}
		if (day < 1 || day > 31) {
			throw new Error(`day: ${day}は1~31の範囲にある必要があります`)
		}
		this.year = year
		this.month = month
		this.day = day
	}

	static now(): PlainDate {
		const date = new Date()
		return new PlainDate({
			year: date.getFullYear(),
			month: date.getMonth() + 1,
			day: date.getDate(),
		})
	}
}
