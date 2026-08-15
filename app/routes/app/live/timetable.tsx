import { redirect } from "react-router"
import { liveContext } from "~/middlewares/live"
import { repositoryContext } from "~/middlewares/repositories"
import {
	createSessionCommittedHeader,
	getSessionFromRequest,
} from "~/sessions/sessions"
import type { Route } from "./+types/timetable"

export async function loader({ context, request }: Route.LoaderArgs) {
	const session = await getSessionFromRequest(request)

	const { live } = context.get(liveContext)
	const { bandRepository } = context.get(repositoryContext)

	const result = await bandRepository.getByLiveId(live.id)
	if (!result.success) {
		session.flash("toastPayload", {
			type: "error",
			message: "データベースエラー",
		})

		return redirect(`/app/live/${live.id}`, {
			headers: await createSessionCommittedHeader(session),
		})
	}

	const bandParticipations = result.value.filter((part) => part.approved)

	return { bandParticipations }
}

export default function TimetablePage({
	loaderData: { bandParticipations },
}: Route.ComponentProps) {
	return (
		<div className="space-y-6">
			<div className="space-y-1">
				<h1 className="text-2xl font-semibold">ライブタイムテーブル編集</h1>
			</div>
			{bandParticipations.map((bandPart) => (
				<div key={bandPart.id}>{bandPart.band.name}</div>
			))}
		</div>
	)
}
