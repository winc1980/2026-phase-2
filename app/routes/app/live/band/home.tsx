import { redirect, useSubmit } from "react-router"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import type { User } from "~/domain/entities/user"
import { bandContext } from "~/middlewares/band"
import { liveContext } from "~/middlewares/live"
import { repositoryContext } from "~/middlewares/repositories"
import {
	createSessionCommittedHeader,
	getSessionFromRequest,
} from "~/sessions/sessions"
import type { Route } from "./+types/home"

export async function loader({ context, request }: Route.LoaderArgs) {
	const session = await getSessionFromRequest(request)
	const { live, isOwner } = context.get(liveContext)
	const { isApproved, band } = context.get(bandContext)
	const { userRepository } = context.get(repositoryContext)
	const result = await userRepository.getById(band.leaderId)

	if (!result.success) {
		session.flash("toastPayload", {
			type: "error",
			message: "データベースエラー",
		})

		return redirect(`/app/live/${live.id}/band/${band.id}`, {
			headers: await createSessionCommittedHeader(session),
		})
	}

	const leader = result.value as User

	return { isApproved, band, leader, isOwner }
}

export default function BandHomePage({
	loaderData: { isApproved, band, leader, isOwner },
}: Route.ComponentProps) {
	const submit = useSubmit()
	return (
		<div className="space-y-6">
			<div className="space-y-1">
				<div className="flex items-center gap-2">
					<h1 className="text-2xl font-semibold">{band.name}</h1>
					{isApproved ? (
						<Badge variant="default">参加許可済み</Badge>
					) : (
						<Badge variant="destructive">参加未許可</Badge>
					)}
				</div>
				<p className="text-muted-foreground text-sm">{leader.name}</p>
			</div>
			{isOwner && !isApproved && (
				<div className="flex justify-between items-center">
					<div className="space-y-1">
						<h1 className="text-2xl font-semibold">申請を承認する</h1>
						<p className="text-muted-foreground text-ms">
							承認すると出演可能時間の設定、出演時間の設定ができるようになります。
						</p>
					</div>
					<Button
						variant="brand"
						size="xl"
						onClick={() => {
							submit(null, { method: "POST" })
						}}
					>
						承認する
					</Button>
				</div>
			)}
		</div>
	)
}

export async function action({ context, request }: Route.ActionArgs) {
	const session = await getSessionFromRequest(request)
	const { isOwner } = context.get(liveContext)

	if (!isOwner) {
		session.flash("toastPayload", {
			type: "error",
			message: "管理者のみがこの操作を行うことができます",
		})
		return new Response(null, {
			headers: await createSessionCommittedHeader(session),
		})
	}

	const { bandRepository } = context.get(repositoryContext)
	const { band } = context.get(bandContext)

	const result = await bandRepository.approveBandApplication(band.id)

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
		message: `バンド「${band.name}」の参加申請を承認しました`,
	})
	return new Response(null, {
		headers: await createSessionCommittedHeader(session),
	})
}
