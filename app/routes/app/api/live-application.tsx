import { Link, redirect } from "react-router"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { repositoryContext } from "~/middlewares/repositories"
import {
	createSessionCommittedHeader,
	getSessionFromRequest,
} from "~/sessions/sessions"
import type { Route } from "../api/+types/live-application"

export async function loader({ params, context, request }: Route.LoaderArgs) {
	const { liveRepository } = context.get(repositoryContext)
	const result = await liveRepository.verifyApplicationToken(params.token)
	if (!result.success) throw result.error

	const verification = result.value

	if (verification.status === "verified") {
		const session = await getSessionFromRequest(request)
		session.set("applicationToken", params.token)
		return redirect(`/app/live/${verification.liveId}/band/create`, {
			headers: await createSessionCommittedHeader(session),
		})
	}

	return { verification }
}

export default function LiveApplicationEntryPage({
	loaderData: { verification },
}: Route.ComponentProps) {
	return (
		<div className="h-full flex items-center justify-center">
			{verification.status === "suspended" ? (
				<Card className="w-full max-w-xl">
					<CardHeader>
						<CardTitle>このリンクは停止されています</CardTitle>
					</CardHeader>
					<CardContent>
						<Button variant="link" asChild>
							<Link to="/app">トップページに戻る</Link>
						</Button>
					</CardContent>
				</Card>
			) : (
				<Card className="w-full max-w-xl">
					<CardHeader>
						<CardTitle>このリンクは存在しません</CardTitle>
					</CardHeader>
					<CardContent>
						<Button variant="link" asChild>
							<Link to="/app">トップページに戻る</Link>
						</Button>
					</CardContent>
				</Card>
			)}
		</div>
	)
}
