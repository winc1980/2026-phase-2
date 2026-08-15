import { redirect } from "react-router"
import * as v from "valibot"
import { Card, CardContent } from "~/components/ui/card"
import type { BandAvailability } from "~/domain/entities/band-availability"
import {
	formatPlainDate,
	formatPlainTime,
	plainTimeToMinutes,
} from "~/lib/plain-datetime-utils"
import { PlainTime } from "~/lib/plain-time"
import { wrapPromise } from "~/lib/result"
import { bandContext } from "~/middlewares/band"
import { liveContext } from "~/middlewares/live"
import { repositoryContext } from "~/middlewares/repositories"
import {
	createSessionCommittedHeader,
	getSessionFromRequest,
} from "~/sessions/sessions"
import type { Route } from "./+types/availability"
import { AvailabilityDayCard } from "./availability-day-card"

export async function loader({ context, request }: Route.LoaderArgs) {
	const { live } = context.get(liveContext)
	const { isApproved, band, isLeader } = context.get(bandContext)

	const session = await getSessionFromRequest(request)

	if (!isLeader) {
		session.flash("toastPayload", {
			type: "error",
			message: "あなたはバンドリーダーではありません",
		})
		return redirect(`/app/live/${live.id}/band/${band.id}`, {
			headers: await createSessionCommittedHeader(session),
		})
	}

	if (!isApproved) {
		session.flash("toastPayload", {
			type: "error",
			message: "申請中です。アクセスできません。",
		})
		return redirect(`/app/live/${live.id}/band/${band.id}`, {
			headers: await createSessionCommittedHeader(session),
		})
	}

	const { liveRepository, bandRepository } = context.get(repositoryContext)

	const [liveDaysResult, availabilitiesResult] = await Promise.all([
		liveRepository.getLiveDays(live.id),
		bandRepository.getAvailabilities(band.id, live.id),
	])

	if (!liveDaysResult.success) throw liveDaysResult.error
	if (!availabilitiesResult.success) throw availabilitiesResult.error

	const availabilitiesByLiveDayId = availabilitiesResult.value.reduce<
		Record<number, BandAvailability[]>
	>((acc, availability) => {
		acc[availability.liveDayId] ??= []
		acc[availability.liveDayId].push(availability)
		return acc
	}, {})

	return { band, liveDays: liveDaysResult.value, availabilitiesByLiveDayId }
}

export default function BandAvailabilityPage({
	loaderData: { band, liveDays, availabilitiesByLiveDayId },
}: Route.ComponentProps) {
	return (
		<div className="mx-auto max-w-3xl space-y-8">
			{/* ページヘッダー */}
			<div className="space-y-2">
				<h1 className="text-2xl font-semibold tracking-tight">
					出演可能時間の調整
				</h1>
				<p className="text-sm text-muted-foreground">
					「{band.name}」が出演できる時間帯を開催日ごとに登録してください。
				</p>
			</div>

			{liveDays.length === 0 ? (
				<Card>
					<CardContent className="text-sm text-muted-foreground">
						このライブにはまだ開催日が設定されていません。ライブ管理者にお問い合わせください。
					</CardContent>
				</Card>
			) : (
				<div className="space-y-4">
					{liveDays.map((liveDay) => (
						<AvailabilityDayCard
							key={liveDay.id}
							liveDay={liveDay}
							availabilities={availabilitiesByLiveDayId[liveDay.id] ?? []}
						/>
					))}
				</div>
			)}
		</div>
	)
}

const PlainTimeSchema = v.pipe(
	v.string(),
	v.transform((input) => PlainTime.serde.deserialize(input)),
)

const IdSchema = v.pipe(
	v.string(),
	v.transform((input) => Number(input)),
	v.number(),
	v.integer(),
)

const FormDataSchema = v.variant("intent", [
	v.pipe(
		v.object({
			intent: v.literal("create-availability"),
			"live-day-id": IdSchema,
			start: PlainTimeSchema,
			end: PlainTimeSchema,
		}),
		v.transform((input) => ({
			intent: input.intent,
			liveDayId: input["live-day-id"],
			start: input.start,
			end: input.end,
		})),
	),
	v.pipe(
		v.object({
			intent: v.literal("delete-availability"),
			"availability-id": IdSchema,
		}),
		v.transform((input) => ({
			intent: input.intent,
			availabilityId: input["availability-id"],
		})),
	),
])

