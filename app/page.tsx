"use client";

import Image from "next/image";
import UploadCard from "./components/UploadCard";
import { CATEGORIES, STYLES } from "./lib/styles";
import Pricing from "./components/Pricing";
import Footer from "./components/Footer";

export default function Home() {
  const scrollToUpload = () => {
    const element = document.getElementById("upload-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50/40 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden">
      
      {/* Subtle Background Glows */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-[10%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-indigo-200/20 to-purple-200/20 blur-3xl opacity-75" />
        <div className="absolute top-[20%] right-[5%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-rose-100/30 to-amber-100/20 blur-3xl opacity-60" />
        <div className="absolute bottom-[10%] left-[20%] w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-sky-100/30 to-indigo-100/20 blur-3xl opacity-50" />
      </div>

      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-100/80 bg-white/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-10">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-indigo-950 font-outfit">
                Studio AI
              </span>
              <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
            </div>
            {/* Nav links */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
              <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">ご利用方法</a>
              <a href="#showcase" className="hover:text-indigo-600 transition-colors">スタイルギャラリー</a>
              <a href="#pricing" className="hover:text-indigo-600 transition-colors">料金プラン</a>
            </nav>
          </div>
          <div>
            <button
              onClick={scrollToUpload}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition-all duration-200 shadow-md shadow-slate-950/5 active:scale-[0.98]"
            >
              はじめる
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-12 md:pt-32 md:pb-20 px-6 max-w-7xl mx-auto text-center">
        {/* Eyebrow Tag */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100/80 mb-8 animate-fade-in shadow-sm">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          AIフォトスタジオ
        </div>

        {/* Main Japanese Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.15] mb-6 max-w-4xl mx-auto text-balance">
          スマホの写真1枚で、<br className="hidden sm:inline" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600">
            証明写真からコンセプト写真まで
          </span>
        </h1>

        {/* Subheadline (one-line) */}
        <p className="text-base sm:text-lg md:text-xl text-slate-500 max-w-2xl mx-auto font-medium mb-8 leading-relaxed text-balance">
          履歴書用証明写真、パスポート、ビジネスプロフィール、サロンモデル風写真、お好みのカスタムスタイルまで — スタジオ予約不要で30秒で完成
        </p>

        {/* Category chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {CATEGORIES.map((cat) => (
            <span
              key={cat.id}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/80 text-slate-600 border border-slate-200/80 shadow-sm"
            >
              {cat.emoji} {cat.label}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-sm">
            🖨️ 印刷用シート自動作成
          </span>
        </div>

        {/* Primary CTA button */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={scrollToUpload}
            className="group relative inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg px-8 py-4.5 rounded-2xl transition-all duration-300 shadow-xl shadow-slate-950/10 hover:shadow-2xl hover:shadow-indigo-500/20 active:scale-[0.98] overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              AIプロフィールを作成する
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </span>
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-indigo-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
          <span className="text-xs text-slate-400 font-semibold tracking-wide">
            クレジットカード登録不要 · 12種類のスタイル ＋ カスタム · 30秒で高画質生成
          </span>
        </div>
      </section>

      {/* Before-After Showcase Section */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="relative bg-white/60 backdrop-blur-md rounded-3xl border border-slate-100/80 p-6 sm:p-10 md:p-12 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
          {/* Before Card */}
          <div className="w-full md:w-5/12 flex flex-col items-center">
            <div className="relative w-60 h-60 sm:w-68 sm:h-68 rounded-2xl overflow-hidden shadow-md border-4 border-white transform -rotate-2 hover:rotate-0 transition-transform duration-300">
              <Image
                src="/images/selfie_before.png"
                alt="元の写真"
                fill
                sizes="(max-width: 768px) 240px, 272px"
                className="object-cover"
                priority
              />
              <div className="absolute bottom-3 left-3 bg-rose-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                Before: 普段の自撮り
              </div>
            </div>
          </div>

          {/* Connection Indicator */}
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 shadow-md text-indigo-600 animate-bounce">
              <svg className="w-6 h-6 rotate-90 md:rotate-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </div>
            <span className="text-[10px] font-extrabold text-indigo-600 tracking-wider uppercase bg-indigo-50 px-2.5 py-0.5 rounded-full">
              Studio AI
            </span>
          </div>

          {/* After Card */}
          <div className="w-full md:w-5/12 flex flex-col items-center">
            <div className="relative w-60 h-60 sm:w-68 sm:h-68 rounded-2xl overflow-hidden shadow-2xl border-4 border-white transform rotate-2 hover:rotate-0 transition-transform duration-300 ring-4 ring-indigo-500/5">
              <Image
                src="/images/profile_after.png"
                alt="AI生成プロフィール写真"
                fill
                sizes="(max-width: 768px) 240px, 272px"
                className="object-cover"
                priority
              />
              <div className="absolute bottom-3 left-3 bg-indigo-600/95 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                After: AIプロフィール
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Upload & Style Selection Section */}
      <section id="upload-section" className="max-w-5xl mx-auto px-6 pb-24 scroll-mt-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
            AIプロフィールを作成する
          </h2>
          <p className="text-slate-500 text-sm sm:text-base max-w-md mx-auto">
            正面をはっきりと向いている普段の写真（自撮りなど）をアップロードし、証明写真から好みのコンセプトスタイルまで選んでください。
          </p>
        </div>
        <UploadCard />
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-slate-100/40 border-y border-slate-100 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-4 sm:text-4xl">
              ご利用の流れ
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto font-medium">
              スタジオの予約やメイクの準備は不要。わずか3ステップで高解像度写真が完成します。
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="bg-white rounded-2xl border border-slate-100/80 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xl mb-6">
                1
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">写真をアップロード</h3>
              <p className="text-slate-500 leading-relaxed text-sm">
                スマホやパソコンにある、いつもの自然な表情の自撮り写真を1枚選んでアップロードします。
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl border border-slate-100/80 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xl mb-6">
                2
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">スタイルを選択</h3>
              <p className="text-slate-500 leading-relaxed text-sm">
                ビジネス用ヘッドショット、規格に合わせた証明写真・パスポート写真、またはユニークなコンセプト写真から選ぶか、自由にテキストで説明します。
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl border border-slate-100/80 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xl mb-6">
                3
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">すぐに保存＆印刷</h3>
              <p className="text-slate-500 leading-relaxed text-sm">
                超高解像度の結果をすぐに保存できます。証明写真はガイド線付きの印刷用シートで作成され、コンビニ等でそのまま印刷できます。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Style Gallery / Showcase Section */}
      <section id="showcase" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-4 sm:text-4xl">
            12種類のスタイル ＋ カスタム指定
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto font-medium">
            履歴書・パスポートからサロンモデル風、90年代卒業アルバム風まで。作りたい雰囲気をテキスト入力で自由自在に指定することも可能です。
          </p>
        </div>

        {/* Full style lineup */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-w-4xl mx-auto mb-16">
          {STYLES.map((style) => (
            <div
              key={style.id}
              className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md hover:border-indigo-100 hover:-translate-y-0.5 transition-all flex flex-col items-center text-center"
            >
              <span className="text-3xl mb-2">{style.emoji}</span>
              <span className="text-sm font-bold text-slate-800 leading-tight">{style.label}</span>
              <span className="text-[11px] text-slate-400 font-medium mt-1 leading-tight">
                {style.description}
              </span>
            </div>
          ))}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-4 shadow-md flex flex-col items-center justify-center text-center text-white">
            <span className="text-3xl mb-2">✍️</span>
            <span className="text-sm font-bold leading-tight">カスタムスタイル</span>
            <span className="text-[11px] text-indigo-100 font-medium mt-1 leading-tight">
              お好みのコンセプトをテキストで説明
            </span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Woman Showcase Card */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center">
            <div className="relative w-full aspect-square max-w-[280px] rounded-2xl overflow-hidden mb-6 shadow-inner">
              <Image
                src="/images/profile_woman.png"
                alt="女性ビジネスプロフィールスタイル"
                fill
                sizes="(max-width: 768px) 280px, 280px"
                className="object-cover"
              />
            </div>
            <div className="text-center">
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">
                履歴書・ポートフォリオ
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-4">モダン・スマートジャケット</h3>
              <p className="text-slate-500 text-xs mt-1 px-4">
                自然なヘアラインと柔らかいベージュトーンのスタジオ背景に、グレーのジャケットスタイル
              </p>
            </div>
          </div>

          {/* Man Showcase Card */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center">
            <div className="relative w-full aspect-square max-w-[280px] rounded-2xl overflow-hidden mb-6 shadow-inner">
              <Image
                src="/images/profile_after.png"
                alt="男性ビジネスプロフィールスタイル"
                fill
                sizes="(max-width: 768px) 280px, 280px"
                className="object-cover"
              />
            </div>
            <div className="text-center">
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
                LinkedIn・社内プロフィール
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-4">クラシック・コーポレート</h3>
              <p className="text-slate-500 text-xs mt-1 px-4">
                信頼感を与えるすっきりとしたスーツスタイルと、端正なフィッティングの王道
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <Pricing />

      {/* Bottom CTA Section */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <div className="relative bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 md:p-16 text-center shadow-2xl overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500 rounded-full blur-[80px] opacity-35" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500 rounded-full blur-[80px] opacity-35" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4 text-balance">
              今すぐ自分だけのAIプロフィールを作成しましょう
            </h2>
            <p className="text-indigo-200 text-sm md:text-base mb-8 leading-relaxed max-w-lg mx-auto text-balance">
              スタジオの予約費用や待ち時間なし。証明写真、ヘッドショット、コンセプト写真をアップロードするだけで今すぐ作成できます。
            </p>
            <button
              onClick={scrollToUpload}
              className="group relative inline-flex items-center justify-center bg-white hover:bg-slate-50 text-slate-900 font-bold text-lg px-8 py-4 rounded-2xl transition-all duration-200 active:scale-[0.98] shadow-lg shadow-white/5 hover:shadow-xl hover:shadow-white/10"
            >
              AIプロフィールを作成する
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

    </div>
  );
}
