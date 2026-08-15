import { useId, useState } from "react"
import { Input } from "~/components/ui/input"
import { PlainTime } from "~/lib/plain-time"

type TimeInputProps = {
	value: PlainTime
	onChange: (time: PlainTime) => void
	label?: string
}

export function TimeInput({ value, onChange, label }: TimeInputProps) {
	const id = useId()
	const [hourDraft, setHourDraft] = useState(value.hour.toString())
	const [minuteDraft, setMinuteDraft] = useState(value.minute.toString())

	const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const raw = e.target.value

		if (raw === "") {
			setHourDraft("")
			onChange(
				new PlainTime({
					hour: 0,
					minute: value.minute,
				}),
			)
			return
		}

		if (!/^\d+$/.test(raw)) {
			return
		}

		setHourDraft(raw)

		const hour = Number(raw)

		if (hour > 23) {
			setHourDraft("23")
			onChange(
				new PlainTime({
					hour: 23,
					minute: value.minute,
				}),
			)
			return
		}

		onChange(
			new PlainTime({
				hour,
				minute: value.minute,
			}),
		)
	}

	const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const raw = e.target.value

		if (raw === "") {
			setMinuteDraft("")
			onChange(
				new PlainTime({
					hour: value.hour,
					minute: 0,
				}),
			)
			return
		}

		if (!/^\d+$/.test(raw)) {
			return
		}

		setMinuteDraft(raw)

		const minute = Number(raw)

		if (minute > 59) {
			setMinuteDraft("59")
			onChange(
				new PlainTime({
					hour: value.hour,
					minute: 59,
				}),
			)
			return
		}

		onChange(
			new PlainTime({
				hour: value.hour,
				minute,
			}),
		)
	}

	return (
		<fieldset className="flex flex-col gap-1.5">
			{label && <legend className="text-sm text-foreground">{label}</legend>}

			<div className="flex items-center gap-2">
				<Input
					id={`${id}-hour`}
					type="text"
					inputMode="numeric"
					value={hourDraft}
					onChange={handleHourChange}
					onBlur={() => setHourDraft(value.hour.toString())}
					className="w-16"
				/>

				<label htmlFor={`${id}-hour`} className="text-sm text-muted-foreground">
					時
				</label>

				<Input
					id={`${id}-minute`}
					type="text"
					inputMode="numeric"
					value={minuteDraft}
					onChange={handleMinuteChange}
					onBlur={() => setMinuteDraft(value.minute.toString())}
					className="w-16"
				/>

				<label
					htmlFor={`${id}-minute`}
					className="text-sm text-muted-foreground"
				>
					分
				</label>
			</div>
		</fieldset>
	)
}
