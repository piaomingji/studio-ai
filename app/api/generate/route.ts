import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { buildPrompt, getStyle, type BgColor } from "../../lib/styles";
import { quotaGet, quotaIncrement } from "@/lib/quotaStore";
import { IP_QUOTA_KEY, GOOGLE_QUOTA_KEY, QUOTA_TTL_SECONDS, FREE_TOTAL_CREDITS, FREE_GUEST_CREDITS } from "@/lib/quota";
import { getCurrentUser, deductUserCredit, getIpQuotaFromCookie, incrementIpQuotaCookie } from "@/lib/auth";

/**
 * Counters used to live in @vercel/kv, which speaks Redis over HTTP and needs KV_REST_API_URL and
 * KV_REST_API_TOKEN. Neither was ever set, so every read returned 0 and every write was dropped:
 * the free limit was never actually enforced. They now go through the shared store, which uses the
 * plain redis:// URL the Vercel Redis integration provides.
 */
async function safeKvGet(key: string): Promise<number> {
  return await quotaGet(key);
}

/** Counts one use. Incrementing in the database avoids two requests racing and losing a count. */
async function bumpCounter(key: string): Promise<number> {
  return await quotaIncrement(key, QUOTA_TTL_SECONDS);
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

        const currentUser = await getCurrentUser();
    let remainingCredits: number | undefined = undefined;
    const ipQuotaCount = await getIpQuotaFromCookie();

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "127.0.0.1";
    const ipKey = IP_QUOTA_KEY(ip);
    const currentIpCount = await safeKvGet(ipKey);
    const effectiveIpCount = Math.max(ipQuotaCount, currentIpCount);

    if (currentUser) {
      // The account's own counter matters as much as the device's: signing in with a second Google
      // account on the same device must not hand out a fresh allowance, and the same account used
      // from a second device must not either. Whichever count is higher is the one that applies.
      const accountCount = currentUser.email
        ? await safeKvGet(GOOGLE_QUOTA_KEY(currentUser.email))
        : 0;
      const effectiveCount = Math.max(effectiveIpCount, accountCount);

      if (currentUser.plan === "free" && currentUser.credits <= 0) {
        return NextResponse.json(
          {
            error: "残りの生成クレジットがありません。有料プランへのご加入、または追加クレジットのご購入をお願いいたします。",
            requiresUpgrade: true,
            remainingCredits: 0,
          },
          { status: 403 }
        );
      }

      // The device cap only guards the free allowance. Someone who has bought credits is past it.
      if (currentUser.plan === "free" && !currentUser.hasPurchased && effectiveCount >= FREE_TOTAL_CREDITS) {
        return NextResponse.json(
          {
            error: "このIPアドレス（端末）からの無料利用枠（合計6回）を超過しました。有料プラン（Proプラン）へのお申し込みが必要です。",
            requiresUpgrade: true,
            remainingCredits: 0,
          },
          { status: 403 }
        );
      }

      // The credit is taken after the image exists, not here. Charging up front meant a generation
      // that timed out or was refused still cost the person a credit, with nothing to show for it --
      // and when the platform kills the request there is no code left running to give it back.
      remainingCredits = currentUser.credits;
    } else {
      if (effectiveIpCount >= FREE_GUEST_CREDITS) {
        return NextResponse.json(
          {
            error: "この端末（IP）からの無料お試しの制限回数（3回）を超過しました。無料会員登録をするとさらにクレジットを獲得できます！",
            requiresAuth: true,
            requiresUpgrade: true,
          },
          { status: 403 }
        );
      }
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

    // Now that there is an image to hand back, record the use: deduct the credit, count it against
    // both the connection and the account, and advance the cookie. Nothing above this point costs
    // the person anything.
    if (currentUser) {
      const { success, remainingCredits: updatedCredits } = await deductUserCredit(currentUser.id);
      if (success) remainingCredits = updatedCredits;
      await bumpCounter(IP_QUOTA_KEY(ip));
      if (currentUser.email) await bumpCounter(GOOGLE_QUOTA_KEY(currentUser.email));
      await incrementIpQuotaCookie();
    } else {
      await bumpCounter(IP_QUOTA_KEY(ip));
      await incrementIpQuotaCookie();
    }

    return NextResponse.json({
      lite: proResult,
      pro: proResult,
      remainingCredits,
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
