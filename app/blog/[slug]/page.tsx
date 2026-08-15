export const dynamic = 'force-dynamic';
export const revalidate = 0;

import Footer from '../../components/Footer';
import { blogPosts } from '../../../lib/blog';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) {
    return {
      title: '記事が見つかりません - Studio AI',
    };
  }

  const siteUrl = 'https://studio-ai-nu-two.vercel.app';
  const imageUrl = post.eyecatch.startsWith('http') 
    ? post.eyecatch 
    : `${siteUrl}${post.eyecatch}`;

  return {
    title: `${post.title} - Studio AI`,
    description: post.excerpt,
    keywords: post.keywords.join(', '),
    openGraph: {
      title: `${post.title} - Studio AI`,
      description: post.excerpt,
      images: [
        {
          url: imageUrl,
          alt: post.title,
        }
      ],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${post.title} - Studio AI`,
      description: post.excerpt,
      images: [imageUrl],
    }
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50">
      {/* Simple Navigation Header */}
      <header className="w-full border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-bold text-slate-900 font-outfit text-lg">Studio AI</span>
          </Link>
          <Link 
            href="/blog" 
            className="text-xs font-bold text-slate-500 hover:text-indigo-600 inline-flex items-center gap-1 transition-colors"
          >
            ブログ一覧
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-16">
          {/* Back button */}
          <div className="mb-8">
            <Link 
              href="/blog" 
              className="text-xs font-bold text-slate-500 hover:text-indigo-600 inline-flex items-center gap-1 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              ブログ一覧へ戻る
            </Link>
          </div>

          <article className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-10 shadow-sm">
            {/* Meta */}
            <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
              <time dateTime={post.date}>{post.date.replace(/-/g, '/')}</time>
              <span>•</span>
              <span className="bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 font-bold text-[10px] text-slate-500">お役立ちコラム</span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-snug mb-8 break-keep">
              {post.title}
            </h1>

            {/* Eyecatch image */}
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 aspect-video mb-10">
              <img 
                src={post.eyecatch} 
                alt={post.title} 
                className="object-cover w-full h-full"
              />
            </div>

            {/* Post Content */}
            <div 
              className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-600 leading-relaxed space-y-6 
                         prose-headings:font-extrabold prose-headings:text-slate-900 prose-headings:tracking-tight
                         prose-h2:text-lg sm:prose-h2:text-xl prose-h2:border-b prose-h2:border-slate-100 prose-h2:pb-3 prose-h2:mt-10
                         prose-h3:text-base sm:prose-h3:text-lg prose-h3:mt-6
                         prose-strong:font-bold prose-strong:text-slate-900
                         prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-2
                         prose-li:marker:text-slate-300"
              dangerouslySetInnerHTML={{ __html: post.contentHtml }} 
            />

            {/* Keywords */}
            <div className="mt-12 pt-6 border-t border-slate-100 flex flex-wrap gap-2">
              {post.keywords.map((keyword, i) => (
                <span 
                  key={i} 
                  className="bg-slate-50 border border-slate-100 px-3 py-1 rounded-full text-[10px] text-slate-500 font-medium"
                >
                  #{keyword}
                </span>
              ))}
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
