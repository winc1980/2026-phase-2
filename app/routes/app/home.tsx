import { PlusIcon } from "lucide-react"
import { Link } from "react-router"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { repositoryContext } from "~/middlewares/repositories"
import { userContext } from "~/middlewares/user"
import type { Route } from "./+types/home"

export async function loader({ context }: Route.LoaderArgs) {
	const user = context.get(userContext)
	const { liveRepository } = context.get(repositoryContext)
	const result = await liveRepository.getByOwnerId(user.id)
	if (!result.success) throw result.error
	const lives = result.value
	return { lives }
}

export default function AppHomePage({
	loaderData: { lives },
}: Route.ComponentProps) {
	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div className="space-y-1">
					<h1 className="text-2xl font-semibold">ライブ</h1>
					<p className="text-muted-foreground text-sm">参加・企画したライブ</p>
				</div>
				<Button variant="brand" size="xl" className="rounded-2xl" asChild>
					<Link to="/app/live/create">
						<PlusIcon />
						ライブを作成
					</Link>
				</Button>
				<Button variant="brand" size="xl" className="rounded-2xl" asChild>
					<Link to=""></Link>

				</Button>
			</div>
			<div className="space-y-4">
				{lives.map((live) => (
					<Link to={`/app/live/${live.id}`} key={live.id}>
						<Card>
							<CardHeader>
								<CardTitle>{live.name}</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-muted-foreground">{live.description}</div>
							</CardContent>
						</Card>
					</Link>
				))}
			</div>
		</div>
	)
}
