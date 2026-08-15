import { LoaderCircleIcon, PlusIcon, Trash2 } from "lucide-react"
import { useState } from "react"
import { useFetcher } from "react-router"
import { TimeInput } from "~/components/common/TimeInput"
import { Button } from "~/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card"
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "~/components/ui/field"
import type { PlainDateLike } from "~/lib/plain-date"
import { formatPlainDate, formatPlainTime } from "~/lib/plain-datetime-utils"
import { PlainTime, type PlainTimeLike } from "~/lib/plain-time"

// loader から渡ってくる時点で PlainDate / PlainTime はプレーンなオブジェクトに
// なっているので、構造的な型で受け取る
type AvailabilityDayCardProps = {
	liveDay: {
		id: number
		date: PlainDateLike
		start: PlainTimeLike
		end: PlainTimeLike
	}
	availabilities: {
		id: number
		start: PlainTimeLike
		end: PlainTimeLike
	}[]
}

export function AvailabilityDayCard({
	liveDay,
	availabilities,
}: AvailabilityDayCardProps) {
	const fetcher = useFetcher()
	const [start, setStart] = useState(
		() =>
			new PlainTime({ hour: liveDay.start.hour, minute: liveDay.start.minute }),
	)
	const [end, setEnd] = useState(
		() => new PlainTime({ hour: liveDay.end.hour, minute: liveDay.end.minute }),
	)

	const isInvalidTimeRange =
		start.hour > end.hour ||
		(start.hour === end.hour && start.minute >= end.minute)

	return (
		<Card>
			<CardHeader>
				<CardTitle>{formatPlainDate(liveDay.date)}</CardTitle>
				<CardDescription>
					開催時間 {formatPlainTime(liveDay.start)}〜
					{formatPlainTime(liveDay.end)}
				</CardDescription>
			</CardHeader>

			<CardContent>
				<FieldGroup>
					<Field>
						<div className="space-y-1">
							<FieldLabel>出演可能時間</FieldLabel>
							<FieldDescription>
								複数の出演可能時間を追加できます。
							</FieldDescription>
						</div>

						<div className="space-y-4">
							{/* 登録済みの出演可能時間 */}
							{availabilities.length === 0 ? (
								<p className="text-sm text-muted-foreground">
									この日の出演可能時間はまだ登録されていません
								</p>
							) : (
								<div className="divide-y ">
									{availabilities.map((availability) => (
										<div
											key={availability.id}
											className="flex items-center mb-4 rounded-lg border justify-between gap-4 p-4"
										>
											<div className="min-w-0 space-y-1">
												<p className="font-medium">
													{formatPlainTime(availability.start)}
													{" 〜 "}
													{formatPlainTime(availability.end)}
												</p>
											</div>

											<fetcher.Form method="POST">
												<input
													type="hidden"
													name="intent"
													value="delete-availability"
												/>
												<input
													type="hidden"
													name="availability-id"
													value={availability.id}
												/>
												<Button
													type="submit"
													variant="ghost"
													size="icon"
													className="shrink-0 text-muted-foreground hover:text-destructive"
													aria-label="この出演可能時間を削除"
												>
													<Trash2 />
												</Button>
											</fetcher.Form>
										</div>
									))}
								</div>
							)}

							{/* 出演可能時間の追加 */}
							<fetcher.Form
								method="POST"
								className="rounded-lg border mt-8 bg-muted/30 p-4"
							>
								<input
									type="hidden"
									name="intent"
									value="create-availability"
								/>
								<input type="hidden" name="live-day-id" value={liveDay.id} />
								<input
									type="hidden"
									name="start"
									value={PlainTime.serde.serialize(start)}
								/>
								<input
									type="hidden"
									name="end"
									value={PlainTime.serde.serialize(end)}
								/>

								<div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
									<TimeInput
										label="開始時刻"
										value={start}
										onChange={setStart}
									/>

									<TimeInput label="終了時刻" value={end} onChange={setEnd} />

									<Button
										type="submit"
										disabled={
											isInvalidTimeRange || fetcher.state === "submitting"
										}
									>
										{fetcher.state === "submitting" ? (
											<LoaderCircleIcon className="animate-spin" />
										) : (
											<PlusIcon />
										)}
										追加
									</Button>
								</div>

								{isInvalidTimeRange && (
									<p className="text-red-600 mt-3">
										開始時間が終了時間よりも早くなっています
									</p>
								)}
							</fetcher.Form>
						</div>
					</Field>
				</FieldGroup>
			</CardContent>
		</Card>
	)
}
