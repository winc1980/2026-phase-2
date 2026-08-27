import { useEffect, useState } from "react"
import { Button } from '~/components/ui/button'
import { Link } from 'react-router';

export default function TopPage() {
	const [message, setMessage] = useState<string | null>(null)
	useEffect(() => {
		fetch(`${window.location.origin}/api/hello-react-router`)
			.then((res) => res.json())
			.then((json) => setMessage(json.message))
	}, [])

	return (
		<div>
			<h1>トップページ</h1>
			<div>{message}</div>
			<Button variant="brand" size="xl" className="rounded-2xl" asChild>
				<Link to="/auth/login">
					ログイン
				</Link>
			</Button>

			<Button variant="brand" size="xl" className="rounded-2xl" asChild>
				<Link to="/auth/register">
					新規アカウント登録
				</Link>
			</Button>
			S
			<Button variant="brand" size="xl" className="rounded-2xl" asChild>
				<Link to="/app">
					ホームへ
				</Link>
			</Button>
		</div>
	)
}
