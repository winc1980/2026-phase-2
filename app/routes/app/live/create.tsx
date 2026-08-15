import { PlusIcon, Trash2 } from "lucide-react"
import { useState } from "react"
import { Form, redirect } from "react-router"
import * as v from "valibot"
import { DateInput } from "~/components/common/DateInput"
import { TimeInput } from "~/components/common/TimeInput"
import { Button } from "~/components/ui/button"

import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "~/components/ui/card"
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import { Textarea } from "~/components/ui/textarea"
import { useLiveDayFormData } from "~/hooks/useLiveDayFormData"
import { PlainDate } from "~/lib/plain-date"
import {
	formatPlainDate,
	formatPlainTime,
	plainTimeToMinutes,
} from "~/lib/plain-datetime-utils"
import { PlainTime } from "~/lib/plain-time"
import { wrapPromise } from "~/lib/result"
import { repositoryContext } from "~/middlewares/repositories"
import { userContext } from "~/middlewares/user"
import {
	createSessionCommittedHeader,
	getSessionFromRequest,
} from "~/sessions/sessions"
import type { Route } from "./+types/create"

export default function LiveCreatePage() {
	const now = new Date()

	const [date, setDate] = useState(
		() =>
			new PlainDate({
				year: now.getFullYear(),
				month: now.getMonth() + 1,
				day: now.getDate(),
			}),
	)

	const [start, setStart] = useState(
		() => new PlainTime({ hour: now.getHours(), minute: 0 }),
	)

	const [end, setEnd] = useState(
		() => new PlainTime({ hour: now.getHours(), minute: 30 }),
	)

	const { liveDays, addLiveDay, removeLiveDay } = useLiveDayFormData()

	return (
		<div className="mx-auto max-w-3xl space-y-8">
			{/* ページヘッダー */}
			<div className="space-y-2">
				<h1 className="text-2xl font-semibold tracking-tight">ライブの作成</h1>
				<p className="text-sm text-muted-foreground">
					ライブの基本情報と開催日を設定してください。
				</p>
			</div>

			<Form method="POST">
				<Card>
					<CardHeader>
						<CardTitle>ライブ情報</CardTitle>
					</CardHeader>

					<CardContent>
						<FieldGroup>
							{/* ライブ名 */}
							<Field>
								<FieldLabel htmlFor="live-name">ライブの名前</FieldLabel>
								<Input
									id="live-name"
									name="live-name"
									placeholder="Summer Live 2026"
									required
								/>
							</Field>

							{/* 説明 */}
							<Field>
								<FieldLabel htmlFor="live-description">説明文</FieldLabel>
								<Textarea
									required
									id="live-description"
									name="live-description"
									placeholder="ライブについての説明を入力してください"
									className="min-h-24 resize-none"
								/>
							</Field>

							{/* 開催日 */}
							<Field>
								<div className="space-y-1">
									<FieldLabel>開催日</FieldLabel>
									<FieldDescription>
										複数の開催日を追加できます。
									</FieldDescription>
								</div>

								<div className="space-y-4">
									{/* action に渡す開催日のデータ */}
									<input
										type="hidden"
										id="live-days"
										name="live-days"
										value={JSON.stringify({
											liveDays: liveDays.map((liveDay) => ({
												id: liveDay.id,
												date: PlainDate.serde.serialize(liveDay.date),
												start: PlainTime.serde.serialize(liveDay.start),
												end: PlainTime.serde.serialize(liveDay.end),
											})),
										})}
									/>

									{/* 登録済みの開催日 */}
									{liveDays.length > 0 && (
										<div className="divide-y ">
											{liveDays.map((liveDay) => (
												<div
													key={liveDay.id}
													className="flex items-center mb-4 rounded-lg border justify-between gap-4 p-4"
												>
													<div className="min-w-0 space-y-1">
														<p className="font-medium">
															{formatPlainDate(liveDay.date)}
														</p>

														<p className="text-sm text-muted-foreground">
															{formatPlainTime(liveDay.start)}
															{" 〜 "}
															{formatPlainTime(liveDay.end)}
														</p>
													</div>

													<Button
														type="button"
														variant="ghost"
														size="icon"
														className="shrink-0 text-muted-foreground hover:text-destructive"
														onClick={() => removeLiveDay(liveDay.id)}
														aria-label="開催日を削除"
													>
														<Trash2 />
													</Button>
												</div>
											))}
										</div>
									)}

									{/* 開催日の追加 */}
									<div className="rounded-lg border mt-8 bg-muted/30 p-4">
										<div className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
											<DateInput
												hideYear={now.getMonth() + 1 < 10}
												value={date}
												onChange={setDate}
											/>

											<TimeInput value={start} onChange={setStart} />

											<TimeInput value={end} onChange={setEnd} />

											<Button
												type="button"
												onClick={() => {
													if (
														start.hour > end.hour ||
														(start.hour === end.hour &&
															start.minute > end.minute)
													) {
														return
													}
													addLiveDay(date, start, end)
												}}
											>
												<PlusIcon />
												追加
											</Button>
										</div>
										{(start.hour > end.hour ||
											(start.hour === end.hour &&
												start.minute > end.minute)) && (
											<p className="text-red-600 mt-3">
												開始時間が終了時間よりも早くなっています
											</p>
										)}
									</div>
								</div>
							</Field>
						</FieldGroup>
					</CardContent>

					<CardFooter className="justify-end border-t">
						<Button type="submit">ライブを作成</Button>
					</CardFooter>
				</Card>
			</Form>
		</div>
	)
}