export async function action({ context, request }: Route.ActionArgs) {
	const session = await getSessionFromRequest(request)

	const { live } = context.get(liveContext)
	const { band, isLeader, isApproved } = context.get(bandContext)

	// loader のガードは POST には効かないのでここでも確認する
	if (!isLeader || !isApproved) {
		session.flash("toastPayload", {
			type: "error",
			message: "この操作を行う権限がありません",
		})
		return redirect(`/app/live/${live.id}/band/${band.id}`, {
			headers: await createSessionCommittedHeader(session),
		})
	}

	const formData = await request.formData()
	const parseResult = await wrapPromise(
		v.parseAsync(FormDataSchema, Object.fromEntries(formData)),
	)

	if (!parseResult.success) {
		session.flash("toastPayload", {
			type: "error",
			message: "エラー：フォームの形式が不明です",
		})
		return new Response(null, {
			headers: await createSessionCommittedHeader(session),
		})
	}

	const formPayload = parseResult.value
	const { liveRepository, bandRepository } = context.get(repositoryContext)

	if (formPayload.intent === "create-availability") {
		const { liveDayId, start, end } = formPayload

		const liveDaysResult = await liveRepository.getLiveDays(live.id)
		if (!liveDaysResult.success) {
			session.flash("toastPayload", {
				type: "error",
				message: "データベースエラー",
			})
			return new Response(null, {
				headers: await createSessionCommittedHeader(session),
			})
		}

		const liveDay = liveDaysResult.value.find((day) => day.id === liveDayId)

		if (!liveDay) {
			session.flash("toastPayload", {
				type: "error",
				message: "エラー：指定された開催日が見つかりません",
			})
			return new Response(null, {
				headers: await createSessionCommittedHeader(session),
			})
		}

		if (plainTimeToMinutes(start) >= plainTimeToMinutes(end)) {
			session.flash("toastPayload", {
				type: "error",
				message: "終了時刻は開始時刻より後にしてください",
			})
			return new Response(null, {
				headers: await createSessionCommittedHeader(session),
			})
		}

		if (
			plainTimeToMinutes(start) < plainTimeToMinutes(liveDay.start) ||
			plainTimeToMinutes(end) > plainTimeToMinutes(liveDay.end)
		) {
			session.flash("toastPayload", {
				type: "error",
				message: `${formatPlainDate(liveDay.date)}の開催時間（${formatPlainTime(liveDay.start)}〜${formatPlainTime(liveDay.end)}）の範囲内で入力してください`,
			})
			return new Response(null, {
				headers: await createSessionCommittedHeader(session),
			})
		}

		const result = await bandRepository.createAvailability(
			band.id,
			live.id,
			liveDay.id,
			start,
			end,
		)

		if (!result.success) {
			session.flash("toastPayload", {
				type: "error",
				message: "データベースエラー",
			})
			return new Response(null, {
				headers: await createSessionCommittedHeader(session),
			})
		}

		session.flash("toastPayload", {
			type: "success",
			message: `${formatPlainDate(liveDay.date)} の ${formatPlainTime(start)}〜${formatPlainTime(end)} を追加しました`,
		})
		return new Response(null, {
			headers: await createSessionCommittedHeader(session),
		})
	}

	if (formPayload.intent === "delete-availability") {
		const result = await bandRepository.deleteAvailability(
			formPayload.availabilityId,
			band.id,
		)

		if (!result.success) {
			session.flash("toastPayload", {
				type: "error",
				message: "データベースエラー",
			})
			return new Response(null, {
				headers: await createSessionCommittedHeader(session),
			})
		}

		session.flash("toastPayload", {
			type: "info",
			message: "出演可能時間を1件削除しました",
		})
		return new Response(null, {
			headers: await createSessionCommittedHeader(session),
		})
	}
}
