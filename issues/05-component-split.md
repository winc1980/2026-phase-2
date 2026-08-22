---
seq: 5
difficulty: HARD
title: "`application.tsx`のコンポーネントが肥大化している"
---

過剰に肥大化したファイルは読みづらいです。
Reactは巨大なコンポーネントを、新しくコンポーネントを定義することで分割することができます。

対象は`app/routes/app/live/application.tsx`です。このファイルは450行あり、このプロジェクトで最も大きなファイルになっています。

## 1 何が入っているのか読む

まず、開発サーバを起動して実際の画面を見てください。

```sh
bun run dev
```

ライブを作成し、そのライブの「バンドの募集」ページを開くと、このファイルが描画している画面が見られます。

`LiveApplicationPage`関数の中身は、大きく3つのまとまりに分けられます。

1. **新しい募集リンクを作成するフォーム** — `Collapsible`で折りたためるカードと、確認用の`AlertDialog`
2. **「有効なリンク」の一覧**
3. **「停止されたリンク」の一覧**

それぞれが画面のどこに対応しているか、コードと見比べて確認しましょう。

## 2 コンポーネントに分割する

上の3つを、それぞれ別のコンポーネントとして切り出しましょう。

> [!note]
> コンポーネントとは、要するに**JSXを返す関数**です。
> 切り出したいJSXを新しい関数の`return`に移し、元の場所では`<新しい関数名 />`と書けば呼び出せます。

切り出すときに、そのコンポーネントが動くために**外から何を受け取る必要があるか**を考えてください。それがpropsになります。

たとえば「有効なリンク」の一覧（の一部）を切り出す場合、こういう流れになります。

**分割前**（`LiveApplicationPage`の中に直接書かれている）

```tsx
export default function LiveApplicationPage({
 loaderData: { availableApplicationsWithUrl },
}: Route.ComponentProps) {
 return (
  <Card>
   <CardHeader>
    <CardTitle>有効なリンク</CardTitle>
   </CardHeader>
   <CardContent>
    {availableApplicationsWithUrl.map((apl) => (
     <div key={apl.id}>{apl.name}</div>
    ))}
   </CardContent>
  </Card>
 )
}
```

**分割後**（新しい関数`AvailableApplicationList`に切り出す）

```tsx
function AvailableApplicationList({
 applications,
}: {
 applications: LiveApplicationWithUrl[]
}) {
 return (
  <Card>
   <CardHeader>
    <CardTitle>有効なリンク</CardTitle>
   </CardHeader>
   <CardContent>
    {applications.map((apl) => (
     <div key={apl.id}>{apl.name}</div>
    ))}
   </CardContent>
  </Card>
 )
}

export default function LiveApplicationPage({
 loaderData: { availableApplicationsWithUrl },
}: Route.ComponentProps) {
 return <AvailableApplicationList applications={availableApplicationsWithUrl} />
}
```

`availableApplicationsWithUrl`という配列がないと`AvailableApplicationList`は描画できないので、`applications`というpropsとして渡しています。実際の一覧には`onClick`のハンドラなど他にも必要な値があるので、同じ考え方で1つずつpropsに追加していってください。

<details>
<summary>ヒント：何をpropsで渡す？</summary>

たとえば「有効なリンク」の一覧は、`availableApplicationsWithUrl`と、コピー処理の`handleCopy`が無いと動きません。
一方で`openCreateDialog`や`initialAvailability`のようなstateは、作成フォームの中でしか使われていません。
**そのstateを使っているコンポーネントの中に、stateごと移動できないか**も考えてみましょう。

</details>

> [!warning]
> 分割の途中で画面が壊れたら、`bun run dev`を動かしたままブラウザを見ながら少しずつ進めてください。
> 一度にすべてを動かそうとせず、1つ切り出すごとに画面を確認するのがコツです。

## 3 重複に気づく

「有効なリンク」の一覧と「停止されたリンク」の一覧を、よく見比べてください。
ほとんど同じコードになっていませんか？

違うのは次の2点だけです。

- ボタンのアイコン（`PauseIcon` / `PlayIcon`）
- 送信する`intent`の値（`suspend-application` / `enable-application`）

この2つをpropsで受け取るようにすれば、**1つのコンポーネントで両方を表現できます**。挑戦してみましょう。

## 4 発展：別のファイルに配置する

切り出したコンポーネントを、`application.tsx`とは別のファイルに移動しましょう。

`app/components/`の中を覗いて、このプロジェクトがコンポーネントをどこに、どんな名前で置いているかを確認してから決めてください。

> [!note]
> 別ファイルに置いたコンポーネントを使うには、`export`して、使う側で`import`する必要があります。
> パスの先頭の`~/`は`app/`を指す、このプロジェクト独自の書き方です（`tsconfig.json`で設定されています）。

## 5 達成条件

- [ ] `application.tsx`の`LiveApplicationPage`が、作成フォーム／有効なリンク一覧／停止されたリンク一覧の3つ以上のコンポーネントに分割されている
- [ ] 「有効なリンク」と「停止されたリンク」の一覧が、アイコンと`intent`をpropsで受け取る1つの共通コンポーネントにまとめられている
- [ ] 分割後も募集リンクの作成・停止・再開・コピーが分割前と同じように動作する

### 発展（任意）

- [ ] 切り出したコンポーネントが`application.tsx`とは別のファイルに配置され、`export`/`import`されている