const liveDaySchema = v.pipe(
	v.object({
		id: v.string(),
		date: v.string(),
		start: v.string(),
		end: v.string(),
	}),
	v.transform((input) => ({
		date: PlainDate.serde.deserialize(input.date),
		start: PlainTime.serde.deserialize(input.start),
		end: PlainTime.serde.deserialize(input.end),
	})),
)

const liveDaysSchema = v.object({
	liveDays: v.array(liveDaySchema),
})
const createLiveFormSchema = v.object({
	"live-name": v.pipe(
		v.string(),
		v.minLength(1, "ライブの名前を入力してください"),
	),

	"live-description": v.string(),

	"live-days": v.string(),
})
export async function action({ request, context }: Route.ActionArgs) {
	const session = await getSessionFromRequest(request)
	const formData = await request.formData()
	const formResult = await wrapPromise(
		v.parseAsync(createLiveFormSchema, {
			"live-name": formData.get("live-name"),
			"live-description": formData.get("live-description"),
			"live-days": formData.get("live-days"),
		}),
	)
	if (!formResult.success) {
		console.error(formResult.error)
		session.flash("toastPayload", {
			type: "error",
			message: "エラー：フォームの形式が不明です",
		})
		return new Response(null, {
			headers: await createSessionCommittedHeader(session),
		})
	}

	let liveDaysJson: unknown

	try {
		liveDaysJson = JSON.parse(formResult.value["live-days"])
	} catch (e) {
		console.error(e)
		session.flash("toastPayload", {
			type: "error",
			message: "エラー：フォームのJSONデータの形式が不明です",
		})
		return new Response(null, {
			headers: await createSessionCommittedHeader(session),
		})
	}

	const liveDaysResult = await wrapPromise(
		v.parseAsync(liveDaysSchema, liveDaysJson),
	)

	if (!liveDaysResult.success) {
		console.error(liveDaysResult.error)
		session.flash("toastPayload", {
			type: "error",
			message: "エラー：フォームの形式が不明です",
		})
		return new Response(null, {
			headers: await createSessionCommittedHeader(session),
		})
	}

	const liveName = formResult.value["live-name"]
	const liveDescription = formResult.value["live-description"]
	const liveDays = liveDaysResult.value.liveDays

	if (liveDays.length === 0) {
		session.flash("toastPayload", {
			type: "error",
			message: "開催日を1つ以上追加してください",
		})
		return new Response(null, {
			headers: await createSessionCommittedHeader(session),
		})
	}

	const hasInvalidTimeRange = liveDays.some(
		(liveDay) =>
			plainTimeToMinutes(liveDay.start) >= plainTimeToMinutes(liveDay.end),
	)

	if (hasInvalidTimeRange) {
		session.flash("toastPayload", {
			type: "error",
			message: "終了時間は開始時間より後にしてください",
		})
		return new Response(null, {
			headers: await createSessionCommittedHeader(session),
		})
	}

	// 開催日は1日につき1件だけ登録できる
	const dateKeys = liveDays.map((liveDay) =>
		PlainDate.serde.serialize(liveDay.date),
	)

	if (new Set(dateKeys).size !== dateKeys.length) {
		session.flash("toastPayload", {
			type: "error",
			message: "同じ日付の開催日が重複しています",
		})
		return new Response(null, {
			headers: await createSessionCommittedHeader(session),
		})
	}

	const user = context.get(userContext)
	const { liveRepository } = context.get(repositoryContext)

	const result = await liveRepository.create(
		liveName,
		liveDescription,
		user.id,
		liveDays,
	)

	if (!result.success) {
		console.error(result.error)
		session.flash("toastPayload", {
			type: "error",
			message: "データベースエラー",
		})
		return new Response(null, {
			headers: await createSessionCommittedHeader(session),
		})
	}

	const live = result.value

	session.flash("toastPayload", {
		type: "success",
		message: `ライブ「${live.name}」を作成しました`,
	})

	return redirect(`/app/live/${live.id}`, {
		headers: await createSessionCommittedHeader(session),
	})
}
