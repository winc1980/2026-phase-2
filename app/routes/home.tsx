import { useEffect, useState } from "react"
import { Home, Login, Register } from "~/components/common/Login"

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
			<Login />
			<Register />
			<Home />
		</div>
	)
}
