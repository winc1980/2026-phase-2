import { useEffect, useState } from "react"

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
		</div>
	)
}
