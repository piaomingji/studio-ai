import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { buildPrompt, getStyle, type BgColor } from "../../lib/styles";
import { createClient } from "@vercel/kv";

const kv = createClient({
  url: process.env.KV_REST_API_URL || process.env.REDIS_REST_API_URL || "",
  token: process.env.KV_REST_API_TOKEN || process.env.REDIS_REST_API_TOKEN || "",
});

async function safeKvGet(key: string): Promise<number> {
  try {
    if (!process.env.KV_REST_API_URL && !process.env.REDIS_REST_API_URL) return 0;
    const val = await kv.get<number>(key);
    return typeof val === "number" ? val : 0;
  } catch (e) {
    console.warn("KV get failed:", e);
    return 0;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeKvSet(key: string, value: number, opts?: any) {
  try {
    if (!process.env.KV_REST_API_URL && !process.env.REDIS_REST_API_URL) return;
    await kv.set(key, value, opts);
  } catch (e) {
    console.warn("KV set failed:", e);
  }
}

export const runtime = "nodejs";
export const maxDuration = 60;

interface ModelSuccessResult {
  success: true;
  imageUrl: string;
  timeSec: string;
}

interface ModelErrorResult {
  success: false;
  error: string;
}

type ModelResult = ModelSuccessResult | ModelErrorResult;

function toUserMessage(err: unknown, fallback: string): string {
  const errMsg = err instanceof Error ? err.message : String(err);
  if (errMsg.includes("not found") || errMsg.includes("404")) {
    return "モデルが見つかりません。APIキーに権限がないか、サポートされていないモデルです。(404)";
  }
  if (errMsg.includes("quota") || errMsg.includes("429")) {
    return "API呼び出し制限を超過しました。しばらく経ってから再試行してください。(429)";
  }
  return fallback;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const imageBase64: string | undefined = body.imageBase64;
    const styleId: string = body.styleId ?? body.style ?? "corporate";
    const bgColor: BgColor | undefined = body.bgColor;
    const rawCustomPrompt: string | undefined = body.customPrompt;
    const plan: string = body.plan ?? "free";

    // Enforce IP-based rate limiting for free/trial plans
    if (plan === "free" || plan === "quota") {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.ip || "127.0.0.1";
      const key = `studio-ai:ip:${ip}`;
      const count = await safeKvGet(key);

      if (count >= 3) {
        return NextResponse.json(
          { error: "無料お試しの制限回数（3回）を超過しました。引き続き生成するには、有料プランへのご加入をお願いいたします。" },
          { status: 403 }
        );
      }

      // Record generation count permanently
      await safeKvSet(key, count + 1);
    }

    if (!imageBase64) {
      return NextResponse.json(
        { error: "まず写真をアップロードしてください。" },
        { status: 400 }
      );
    }

    if (styleId === "custom") {
      const trimmed = rawCustomPrompt?.trim() ?? "";
      if (!trimmed) {
        return NextResponse.json(
          { error: "カスタムスタイルの説明を入力してください。" },
          { status: 400 }
        );
      }
      if (trimmed.length > 500) {
        return NextResponse.json(
          { error: "カスタムスタイルの説明は500文字以内で入力してください。" },
          { status: 400 }
        );
      }
    } else if (!getStyle(styleId)) {
      return NextResponse.json(
        { error: "サポートされていないスタイルです。" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "サーバー設定エラー: APIキーが設定されていません。" },
        { status: 500 }
      );
    }

    // Strip the data-URL prefix to get raw base64
    let rawBase64 = imageBase64;
    let mimeType = "image/jpeg"; // default

    const matches = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      mimeType = matches[1];
      rawBase64 = matches[2];
    } else if (imageBase64.includes("base64,")) {
      rawBase64 = imageBase64.split("base64,")[1];
    }

    const prompt = buildPrompt({
      styleId,
      bgColor,
      customPrompt: rawCustomPrompt,
    });

    const ai = new GoogleGenAI({ apiKey, vertexai: false });

    // Single attempt against one model; returns null if no image came back.
    const callModel = async (model: string): Promise<ModelSuccessResult | null> => {
      const startTime = Date.now();
      const interaction = await ai.interactions.create({
        model,
        input: [
          { type: "text", text: prompt },
          { type: "image", data: rawBase64, mime_type: mimeType }
        ],
        response_format: {
          type: "image",
          aspect_ratio: "3:4",
          image_size: "2K"
        }
      });
      const timeSec = ((Date.now() - startTime) / 1000).toFixed(1);

      if (interaction?.output_image?.data) {
        return {
          success: true,
          imageUrl: `data:image/png;base64,${interaction.output_image.data}`,
          timeSec
        };
      }
      return null;
    };


    // Pro lane
    const runProModel = async (): Promise<ModelResult> => {
      try {
        const result = await callModel("gemini-3.1-flash-image");
        if (result) return result;
        return { success: false, error: "応答に生成結果の画像が含まれていません。" };
      } catch (err: unknown) {
        console.error("Pro Model Error:", err);
        return { success: false, error: toUserMessage(err, "Proモデルの画像生成に失敗しました。") };
      }
    };

    const proResult = await runProModel();

    if (!proResult.success) {
      throw new Error(`AIモデルでの生成に失敗しました。: ${proResult.error}`);
    }

    return NextResponse.json({
      lite: proResult,
      pro: proResult
    });

  } catch (err: unknown) {
    console.error("Generate API Error:", err);

    const rawErrorMsg = err instanceof Error ? err.message : String(err);
    let clientErrorMessage = "AIプロフィールの生成処理中にサーバーエラーが発生しました。もう一度お試しください。";

    if (rawErrorMsg.includes("API key") || rawErrorMsg.includes("key not found")) {
      clientErrorMessage = "サーバー設定エラー: APIキーの認証に問題が発生しました。管理者にお問い合わせください。";
    } else if (rawErrorMsg.includes("quota") || rawErrorMsg.includes("limit")) {
      clientErrorMessage = "サービスの呼び出し制限に達しました。しばらく経ってから再試行してください。";
    }

    return NextResponse.json(
      { error: clientErrorMessage },
      { status: 500 }
    );
  }
}
