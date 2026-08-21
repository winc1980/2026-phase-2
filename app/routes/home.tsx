import { useEffect, useState } from "react"
import { Link } from "react-router"
import { Button } from "~/components/ui/button"

export default function TopPage() {
	const [message, setMessage] = useState<string | null>(null)
	useEffect(() => {
		fetch(`${window.location.origin}/api/hello-react-router`)
			.then((res) => res.json())
			.then((json) => setMessage(json.message))
	}, [])

	return (
		<div className="flex flex-col justify-center items-center">
			<h1>トップページ</h1>
			<Button variant="brand" size="xl" className="rounded-2xl w-[150px]" asChild>
					<Link to="/auth/register">
						アカウント登録
					</Link>
				</Button>
			<Button variant="brand" size="xl" className="rounded-2xl w-[150px]" asChild>
					<Link to="/app">
						ホーム画面
					</Link>
				</Button>
			<div>{message}</div>
		</div>
	)
}
