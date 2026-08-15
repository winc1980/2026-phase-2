import { useMatch, useResolvedPath } from "react-router" // v8はreact-router-domが廃止、react-routerから直接import

export function useIsActive(
	to: string,
	{ end = false, caseSensitive = false } = {},
) {
	const path = useResolvedPath(to)
	const match = useMatch({ path: path.pathname, end, caseSensitive })
	return match !== null
}
