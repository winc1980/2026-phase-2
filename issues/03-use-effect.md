---
seq: 3
difficulty: NORMAL
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

Reactのコンポーネントは「データを受け取って、画面（JSX）を返すだけ」の関数であることが理想とされています。
`showToast`は画面を返すのではなく、**画面の外に向かって「通知を出せ」と命令している**関数です。これが副作用です。

## 2 useEffectとは

`useEffect`は、レンダリング（画面を返す処理）とは別のタイミングで副作用を実行するためのReactフックです。
`react`からimportして使います。

```tsx
import { useEffect } from "react"
```

基本の形はこうです。

```tsx
useEffect(() => {
 // ここに副作用の処理を書く
}, [依存配列])
```

コンポーネント関数の中で直接`showToast(...)`のような副作用を呼んでしまうと、**レンダリング中**（画面を計算している最中）に副作用が実行されてしまいます。
Reactのレンダリングは、Strict Modeやサスペンスなどの仕組みにより1回で終わるとは限らず、複数回呼ばれたり途中で中断されたりすることがあります。副作用がレンダリングの回数に巻き込まれると、通知が2回出たり、意図しないタイミングで実行されたりする不具合につながります。
`useEffect`は「レンダリングが終わって画面に反映された後」に実行されるため、この問題を避けられます。

### 実際の使用例

`useEffect`が使われる典型的な場面をいくつか見てみましょう。

#### 例1: タイトルを変更する（DOM操作）

```tsx
useEffect(() => {
 document.title = `${unreadCount}件の未読通知`
}, [unreadCount])
```

`unreadCount`が変わるたびに、ブラウザのタブのタイトルを更新します。DOM操作はReactの外の世界に干渉する行為なので副作用です。

#### 例2: イベントリスナーの登録・解除

```tsx
useEffect(() => {
 const handleResize = () => setWidth(window.innerWidth)
 window.addEventListener("resize", handleResize)

 return () => window.removeEventListener("resize", handleResize)
}, [])
```

`useEffect`の中で返す関数は「クリーンアップ関数」と呼ばれ、次にeffectが実行される前や、コンポーネントが画面から消えるときに呼ばれます。登録したものは自分で片付ける、というのが基本です。

#### 例3: 外部データの取得

```tsx
useEffect(() => {
 let cancelled = false
 fetchUser(userId).then((user) => {
  if (!cancelled) setUser(user)
 })

 return () => {
  cancelled = true
 }
}, [userId])
```

APIへの通信もReactの外とのやり取りなので副作用です。`userId`が変わるたびに、新しいユーザー情報を取得し直します。

このように`useEffect`は、「DOMを直接触る」「タイマーを仕掛ける」「外部のAPIやイベントに接続する」といった、Reactのレンダリングの外側で起きることをまとめておくための場所です。
`showToast`も「通知UIというReactの外側の仕組みを呼び出す」処理なので、同じように`useEffect`の中に置くのが適切です。

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
>
> - 空配列`[]`にすると、最初の1回だけ実行されます
> - 何も渡さないと、再レンダリングのたびに毎回実行されます
>
> 今回は「通知の内容が変わったときに通知を出したい」はずです。

動作確認は、新規登録（`/auth/register`）を行うと「ユーザー登録が完了しました」という通知が出るので、そこで試せます。

<details>
<summary>模範解答</summary>

```tsx
import { useEffect } from "react"
import { data, isRouteErrorResponse, Outlet } from "react-router"
import { showToast } from "~/components/common/toast"
import { Toaster } from "~/components/ui/sonner"
import { BaseError } from "~/lib/error"
import { repositoryMiddleware } from "~/middlewares/repositories"
import { commitSession, getSession } from "~/sessions/sessions"
import type { Route } from "./+types/root-layout"

export const middleware: Route.MiddlewareFunction[] = [repositoryMiddleware]

export async function loader({ request }: Route.LoaderArgs) {
 const session = await getSession(request.headers.get("Cookie"))
 const toastPayload = session.get("toastPayload")
 return data(
  { toastPayload },
  { headers: { "Set-Cookie": await commitSession(session) } },
 )
}

export default function RootLayout({ loaderData }: Route.ComponentProps) {
 useEffect(() => {
  if (loaderData.toastPayload) {
   showToast(loaderData.toastPayload)
  }
 }, [loaderData.toastPayload])

 return (
  <>
   <Toaster position="top-center" />
   <Outlet />
  </>
 )
}
```

依存配列には`loaderData.toastPayload`を入れます。これにより「通知の内容が変わったとき」だけ`showToast`が再実行されるようになり、レンダリング中に副作用が紛れ込む問題も解消されます。

</details>

## 4 達成条件

- [ ] `app/routes/root-layout.tsx`で、`showToast`の呼び出しがレンダリング中の直接実行ではなく`useEffect`の中に移動されている
- [ ] `useEffect`の依存配列が、通知内容（`loaderData.toastPayload`など）の変化に応じて実行されるよう適切に設定されている
- [ ] 新規登録（`/auth/register`）を行うと、通知が正しく表示される（連続で出たり出なかったりしない）
