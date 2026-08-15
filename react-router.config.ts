import type { Config } from "@react-router/dev/config"

export default {
	// サーバーサイドレンダリングはデフォルトで有効
	// SPAを構築する際にはfalseに設定
	ssr: true,
} satisfies Config
