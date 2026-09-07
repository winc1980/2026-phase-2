import { describe, expect, setSystemTime, test } from "bun:test"
import { PlainDate } from "~/lib/plain-date"

describe("constructor", () => {
	test("年月日をそのまま保持する", () => {
		const date = new PlainDate({ year: 2026, month: 9, day: 7 })

		expect(date.year).toBe(2026)
		expect(date.month).toBe(9)
		expect(date.day).toBe(7)
	})

	test.each([1, 12])("month: %pは受け入れられる", (month) => {
		expect(() => new PlainDate({ year: 2026, month, day: 1 })).not.toThrow()
	})

	test.each([0, 13, -1])("month: %pは範囲外なので失敗する", (month) => {
		expect(() => new PlainDate({ year: 2026, month, day: 1 })).toThrow(
			`month: ${month}は1~12の範囲にある必要があります`,
		)
	})

	test.each([1, 31])("day: %pは受け入れられる", (day) => {
		expect(() => new PlainDate({ year: 2026, month: 1, day })).not.toThrow()
	})

	test.each([0, 32, -1])("day: %pは範囲外なので失敗する", (day) => {
		expect(() => new PlainDate({ year: 2026, month: 1, day })).toThrow(
			`day: ${day}は1~31の範囲にある必要があります`,
		)
	})

	test("暦上存在しない日付でも月日の範囲内なら受け入れられる", () => {
		const date = new PlainDate({ year: 2026, month: 2, day: 31 })

		expect(date.month).toBe(2)
		expect(date.day).toBe(31)
	})

	test("年は範囲を検証されない", () => {
		expect(() => new PlainDate({ year: 0, month: 1, day: 1 })).not.toThrow()
		expect(() => new PlainDate({ year: -1, month: 1, day: 1 })).not.toThrow()
	})
})

describe("serde.serialize", () => {
	test("year/month/day 形式の文字列にする", () => {
		const date = new PlainDate({ year: 2026, month: 12, day: 31 })

		expect(PlainDate.serde.serialize(date)).toBe("2026/12/31")
	})

	test("年は4桁にゼロ埋めされる", () => {
		const date = new PlainDate({ year: 26, month: 1, day: 2 })

		expect(PlainDate.serde.serialize(date)).toBe("0026/1/2")
	})

	test("月日はゼロ埋めされない", () => {
		const date = new PlainDate({ year: 2026, month: 1, day: 2 })

		expect(PlainDate.serde.serialize(date)).toBe("2026/1/2")
	})
})

describe("serde.deserialize", () => {
	test("year/month/day 形式の文字列をパースする", () => {
		const date = PlainDate.serde.deserialize("2026/12/31")

		expect(date).toBeInstanceOf(PlainDate)
		expect(date.year).toBe(2026)
		expect(date.month).toBe(12)
		expect(date.day).toBe(31)
	})

	test("ゼロ埋めされた月日をパースする", () => {
		const date = PlainDate.serde.deserialize("2026/01/02")

		expect(date.month).toBe(1)
		expect(date.day).toBe(2)
	})

	test.each(["", "2026-12-31", "2026/12", "20/12/31", "abc"])(
		"%pはパースに失敗する",
		(input) => {
			expect(() => PlainDate.serde.deserialize(input)).toThrow(
				`${input} を PlainDate にパースすることに失敗しました`,
			)
		},
	)

	test("形式が合っていても月日が範囲外なら失敗する", () => {
		expect(() => PlainDate.serde.deserialize("2026/13/01")).toThrow(
			"month: 13は1~12の範囲にある必要があります",
		)
		expect(() => PlainDate.serde.deserialize("2026/12/32")).toThrow(
			"day: 32は1~31の範囲にある必要があります",
		)
	})

	test("serialize した文字列をそのまま復元できる", () => {
		const date = new PlainDate({ year: 2026, month: 9, day: 7 })

		expect(
			PlainDate.serde.deserialize(PlainDate.serde.serialize(date)),
		).toEqual(date)
	})
})

describe("now", () => {
	test("現在のローカル日付を返す", () => {
		setSystemTime(new Date(2026, 8, 7, 12, 34, 56))
		try {
			const date = PlainDate.now()

			expect(date.year).toBe(2026)
			expect(date.month).toBe(9)
			expect(date.day).toBe(7)
		} finally {
			setSystemTime()
		}
	})

	test("月が1始まりに補正される", () => {
		setSystemTime(new Date(2026, 0, 1, 0, 0, 0))
		try {
			expect(PlainDate.now().month).toBe(1)
		} finally {
			setSystemTime()
		}
	})
})
