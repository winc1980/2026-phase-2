---
seq: 3
difficulty: Easy
title: 通知の表示が`useEffect`で囲われていない
---

Reactの`useEffect`フックは、Reactと関係のない作用（副作用）を閉じ込めるために使うものです。
`app/routes/root-layout.tsx`では、通知を表示する`showToast`関数がコンポーネントの中で直接呼ばれてしまっています。

## 1 副作用とは

該当のコードは`app/routes/root-layout.tsx`にあります。

```tsx
export default function RootLayout({ loaderData }: Route.ComponentProps) {
	if (loaderData.toastPayload) {
		// 副作用
		showToast(loaderData.toastPayload)
	}
	// ...
}
```

「副作用（side effect）」とは何でしょうか？調べてみましょう。

<details>
<summary>ヒント</summary>

Reactのコンポーネントは「データを受け取って、画面（JSX）を返すだけ」の関数であることが理想とされています。
`showToast`は画面を返すのではなく、**画面の外に向かって「通知を出せ」と命令している**関数です。これが副作用です。

</details>

## 2 useEffectで包む

`showToast`を呼んでいる部分を`useEffect`の中に移動しましょう。

`useEffect`は`react`からimportします。

```tsx
import { useEffect } from "react"
```

## 3 発展：依存配列を適切に設定する

`useEffect`の第2引数には「依存配列」を渡します。

```tsx
useEffect(() => {
	// ここに処理
}, [/* ここが依存配列 */])
```

この配列に何を入れるべきかを考えて設定しましょう。

> [!note]
> 依存配列は「この値が変わったときだけ、もう一度実行してね」という指示です。
> - 空配列`[]`にすると、最初の1回だけ実行されます
> - 何も渡さないと、再レンダリングのたびに毎回実行されます
>
> 今回は「通知の内容が変わったときに通知を出したい」はずです。

動作確認は、新規登録（`/auth/register`）を行うと「ユーザー登録が完了しました」という通知が出るので、そこで試せます。
