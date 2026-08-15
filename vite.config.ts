import { reactRouter } from "@react-router/dev/vite"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, type PluginOption } from "vite"

// エラー抑制プラグイン
// 変更しないでください
const ignoreChromeDevtoolsJsonPlugin: PluginOption = {
	name: "ignore-chrome-devtools-json",
	configureServer(server) {
		server.middlewares.use((req, res, next) => {
			if (req.url === "/.well-known/appspecific/com.chrome.devtools.json") {
				res.statusCode = 204
				res.end()
				return
			}
			next()
		})
	},
}

export default defineConfig({
	plugins: [tailwindcss(), reactRouter(), ignoreChromeDevtoolsJsonPlugin],
	resolve: {
		tsconfigPaths: true,
	},
})
