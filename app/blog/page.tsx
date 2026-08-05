import Footer from '../components/Footer';
import { blogPosts } from '../../lib/blog';
import Link from 'next/link';

export const metadata = {
  title: '証明写真・プロフィール写真お役立ちブログ - Studio AI',
  description: 'スマホ写真1枚でキレイな証明写真やプロフィール写真を作るコツ、パスポート規格の対応方法などのお役立ち情報を発信します。',
};

export default function BlogListPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50">
      {/* Simple Navigation Header */}
      <header className="w-full border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-bold text-slate-900 font-outfit text-lg">Studio AI</span>
          </Link>
          <Link 
            href="/" 
            className="text-xs font-bold text-slate-500 hover:text-indigo-600 inline-flex items-center gap-1 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            ホームへ戻る
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 break-keep">
              証明写真・プロフィール写真お役立ちブログ
            </h1>
            <p className="mt-4 text-sm text-slate-500 font-medium break-keep">
              スマホ自撮りで綺麗かつ規定を満たした証明写真を作るためのテクニックや、印象の良いビジネスプロフィール写真を作成するコツをお届けします。
            </p>
          </div>

          {blogPosts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
              </div>
              <h3 className="text-sm font-bold text-slate-700">準備中</h3>
              <p className="text-xs text-slate-400 mt-1">現在、新しいお役立ち記事を準備しています。公開までしばらくお待ちください。</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
              {blogPosts.map((post) => (
                <article 
                  key={post.slug}
                  className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col"
                >
                  <Link href={`/blog/${post.slug}`} className="block overflow-hidden aspect-video relative bg-slate-100">
                    <img 
                      src={post.eyecatch} 
                      alt={post.title} 
                      className="object-cover w-full h-full hover:scale-105 transition-transform duration-500"
                    />
                  </Link>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                      <time dateTime={post.date}>{post.date.replace(/-/g, '/')}</time>
                      <span>•</span>
                      <span className="bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 font-bold text-[10px] text-slate-500">お役立ちコラム</span>
                    </div>
                    <h2 className="text-base font-bold text-slate-900 mb-3 leading-snug hover:text-indigo-600 transition-colors">
                      <Link href={`/blog/${post.slug}`}>
                        {post.title}
                      </Link>
                    </h2>
                    <p className="text-xs text-slate-500 leading-relaxed mb-6 flex-1">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                      <div className="flex flex-wrap gap-1">
                        {post.keywords.slice(0, 2).map((keyword, i) => (
                          <span key={i} className="text-[10px] text-slate-400">
                            #{keyword}
                          </span>
                        ))}
                      </div>
                      <Link 
                        href={`/blog/${post.slug}`} 
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1"
                      >
                        続きを読む
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                          <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
