import type React from "react"
import { useEffect, useId, useState } from "react"
import { Input } from "~/components/ui/input"
import { PlainDate } from "~/lib/plain-date"
import { cn } from "~/lib/utils"

type DateInputProps = {
	hideYear: boolean
	value: PlainDate
	onChange: (date: PlainDate) => void
	label?: string
}

function daysInMonth(year: number, month: number): number {
	return new Date(year, month, 0).getDate()
}

function todayPlainDate(): PlainDate {
	const today = new Date()

	return new PlainDate({
		year: today.getFullYear(),
		month: today.getMonth() + 1,
		day: today.getDate(),
	})
}

const selectClass = cn(
	"h-9 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs",
	"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
	"outline-none transition-[color,box-shadow]",
)

export function DateInput({
	hideYear,
	value,
	onChange,
	label,
}: DateInputProps) {
	const id = useId()
	const today = todayPlainDate()
	const minYear = Math.min(today.year, value.year)
	const maxYear = Math.max(today.year, value.year) + 4
	const years = range(minYear, maxYear)
	const months = range(1, 12)
	const maxDay = daysInMonth(value.year, value.month)

	const [dayDraft, setDayDraft] = useState(value.day.toString())

	useEffect(() => {
		setDayDraft(value.day.toString())
	}, [])

	const update = ({
		year = value.year,
		month = value.month,
		day = value.day,
	}: {
		year?: number
		month?: number
		day?: number
	}) => {
		const maxDay = daysInMonth(year, month)
		if (day > maxDay) {
			setDayDraft(maxDay.toString())
			onChange(
				new PlainDate({
					year,
					month,
					day: maxDay,
				}),
			)
			return
		}
		onChange(
			new PlainDate({
				year,
				month,
				day: day,
			}),
		)
	}

	const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const raw = e.target.value
		if (raw === "") {
			setDayDraft("")
			update({
				day: 1,
			})
			return
		}
		if (!/^\d+$/.test(raw)) {
			return
		}

		setDayDraft(raw)

		const day = Number(raw)
		if (day < 1) {
			setDayDraft("")
			update({
				day: 1,
			})
			return
		}
		if (day > maxDay) {
			update({
				day: maxDay,
			})
			setDayDraft(maxDay.toString())
			return
		}

		update({ day: day })
	}

	return (
		<fieldset className="flex flex-col gap-1.5">
			{label && <legend className="text-sm text-foreground">{label}</legend>}

			<div className="flex items-center gap-2">
				{!hideYear && (
					<>
						<select
							id={`${id}-year`}
							value={value.year}
							onChange={(e) => update({ year: Number(e.target.value) })}
							className={cn(selectClass, "w-24")}
						>
							{years.map((year) => (
								<option key={year} value={year}>
									{year}
								</option>
							))}
						</select>

						<label
							htmlFor={`${id}-year`}
							className="text-sm text-muted-foreground"
						>
							年
						</label>
					</>
				)}
				<select
					id={`${id}-month`}
					value={value.month}
					onChange={(e) => update({ month: Number(e.target.value) })}
					className={cn(selectClass, "w-16")}
				>
					{months.map((month) => (
						<option key={month} value={month}>
							{month}
						</option>
					))}
				</select>

				<label
					htmlFor={`${id}-month`}
					className="text-sm text-muted-foreground"
				>
					月
				</label>

				<Input
					id={`${id}-day`}
					type="text"
					inputMode="numeric"
					value={dayDraft}
					onChange={handleDayChange}
					onBlur={() => setDayDraft(value.day.toString())}
					className="w-16"
				/>

				<label htmlFor={`${id}-day`} className="text-sm text-muted-foreground">
					日
				</label>
			</div>
		</fieldset>
	)
}

function range(from: number, to: number): number[] {
	return Array.from({ length: to - from + 1 }, (_, i) => from + i)
}
