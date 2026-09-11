import { PlusIcon } from "lucide-react"
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
		<div>
			<h1>トップページ</h1>
			<div>{message}</div>
			<Button variant="brand" size="xl" className="rounded-2xl" asChild>
				<Link to="/auth/login">
					<PlusIcon />
					ログインページに遷移
				</Link>
			</Button>
		</div>
	)
}
