/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Reveal from '@/app/components/Reveal';

function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [planName, setPlanName] = useState('');

  useEffect(() => {
    const plan = searchParams.get('plan');

    // ローカルストレージの状態を更新
    const currentFreeGenerationsRaw = localStorage.getItem('studio_ai_free_generations') || '3';
    const currentFreeGenerations = Number(currentFreeGenerationsRaw);

    if (plan === 'pro') {
      localStorage.setItem('studio_ai_user_plan', 'pro');
      setPlanName('Proプラン (月額サブスクリプション・使い放題)');
    } else if (plan === 'business') {
      localStorage.setItem('studio_ai_user_plan', 'business');
      setPlanName('法人プラン (月額サブスクリプション・最大5名同時利用可)');
    } else if (plan === 'quota') {
      localStorage.setItem('studio_ai_user_plan', 'quota');
      // 20回分を追加
      const newQuota = currentFreeGenerations + 20;
      localStorage.setItem('studio_ai_free_generations', String(newQuota));
      setPlanName('生成枠 20回追加パック (適用完了)');
      
      // カスタムイベントを発火してHeader等と同期させる
      window.dispatchEvent(new Event('storage'));
    } else {
      setPlanName('決済の同期中...');
    }

    // 変更をグローバル通知
    window.dispatchEvent(new Event('studio_ai:plan_updated'));
    setLoading(false);
  }, [searchParams]);

  return (
    <div className="mx-auto max-w-md bg-white border border-slate-100 rounded-3xl p-8 md:p-10 shadow-xl shadow-slate-200/50 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 mb-6">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <h1 className="text-2xl font-black text-slate-900 tracking-tight">
        ご購入ありがとうございます！
      </h1>

      <p className="mt-3 text-sm text-slate-500 leading-relaxed font-medium">
        決済手続きが正常に完了いたしました。アカウントにプランが即座に反映されました。
      </p>

      {!loading && (
        <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-100 p-4 text-xs font-bold text-indigo-700">
          選択されたプラン: {planName}
        </div>
      )}

      <button
        onClick={() => {
          router.replace('/');
          // ストレージ再読み込みを促す
          window.location.href = '/#upload-section';
        }}
        className="mt-8 w-full cursor-pointer rounded-full bg-slate-900 py-4 text-sm font-bold text-white shadow-lg shadow-slate-950/10 hover:bg-indigo-600 active:scale-95 transition-all duration-200"
      >
        スタジオに戻って作成する
      </button>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-slate-50/40 px-6 py-12">
      {/* 背景のグロー効果 */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[840px] -translate-x-1/2 rounded-full bg-indigo-100/30 opacity-40 blur-3xl"
      />
      
      <Reveal>
        <Suspense fallback={
          <div className="text-center font-semibold text-slate-500">
            読み込み中...
          </div>
        }>
          <CheckoutSuccessContent />
        </Suspense>
      </Reveal>
    </main>
  );
}
