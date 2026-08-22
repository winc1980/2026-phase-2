---
seq: 6
difficulty: HARD
title: データ取得が`useEffect`+`fetch`のままになっている
---

Phase 1のReact講座では`useEffect`の中で`fetch`を実行し、`setState`で値を設定していました。
しかしこのアプリケーションは「React Router」という便利キット（フレームワーク）を使っています。
React Routerのルール上、APIからのデータの取得は`loader`という関数の中で行うことができます。

## 1 今のコードを読む

`app/routes/home.tsx`（トップページ）を開いてください。

```tsx
export default function TopPage() {
 const [message, setMessage] = useState<string | null>(null)
 useEffect(() => {
  fetch(`${window.location.origin}/api/hello-react-router`)
   .then((res) => res.json())
   .then((json) => setMessage(json.message))
 }, [])
 // ...
}
```

Phase 1で書いたのと同じ形ですね。叩いているAPIの実体は`app/routes/app/api/hello-react-router.ts`にあります。開いて中身を見てみましょう。

## 2 お手本を読む

すでに`loader`を使っているファイルがこのプロジェクトにあります。`app/routes/app/home.tsx`を開いてください。

```tsx
export async function loader({ context }: Route.LoaderArgs) {
 // ... データを取ってくる
 return { lives }
}

export default function AppHomePage({
 loaderData: { lives },
}: Route.ComponentProps) {
 // loaderが返した値を、propsとして受け取れている
}
```

`loader`が`return`した値が、コンポーネントの`loaderData`に入ってくる、という関係になっています。

## 3 loaderに移す

お手本にならって、`app/routes/home.tsx`のメッセージ取得処理を`loader`に移しましょう。

移し終わったら、`useState`と`useEffect`のimportが不要になっているはずです。消しましょう。

> [!warning]
> `loader`は**サーバ側**で実行されます。そのため`window`はブラウザにしか存在しないので使えません。
> APIを`fetch`する代わりに、`hello-react-router.ts`の`loader`関数を直接importして呼ぶこともできます。どちらでも構いません。

型チェックが通ることを確認してください。

```sh
bun run typecheck
```

## 4 なぜloaderのほうが良いのか

移し終わったら、ブラウザの開発者ツールでトップページを読み込み直してみてください。
`useEffect`版と比べて、画面の表示のされ方に違いはありましたか？

<details>
<summary>考えるヒント</summary>

`useEffect`版では、次の順番で処理が進みます。

1. HTMLが届く（`message`は`null`なので、その部分は空っぽ）
2. JavaScriptが読み込まれる
3. `fetch`でAPIを叩く
4. 返ってきてから、やっと表示される

`loader`版では、サーバが**データを埋め込んだ状態のHTML**を返せます。
「一瞬なにも表示されない時間」が無くなるのがポイントです。

</details>

## 参考文献

- [Data Loading | React Router](https://reactrouter.com/start/framework/data-loading) — `loader`によるデータ取得の公式ドキュメント

## 5 達成条件

- [ ] `app/routes/home.tsx`のメッセージ取得処理が`useEffect`+`fetch`ではなく`loader`関数に移されている
- [ ] `useState`・`useEffect`のimportが不要になり削除されている
- [ ] `bun run typecheck`が通る
- [ ] トップページを開いたとき、メッセージが最初から表示される（読み込み後に一瞬空白になる時間が無い）
