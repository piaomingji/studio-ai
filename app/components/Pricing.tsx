'use client';

import { useState } from 'react';
import Reveal from './Reveal';

type PlanCardProps = {
  title: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  buttonText: string;
  isPopular?: boolean;
  onClick: () => void;
  isLoading?: boolean;
};

function PlanCard({
  title,
  price,
  period,
  description,
  features,
  buttonText,
  isPopular,
  onClick,
  isLoading,
}: PlanCardProps) {
  return (
    <div
      className={`w-full relative flex flex-col rounded-3xl border p-6 sm:p-8 transition-all duration-300 ${
        isPopular
          ? 'border-indigo-600 bg-white shadow-xl lg:scale-105 lg:z-10'
          : 'border-slate-200 bg-white hover:border-indigo-200 lg:hover:-translate-y-1'
      }`}
    >
      {isPopular && (
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white">
          一番人気
        </span>
      )}
      <div className="mb-6 text-center">
        <h3 className="text-xl font-extrabold text-slate-900">{title}</h3>
        <p className="mt-2 text-xs text-slate-500 min-h-[32px]">{description}</p>
        <div className="mt-5 flex items-baseline justify-center gap-1 text-slate-900">
          <span className="text-3xl font-black tracking-tight">{price}</span>
          {period && <span className="text-xs text-slate-400"> / {period}</span>}
        </div>
      </div>

      <ul className="mb-8 flex flex-col gap-3.5 border-t border-slate-100 pt-6 text-xs text-slate-600 items-start pl-4 sm:pl-8">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-center gap-2.5">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              className="text-indigo-600 flex-shrink-0"
            >
              <path
                d="M5 13l4 4L19 7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onClick}
        disabled={isLoading}
        className={`mt-auto cursor-pointer rounded-full py-3.5 text-xs font-bold transition-all duration-200 active:scale-95 ${
          isPopular
            ? 'bg-slate-900 text-white hover:bg-indigo-600 shadow-md shadow-slate-900/10'
            : 'border border-slate-300 bg-slate-50 text-slate-700 hover:border-slate-900'
        } ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        {isLoading ? '処理中...' : buttonText}
      </button>
    </div>
  );
}

export default function Pricing() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCheckout = async (planId: 'quota' | 'pro' | 'business') => {
    setLoadingPlan(planId);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'omit',
        body: JSON.stringify({ planId }),
      });

      const data = await res.json();
      if (!res.ok) {
        let errMsg = '決済URLの取得に失敗しました。';
        if (data && data.error) {
          if (typeof data.error === 'string') {
            errMsg = data.error;
          } else if (typeof data.error === 'object') {
            errMsg = data.error.message || JSON.stringify(data.error);
          }
        }
        throw new Error(errMsg);
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('決済URLの返却がありませんでした。');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || '接続エラーが発生しました。再度お試しください。');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <section id="pricing" className="py-20 px-6 max-w-7xl mx-auto scroll-mt-20">
      <div className="text-center mb-16">
        <Reveal>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100/80 mb-3 shadow-sm">
            料金プラン
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
            ご利用に合わせた柔軟なプラン
          </h2>
          <p className="mt-4 text-slate-500 max-w-xl mx-auto font-medium">
            最初の3回は無料でお試しいただけます。追加の生成枠パックや、生成し放題の月額サブスクプランをご用意しています。
          </p>
        </Reveal>

        {errorMsg && (
          <Reveal>
            <div className="mx-auto mt-6 max-w-md rounded-2xl border border-rose-100 bg-rose-50/50 p-3 text-xs font-semibold text-rose-600">
              ⚠️ {errorMsg}
            </div>
          </Reveal>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
        <Reveal delay={100}>
          <PlanCard
            title="追加20回パック"
            price="¥1,480"
            description="必要な分だけ都度追加できる、使い切りの追加生成枠パックです"
            features={[
              '追加で20枚の画像生成',
              '有効期限なし・使い切り',
              'すべてのスタイルを利用可能',
              '高画質Proモデルの出力対応',
            ]}
            buttonText="生成枠を追加する"
            onClick={() => handleCheckout('quota')}
            isLoading={loadingPlan === 'quota'}
          />
        </Reveal>

        <Reveal delay={200}>
          <PlanCard
            title="Proプラン"
            price="¥4,980"
            period="月額"
            description="個人利用で1日100回まで、すべてのスタイルをたっぷり生成できるプランです"
            features={[
              '1日最大100回まで生成可能（毎日リセット）',
              '優先的に高速AI処理',
              'すべてのスタイルとカスタム機能が使い放題',
              'L判印刷用シートのダウンロード可能',
            ]}
            buttonText="Proプランに登録する"
            isPopular
            onClick={() => handleCheckout('pro')}
            isLoading={loadingPlan === 'pro'}
          />
        </Reveal>

        <Reveal delay={300}>
          <PlanCard
            title="法人プラン"
            price="¥19,800"
            period="月額"
            description="社内メンバーとアカウントを共有し、チームで使えるお得なプランです"
            features={[
              '最大5名様まで同時共有・ご利用可能',
              'チーム全体の生成上限：500回/日',
              'ビジネス用ヘッドショット・証明写真に最適',
              '領収書・請求書対応',
            ]}
            buttonText="法人プランに登録する"
            onClick={() => handleCheckout('business')}
            isLoading={loadingPlan === 'business'}
          />
        </Reveal>
      </div>
    </section>
  );
}
