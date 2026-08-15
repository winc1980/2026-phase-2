import { Link } from "react-router"
import { Badge } from "~/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { liveContext } from "~/middlewares/live"
import { repositoryContext } from "~/middlewares/repositories"
import type { Route } from "./+types/home"

export async function loader({ context }: Route.LoaderArgs) {
	const liveInfo = context.get(liveContext)

	const { bandRepository } = context.get(repositoryContext)
	const result = await bandRepository.getByLiveId(liveInfo.live.id)
	if (!result.success) throw result.error
	return { ...liveInfo, bandParts: result.value }
}

export default function LiveHomePage({
	loaderData: { live, bandParts },
}: Route.ComponentProps) {
	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div className="space-y-1">
					<h1 className="text-2xl font-semibold">参加するバンド</h1>
				</div>
			</div>
			<div className="grid grid-cols-2 gap-4">
				{bandParts.map(({ band, approved }) => (
					<Link to={`/app/live/${live.id}/band/${band.id}`} key={band.id}>
						<Card>
							<CardHeader>
								<CardTitle>{band.name}</CardTitle>
							</CardHeader>
							<CardContent>
								{approved ? (
									<Badge variant="default">参加許可済み</Badge>
								) : (
									<Badge variant="destructive">参加未許可</Badge>
								)}
							</CardContent>
						</Card>
					</Link>
				))}
			</div>
		</div>
	)
}
