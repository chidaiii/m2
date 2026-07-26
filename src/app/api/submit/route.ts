/**
 * 作品投稿フォームの送信を受け付ける API Route。
 *
 * セキュリティ設計：
 * - MICROCMS_WRITE_API_KEY はこのサーバー側モジュールでのみ参照する。
 *   フロントエンドには一切露出しない。
 * - フロントのバリデーションを信用せず、サーバー側で再検証する。
 *
 * 拡張ポイント（スパム対策）：
 * validateSubmission 関数が「検証ステップ」の差し込み口。
 * 現在は素通り（常に true）。後から reCAPTCHA 等を追加する場合は
 * この関数の中身だけを差し替えれば、Route 全体を書き換えずに対応できる。
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "microcms-js-sdk";
import { extractVideoId } from "@/lib/youtube";

/**
 * スパム対策の検証ステップ（将来の拡張ポイント）。
 *
 * 【将来の拡張について】
 * 現在は常に true を返すスタブ実装。reCAPTCHA 等を導入する場合は、
 * この関数の中身を差し替えるだけでよい。Route 全体の変更は不要。
 *
 * 実装例（reCAPTCHA v3）:
 *   const token = req.headers.get("x-recaptcha-token");
 *   return await verifyRecaptchaToken(token);
 */
async function validateSubmission(_req: NextRequest): Promise<boolean> {
  // TODO: ここに reCAPTCHA トークン検証などを追加する
  return true;
}

export async function POST(req: NextRequest) {
  // スパム対策検証（現在は素通り）
  const isValid = await validateSubmission(req);
  if (!isValid) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { youtubeUrl, type, style, genre } = body as {
    youtubeUrl?: unknown;
    type?: unknown;
    style?: unknown;
    genre?: unknown;
  };

  // サーバー側バリデーション（フロントのバリデーションを信用しない）
  if (!youtubeUrl || typeof youtubeUrl !== "string") {
    return NextResponse.json(
      { error: "youtubeUrl is required" },
      { status: 400 }
    );
  }

  const videoId = extractVideoId(youtubeUrl);
  if (!videoId) {
    return NextResponse.json(
      { error: "Invalid YouTube URL" },
      { status: 400 }
    );
  }

  const serviceDomain = process.env.MICROCMS_SERVICE_DOMAIN;
  const writeApiKey = process.env.MICROCMS_WRITE_API_KEY;

  if (!serviceDomain || !writeApiKey) {
    console.error("[submit] 環境変数が設定されていません");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const client = createClient({ serviceDomain, apiKey: writeApiKey });
  const normalizedUrl = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    // 重複チェック: 同じ動画IDが既に登録されていないか確認
    // （import-playlist.ts と同様、youtubeUrl の完全一致で判定）
    const existing = await client.getList<{ youtubeUrl: string }>({
      endpoint: "works",
      queries: {
        filters: `youtubeUrl[equals]${normalizedUrl}`,
        fields: "youtubeUrl",
        limit: 1,
      },
    });

    if (existing.contents.length > 0) {
      return NextResponse.json(
        { error: "この動画は既に登録されています" },
        { status: 409 }
      );
    }

    /**
     * isDraft: true で下書き保存する。
     * microCMS 管理画面に「下書き」として溜まり、管理者が確認・承認後に公開できる。
     * microcms-js-sdk の create() は isDraft オプションをサポートしている。
     */
    await client.create({
      endpoint: "works",
      content: {
        youtubeUrl: normalizedUrl,
        title: "", // タイトルは承認時に管理者が入力する
        type: Array.isArray(type) ? type : [],
        style: Array.isArray(style) ? style : [],
        genre: Array.isArray(genre) ? genre : [],
      },
      isDraft: true,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[submit] microCMS への書き込みに失敗しました:", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
