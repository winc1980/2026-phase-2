import { Link } from "react-router"
import { Button } from "../ui/button"

export function Login() {
	return (
		<Button variant="brand" size="xl" className="rounded-2xl" asChild>
			<Link to="/app/live/create">ライブを作成する</Link>
		</Button>
	)
}

export function Register() {
	return (
		<Button variant="brand" size="xl" className="rounded-2xl" asChild>
			<Link to="/auth/register">新規アカウント登録</Link>
		</Button>
	)
}

export function Home() {
	return (
		<Button variant="brand" size="xl" className="rounded-2xl" asChild>
			<Link to="/app">ホームに移動</Link>
		</Button>
	)
}
