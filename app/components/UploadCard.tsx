"use client";

import { useEffect, useMemo, useRef, useState, ChangeEvent } from "react";
import {
  BG_COLORS,
  CATEGORIES,
  STYLES,
  getStyle,
  type BgColor,
  type CategoryId,
} from "../lib/styles";
import { PRINT_SIZES, generatePhotoSheet, type PrintSize } from "../lib/photoSheet";
import CompareSlider from "./CompareSlider";

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

interface GenerationResult {
  lite: ModelResult;
  pro: ModelResult;
}

const LOADING_MESSAGES = [
  "スタジオの照明を設定中 💡",
  "ベストなアングルを調整中 📐",
  "衣装をきれいに整え中 👔",
  "カメラマンがシャッターを切っています 📸",
  "ディテールを美しく補正中 ✨",
];

const FUN_STYLE_IDS = STYLES.filter((s) => s.category === "fun").map((s) => s.id);

export default function UploadCard() {
  const [selfieBase64, setSelfieBase64] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [category, setCategory] = useState<CategoryId>("business");
  const [selectedStyleId, setSelectedStyleId] = useState<string>("corporate");
  const [bgColor, setBgColor] = useState<BgColor>("white");
  const [customPrompt, setCustomPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [usedStyleId, setUsedStyleId] = useState<string>("corporate");
  const [printSizeId, setPrintSizeId] = useState<string>(PRINT_SIZES[1].id);
  const [isSheetGenerating, setIsSheetGenerating] = useState(false);

  const [freeCount, setFreeCount] = useState<number>(3);
  const [userPlan, setUserPlan] = useState<string>("free");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with localStorage on mount and listen to changes
  useEffect(() => {
    const syncQuota = () => {
      const plan = localStorage.getItem("studio_ai_user_plan") || "free";
      const rawCount = localStorage.getItem("studio_ai_free_generations");
      let count = 3;
      if (rawCount === null) {
        localStorage.setItem("studio_ai_free_generations", "3");
      } else {
        count = Number(rawCount);
      }
      setUserPlan(plan);
      setFreeCount(count);
    };

    syncQuota();
    window.addEventListener("storage", syncQuota);
    window.addEventListener("studio_ai:plan_updated", syncQuota);
    return () => {
      window.removeEventListener("storage", syncQuota);
      window.removeEventListener("studio_ai:plan_updated", syncQuota);
    };
  }, []);

  // Rotate fun loading messages
  useEffect(() => {
    if (!isLoading) return;
    setLoadingMsgIdx(0);
    const timer = setInterval(() => {
      setLoadingMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [isLoading]);

  const stylesInCategory = useMemo(
    () => STYLES.filter((s) => s.category === category),
    [category]
  );

  const selectedStyle = getStyle(selectedStyleId);
  const usedStyle = getStyle(usedStyleId);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;
    processFile(files[0]);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("画像ファイル（PNG、JPGなど）のみアップロード可能です。");
      setSelfieBase64(null);
      setFileName(null);
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        const img = new window.Image();
        img.src = reader.result;
        img.onload = () => {
          const maxDim = 1200; // 最大長を1200pxに設定
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const resizedBase64 = canvas.toDataURL("image/jpeg", 0.85);
            setSelfieBase64(resizedBase64);
          } else {
            setSelfieBase64(reader.result as string);
          }
        };
      } else {
        setError("ファイルの読み込み中にエラーが発生しました。");
      }
    };
    reader.onerror = () => {
      setError("ファイルの読み込み中にエラーが発生しました。");
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    processFile(files[0]);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelfieBase64(null);
    setFileName(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const selectCategory = (id: CategoryId) => {
    setCategory(id);
    if (id === "custom") {
      setSelectedStyleId("custom");
    } else {
      const first = STYLES.find((s) => s.category === id);
      if (first) setSelectedStyleId(first.id);
    }
  };

  const pickRandomFunStyle = () => {
    const pool = FUN_STYLE_IDS.filter((id) => id !== selectedStyleId);
    const picked = pool[Math.floor(Math.random() * pool.length)] ?? FUN_STYLE_IDS[0];
    setCategory("fun");
    setSelectedStyleId(picked);
  };

  const handleSubmit = async () => {
    if (!selfieBase64) return;
    if (selectedStyleId === "custom" && !customPrompt.trim()) {
      setError("カスタムスタイルの説明を入力してください。（例：宇宙飛行士のスーツを着て天の川を背景に）");
      return;
    }

    const currentPlan = localStorage.getItem("studio_ai_user_plan") || "free";
    const currentCountRaw = localStorage.getItem("studio_ai_free_generations") || "3";
    const currentCount = Number(currentCountRaw);

    if ((currentPlan === "free" || currentPlan === "quota") && currentCount <= 0) {
      setError(currentPlan === "free"
        ? "無料お試しの3回分をすべて使用しました。引き続き生成するには、以下の料金プランをご検討ください。"
        : "所持している生成枠（クレジット）がなくなりました。引き続き生成するには、生成枠を追加購入してください。"
      );
      // Scroll to pricing section smoothly after a short delay
      setTimeout(() => {
        const pricingEl = document.getElementById("pricing");
        pricingEl?.scrollIntoView({ behavior: "smooth" });
      }, 500);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageBase64: selfieBase64,
          styleId: selectedStyleId,
          bgColor,
          customPrompt: selectedStyleId === "custom" ? customPrompt.trim() : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "AIイメージの生成中にエラーが発生しました。");
      }

      // Decrement free count if on free or quota plan
      if (currentPlan === "free" || currentPlan === "quota") {
        const nextCount = Math.max(0, currentCount - 1);
        localStorage.setItem("studio_ai_free_generations", String(nextCount));
        setFreeCount(nextCount);
      }

      setUsedStyleId(selectedStyleId);
      setResult({
        lite: data.lite,
        pro: data.pro,
      });
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "ネットワーク接続エラーが発生したか、サーバーにアクセスできません。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async (imageUrl: string, label: string) => {
    try {
      const blob = await (await fetch(imageUrl)).blob();
      const file = new File([blob], `studio_ai_${usedStyleId}.png`, { type: blob.type });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `Studio AI — ${label}`,
          text: "Studio AIで作成した私のプロフィール写真 📸",
          files: [file],
        });
      } else {
        await navigator.clipboard?.write?.([
          new ClipboardItem({ [blob.type]: blob }),
        ]);
        alert("画像をクリップボードにコピーしました。お好きな場所に貼り付けてください！");
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.error(err);
      alert("このブラウザは共有機能に対応していません。ダウンロードボタンをご利用ください。");
    }
  };

  const handleSheetDownload = async () => {
    if (userPlan === "free") {
      alert("無料プランでは印刷用シートのダウンロードは制限されています。ダウンロードするには、PROまたは法人プランへのご加入をお願いいたします。");
      const element = document.getElementById("pricing");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
      return;
    }
    if (!result) return;
    const best = result.pro.success ? result.pro : result.lite.success ? result.lite : null;
    if (!best) return;
    const size = PRINT_SIZES.find((s) => s.id === printSizeId) ?? PRINT_SIZES[1];

    setIsSheetGenerating(true);
    try {
      const { dataUrl, count } = await generatePhotoSheet(best.imageUrl, size);
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `studio_ai_sheet_${size.id}_${count}cut.png`;
      a.click();
    } catch (err) {
      console.error(err);
      setError("印刷用シートの生成中にエラーが発生しました。");
    } finally {
      setIsSheetGenerating(false);
    }
  };

  const resetForNewStyle = () => {
    setResult(null);
    setError(null);
    // keep the selfie — user just wants a different style
  };

  const resetAll = () => {
    setResult(null);
    setSelfieBase64(null);
    setFileName(null);
    setError(null);
    setCustomPrompt("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ─────────────────────────── 1. Loading State ───────────────────────────
  if (isLoading) {
    return (
      <div className="w-full max-w-xl mx-auto bg-white/90 backdrop-blur-md rounded-2xl border border-slate-100 p-8 shadow-xl shadow-slate-200/50 flex flex-col items-center justify-center min-h-[380px]">
        <div className="relative w-16 h-16 mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
          <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-xl">
            {selectedStyle?.emoji ?? "✨"}
          </div>
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2 transition-all">
          {LOADING_MESSAGES[loadingMsgIdx]}
        </h3>
        <p className="text-slate-400 text-xs text-center max-w-xs leading-relaxed">
          超高画質AIモデルが{" "}
          <span className="font-bold text-indigo-500">
            {selectedStyleId === "custom" ? "カスタムスタイル" : selectedStyle?.label}
          </span>{" "}
          写真を生成しています。約15〜30秒ほどかかります。
        </p>
      </div>
    );
  }

  // ─────────────────────────── 2. Result View ───────────────────────────
  if (result) {
    const bestResult = result.pro.success ? result.pro : result.lite.success ? result.lite : null;
    const usedLabel = usedStyleId === "custom" ? "カスタムスタイル" : usedStyle?.label ?? "ヘッドショット";
    const isPrintable = usedStyle?.printable ?? false;

    return (
      <div className="w-full max-w-xl mx-auto bg-white/95 backdrop-blur-md rounded-3xl border border-slate-100/80 p-6 sm:p-8 md:p-10 shadow-2xl shadow-slate-300/40">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100 mb-3 shadow-sm">
            {usedStyle?.emoji ?? "✨"} {usedLabel} 完成！
          </span>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">AI写真の生成結果</h3>
          <p className="text-xs text-slate-500 mt-1">プロ仕様の超高画質モデル（Gemini 3 Pro）で作成されました</p>
        </div>

        <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-5 flex flex-col items-center shadow-sm mb-8">
          {result.pro.success ? (
            <>
              <div className="relative w-full aspect-[3/4] max-w-[280px] rounded-xl overflow-hidden shadow-md border-2 border-white ring-4 ring-slate-100 mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={result.pro.imageUrl}
                  alt="AIプロフィール結果"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="w-full max-w-[280px] bg-white rounded-xl p-2.5 border border-slate-100 text-center mb-5">
                <p className="text-[10px] text-slate-400 font-bold mb-0.5">⚡ 生成時間</p>
                <p className="text-sm font-black text-slate-800">{result.pro.timeSec}秒</p>
              </div>

              <div className="w-full flex gap-2 max-w-[280px]">
                {userPlan === "free" ? (
                  <button
                    onClick={() => {
                      alert("無料プランでは生成画像のダウンロード制限がかかっています。ダウンロードしてご利用いただくには、PROまたは法人プランへのご加入をお願いいたします。");
                      const element = document.getElementById("pricing");
                      if (element) {
                        element.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                    className="flex-1 text-white text-xs font-bold py-3 px-4 rounded-xl text-center flex items-center justify-center gap-1.5 transition-colors bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/10"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    保存する（要プロ登録）
                  </button>
                ) : (
                  <a
                    href={result.pro.imageUrl}
                    download={`studio_ai_${usedStyleId}.png`}
                    className="flex-1 text-white text-xs font-bold py-3 px-4 rounded-xl text-center flex items-center justify-center gap-1.5 transition-colors bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/10"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    保存する
                  </a>
                )}
                <button
                  onClick={() => result.pro.success && handleShare(result.pro.imageUrl, usedLabel)}
                  className="bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-slate-600 text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  title="共有する"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  共有
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex-grow flex flex-col items-center justify-center p-6 border-2 border-dashed border-rose-100 rounded-xl bg-rose-50/20 text-center min-h-[280px]">
              <svg className="w-10 h-10 text-rose-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h4 className="text-xs font-extrabold text-rose-800 uppercase mb-1">生成エラー</h4>
              <p className="text-[11px] font-bold text-rose-600 px-2 leading-relaxed max-w-xs">
                {result.pro.error}
              </p>
            </div>
          )}
        </div>

        {/* Before / After Slider */}
        {selfieBase64 && bestResult && (
          <div className="mb-8">
            <div className="text-center mb-4">
              <h4 className="text-lg font-extrabold text-slate-900 tracking-tight">
                ビフォー・アフター比較
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">中央のスライダーを左右にドラッグして比較できます</p>
            </div>
            <div className="max-w-[320px] mx-auto">
              <CompareSlider
                beforeSrc={selfieBase64}
                afterSrc={bestResult.imageUrl}
                beforeLabel="元の写真"
                afterLabel={usedLabel}
              />
            </div>
          </div>
        )}

        {/* Print Sheet Generator — only for ID-type styles */}
        {isPrintable && bestResult && (
          <div className="mb-8 bg-gradient-to-br from-slate-50 to-indigo-50/40 rounded-2xl border border-indigo-100/60 p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🖨️</span>
              <h4 className="text-base font-extrabold text-slate-900 tracking-tight">印刷用シートの作成</h4>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              L判（日本の写真用紙標準サイズ 89×127mm）300dpiのシートに規定サイズで自動配置し、カット用のガイド線を入れて作成します。
              ダウンロードしたファイルをコンビニのネットプリントや写真プリント機でそのまま印刷できます。
            </p>
            <div className="flex flex-col sm:flex-row gap-3 items-stretch">
              <div className="flex-1 grid grid-cols-3 gap-2">
                {PRINT_SIZES.map((size: PrintSize) => {
                  const isSelected = printSizeId === size.id;
                  return (
                    <button
                      key={size.id}
                      onClick={() => setPrintSizeId(size.id)}
                      className={`rounded-xl border-2 p-2.5 text-center transition-all ${
                        isSelected
                          ? "border-indigo-600 bg-white text-indigo-700 shadow-sm"
                          : "border-slate-200/80 bg-white/60 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      <span className="block text-[11px] font-extrabold leading-tight">{size.label}</span>
                      <span className="block text-[9px] font-medium mt-0.5 opacity-70">{size.note}</span>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={handleSheetDownload}
                disabled={isSheetGenerating}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white text-xs font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-indigo-600/10 whitespace-nowrap"
              >
                {isSheetGenerating ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    生成中...
                  </span>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    シートをダウンロード
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 flex items-center gap-1.5 text-xs font-bold text-rose-500 bg-rose-50/50 border border-rose-100 p-2.5 rounded-xl">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 border-t border-slate-100 pt-6">
          <button
            onClick={resetForNewStyle}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-8 rounded-xl transition-all duration-200 active:scale-[0.98] text-sm flex items-center justify-center gap-2"
          >
            🎨 同じ写真で別のスタイルを作る
          </button>
          <button
            onClick={resetAll}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-8 rounded-xl transition-all duration-200 active:scale-[0.98] text-sm"
          >
            新しい写真で開始
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────── 3. Form View ───────────────────────────
  return (
    <div className="w-full max-w-xl mx-auto bg-white/90 backdrop-blur-md rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-xl shadow-slate-200/50">
      {/* File Upload Dropzone */}
      <div className="mb-6">
        <label className="block text-sm font-bold text-slate-700 mb-2">写真をアップロード</label>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        <div
          onClick={triggerFileInput}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 min-h-[190px] ${
            isDragging
              ? "border-indigo-600 bg-indigo-50/20"
              : selfieBase64
              ? "border-emerald-200 bg-emerald-50/5"
              : "border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/5"
          }`}
        >
          {selfieBase64 ? (
            <div className="w-full flex flex-col items-center justify-center">
              <div className="relative w-28 h-28 rounded-xl overflow-hidden shadow-md border-2 border-white ring-4 ring-emerald-500/10 mb-3 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selfieBase64}
                  alt="写真のプレビュー"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={handleRemove}
                  className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  title="写真を削除"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <p className="text-xs font-semibold text-slate-500 truncate max-w-xs mb-1">{fileName}</p>
              <button
                onClick={handleRemove}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 underline underline-offset-2"
              >
                別の写真に変更する
              </button>
            </div>
          ) : (
            <div className="text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-bold text-slate-800 mb-1">
                端末から写真をアップロード
              </p>
              <p className="text-xs text-slate-400 mb-2">
                クリックするか、ファイルをドラッグ＆ドロップしてください
              </p>
              <p className="text-[11px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                PNG, JPG形式 (最大 8MB)
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-rose-500 bg-rose-50/50 border border-rose-100 p-2.5 rounded-xl animate-shake">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Category Tabs */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-bold text-slate-700">スタイルを選択</label>
          <button
            onClick={pickRandomFunStyle}
            className="text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-2.5 py-1 rounded-full transition-colors flex items-center gap-1"
            title="コンセプトスタイルからランダムで1つ選択します"
          >
            🎲 ランダムコンセプト
          </button>
        </div>
        <div className="grid grid-cols-4 gap-1.5 bg-slate-100/70 p-1.5 rounded-2xl">
          {CATEGORIES.map((cat) => {
            const isActive = category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => selectCategory(cat.id)}
                className={`rounded-xl py-2 px-1 text-center transition-all ${
                  isActive
                    ? "bg-white text-slate-900 shadow-sm font-extrabold"
                    : "text-slate-500 hover:text-slate-700 font-bold"
                }`}
              >
                <span className="block text-base leading-none mb-1">{cat.emoji}</span>
                <span className="block text-[11px] tracking-tight">{cat.label}</span>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-slate-400 font-medium mt-2 pl-1">
          {CATEGORIES.find((c) => c.id === category)?.description}
        </p>
      </div>

      {/* Style Picker or Custom Prompt */}
      <div className="mb-6">
        {category === "custom" ? (
          <div>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="例）宇宙飛行士のスーツを着て天の川を背景に / ゴッホの油絵風の肖像画 / シャーロック・ホームズ風のヴィンテージ探偵"
              className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/40 p-4 text-sm text-slate-700 placeholder:text-slate-300 focus:border-indigo-500 focus:bg-white focus:outline-none transition-colors resize-none"
            />
            <div className="flex justify-between items-center mt-1.5 px-1">
              <p className="text-[11px] text-slate-400 font-medium">
                顔の特徴を維持したまま、作成したいコンセプトを自由に説明してください
              </p>
              <span className="text-[11px] text-slate-300 font-bold">{customPrompt.length}/500</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2.5">
            {stylesInCategory.map((style) => {
              const isSelected = selectedStyleId === style.id;
              return (
                <div
                  key={style.id}
                  onClick={() => setSelectedStyleId(style.id)}
                  className={`flex flex-col items-center text-center p-3 rounded-2xl cursor-pointer transition-all duration-300 border-2 select-none ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/20 text-indigo-700 font-bold shadow-md shadow-indigo-500/5"
                      : "border-slate-100 bg-slate-50/30 text-slate-600 hover:border-slate-200 hover:bg-slate-50/80"
                  }`}
                >
                  <span className="text-2xl mb-1.5">{style.emoji}</span>
                  <span className="text-xs sm:text-[13px] font-bold tracking-tight mb-0.5 leading-tight">
                    {style.label}
                  </span>
                  <span
                    className={`text-[10px] font-medium leading-tight ${
                      isSelected ? "text-indigo-500/90" : "text-slate-400"
                    }`}
                  >
                    {style.description}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Background Color Picker (ID photos only) */}
      {selectedStyle?.supportsBgColor && (
        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-700 mb-2.5">背景色を選択</label>
          <div className="flex gap-2.5">
            {BG_COLORS.map((bg) => {
              const isSelected = bgColor === bg.id;
              return (
                <button
                  key={bg.id}
                  onClick={() => setBgColor(bg.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all text-xs font-bold ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/30 text-indigo-700"
                      : "border-slate-100 bg-slate-50/30 text-slate-500 hover:border-slate-200"
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full border border-slate-200 shadow-inner"
                    style={{ backgroundColor: bg.swatch }}
                  />
                  {bg.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!selfieBase64}
        className="w-full relative group inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white font-bold text-base py-4 px-6 rounded-2xl transition-all duration-300 shadow-lg shadow-slate-900/10 hover:shadow-xl hover:shadow-indigo-500/15 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none overflow-hidden active:scale-[0.98] disabled:active:scale-100"
      >
        <span className="relative z-10 flex items-center gap-1.5">
          <span>
            {selectedStyle?.emoji ?? "✨"}{" "}
            {selectedStyleId === "custom" ? "カスタムスタイル" : selectedStyle?.label}を作成する
          </span>
          <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </span>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-indigo-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 disabled:hidden" />
      </button>

      {/* Remaining quota display */}
      {userPlan === "free" && (
        <div className="text-center mt-3 text-xs text-slate-400 font-semibold">
          無料お試し枠: 残り <span className="text-indigo-600 font-extrabold">{freeCount}</span> 回
        </div>
      )}
      {userPlan === "quota" && (
        <div className="text-center mt-3 text-xs text-slate-400 font-semibold">
          生成可能枠: 残り <span className="text-indigo-600 font-extrabold">{freeCount}</span> 回
        </div>
      )}
      {userPlan === "pro" && (
        <div className="text-center mt-3 text-xs text-slate-400 font-semibold">
          プラン: <span className="text-indigo-600 font-extrabold">Proプラン（使い放題・1日100回）</span>
        </div>
      )}
      {userPlan === "business" && (
        <div className="text-center mt-3 text-xs text-slate-400 font-semibold">
          プラン: <span className="text-indigo-600 font-extrabold">法人プラン（使い放題・1日500回）</span>
        </div>
      )}
    </div>
  );
}
