import { LoaderCircleIcon, SendIcon } from "lucide-react"
import { redirect, useFetcher } from "react-router"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import { liveContext } from "~/middlewares/live"
import { repositoryContext } from "~/middlewares/repositories"
import { userContext } from "~/middlewares/user"
import {
	createSessionCommittedHeader,
	getSessionFromRequest,
} from "~/sessions/sessions"
import type { Route } from "./+types/create"

export async function loader({ request, context }: Route.LoaderArgs) {
	const session = await getSessionFromRequest(request)
	const applicationToken = session.get("applicationToken")

	const { live } = context.get(liveContext)

	const user = context.get(userContext)

	if (!applicationToken) {
		session.flash("toastPayload", {
			type: "error",
			message: "バンド参加申請にはアクセスできません",
		})
		return redirect(`/app/live/${live.id}`, {
			headers: await createSessionCommittedHeader(session),
		})
	}

	return { user }
}

export default function BandCreatePage({
	loaderData: { user },
}: Route.ComponentProps) {
	const fetcher = useFetcher()

	return (
		<div className="space-y-6">
			<div className="space-y-1">
				<h1 className="text-2xl font-semibold">バンド参加申請</h1>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>バンド参加申請フォーム</CardTitle>
				</CardHeader>
				<CardContent>
					<fetcher.Form method="POST">
						<FieldGroup>
							<Field>
								<FieldLabel htmlFor="band-name">バンド名</FieldLabel>
								<Input id="band-name" name="band-name" required />
							</Field>
							<Field>
								<FieldLabel>バンドリーダー</FieldLabel>
								<FieldDescription>
									申請者がバンドリーダーとして自動的に登録されます
								</FieldDescription>
								<Input value={user.name} disabled />
							</Field>
							<Field orientation="responsive">
								<Button type="submit" disabled={fetcher.state === "submitting"}>
									{fetcher.state === "submitting" ? (
										<LoaderCircleIcon className="animate-spin" />
									) : (
										<SendIcon />
									)}
									バンドを作成
								</Button>
							</Field>
						</FieldGroup>
					</fetcher.Form>
				</CardContent>
			</Card>
		</div>
	)
}

export async function action({ request, context }: Route.ActionArgs) {
	const formData = await request.formData()
	const bandName = String(formData.get("band-name") || "")

	const session = await getSessionFromRequest(request)

	if (!bandName) {
		session.flash("toastPayload", {
			type: "error",
			message: "バンド名を入力してください",
		})
		return new Response(null, {
			headers: await createSessionCommittedHeader(session),
		})
	}

	const { bandRepository } = context.get(repositoryContext)
	const user = context.get(userContext)
	const { live } = context.get(liveContext)
	const result = await bandRepository.create(bandName, user.id, live.id)

	if (!result.success) {
		session.flash("toastPayload", {
			type: "error",
			message: "データベースエラー",
		})
		return new Response(null, {
			headers: await createSessionCommittedHeader(session),
		})
	}

	const band = result.value

	session.flash("toastPayload", {
		type: "success",
		message: `バンド「${band.name}」として参加申請を行いました`,
	})
	session.unset("applicationToken")

	return redirect(`/app/live/${live.id}`, {
		headers: await createSessionCommittedHeader(session),
	})
}
