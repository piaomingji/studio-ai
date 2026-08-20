import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

// ローカル開発環境での動作確認のために .env.local をロード
try {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envLines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of envLines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] || '';
        // クォーテーションのトリミング
        if (val.length > 0 && val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    }
  }
} catch (e) {
  console.log('Skipped loading .env.local:', e.message);
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY environment variable is not set.');
  process.exit(1);
}

// SEOキーワードとテーマ候補 (Studio AI用 - 証明写真・プロフィール写真)
const topics = [
  {
    keyword: '証明写真 スマホ 自宅 印刷',
    titleHint: '【当日でも間に合う】スマホ自撮りで履歴書の証明写真を作る方法！コンビニ印刷手順とキレイに撮るコツ',
    defaultEyecatch: '/blog/default-id-photo.png'
  },
  {
    keyword: 'パスポート写真 自宅 スマホ 規格',
    titleHint: '【一発合格】スマホ写真でパスポート申請は通る？厳しい規格をクリアする撮影時の注意点',
    defaultEyecatch: '/blog/default-passport.png'
  },
  {
    keyword: 'ビジネスプロフィール写真 自撮り',
    titleHint: '【好印象】自撮り写真からビジネスプロフィール用のスーツ写真を作成する方法！AIツールの上手な活用法',
    defaultEyecatch: '/blog/default-business.png'
  },
  {
    keyword: '就活 履歴書 写真 服装',
    titleHint: '就活・転職活動で好印象を与える証明写真のポイント！服装・表情から最新AIツールの活用まで',
    defaultEyecatch: '/blog/default-jobhunt.png'
  },
  {
    keyword: 'SNS アイコン おしゃれ 自撮り',
    titleHint: 'SNSアイコンをオシャレに！自撮り写真からサロンモデル風・レトロアルバム風に加工する方法',
    defaultEyecatch: '/blog/default-salon.png'
  }
];

const responseSchema = {
  type: 'object',
  properties: {
    slug: { type: 'string' },
    title: { type: 'string' },
    excerpt: { type: 'string' },
    keywords: {
      type: 'array',
      items: { type: 'string' }
    },
    contentHtml: { type: 'string' }
  },
  required: ['slug', 'title', 'excerpt', 'keywords', 'contentHtml']
};

// 既存の記事と重複しない新しいトピックをGeminiで自動生成する関数
async function generateUniqueTopic(existingTitles, existingKeywords) {
  const prompt = `
あなたは写真スタジオの運営者であり、SEOコンサルタントです。
現在、ブログには以下のタイトルおよびテーマの記事がすでに存在します：
${existingTitles.map(t => `- ${t}`).join('\n')}

これらと内容が重複（ダブり）せず、かつ「証明写真」「パスポート写真」「ビジネスプロフィール写真」「就活・転職用履歴書写真」「SNS用アイコン写真」に関連する、ユーザーの検索意図に沿った新しいターゲットSEOキーワードと記事タイトル案を1つ作成してください。

【厳重注意】
- 「ベージュ」「外壁塗装」などの住宅関係のトピックは絶対に作成しないでください。テーマは必ず「人物の顔写真」「証明写真」「プロフィール写真」に関連するものにしてください。
- 以下の既存テーマとは絶対に重複しないようにしてください：
  - スマホでの履歴書用証明写真の作り方やコンビニ印刷
  - パスポート写真の規格クリア方法や自宅撮影
  - ビジネスプロフィール写真の自撮りからの作成方法
  - 就活・転職時の写真撮影の服装や表情マナー
  - SNSアイコンをサロンモデル風・お遊び風に加工する方法

切り口の例：
- 免許証写真の自撮り持ち込み手順と条件
- マイナンバーカード写真の自宅撮影のコツ
- 面接やオーディションで目を引く宣材写真の作り方
- AI証明写真とスピード写真ボックス・写真館との徹底比較
- 私服自撮りからスーツ写真を合成する方法
- 就活写真で好印象を与えるメイクや髪型のコツ

以下のJSONフォーマットに厳密に従って返却してください：
{
  "keyword": "ターゲットとなるSEOキーワード（日本語、スペース区切りで複数可）",
  "titleHint": "記事のタイトル案（日本語、魅力的でクリックしたくなるもの）"
}
`;

  console.log('Generating a completely new, unique topic using Gemini...');
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY, vertexai: false });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          keyword: { type: 'string' },
          titleHint: { type: 'string' }
        },
        required: ['keyword', 'titleHint']
      }
    }
  });

  const generated = JSON.parse(response.text);
  console.log(`Generated Dynamic Topic: [Keyword: ${generated.keyword}] [TitleHint: ${generated.titleHint}]`);
  return generated;
}

async function generateArticle(selectedTopic) {
  const currentYear = new Date().getFullYear();
  const prompt = `
あなたのメインテーマは証明写真、プロフィール写真、人物写真の作成・加工です。
ターゲットキーワード: "${selectedTopic.keyword}" を含み、以下のヒントに沿った高品質なSEO集客ブログ記事を生成してください。
タイトルヒント: "${selectedTopic.titleHint}"

【満たすべき条件】
1. 読者の悩みや疑問を解決する信頼性の高い情報を含め、自然な日本語で執筆してください。タイトルや本文中、要約（excerpt）などで「最新」や年号に言及する場合は、必ず現在の年である「${currentYear}年」を使用し、過去の年（2024年や2025年など）を使用しないでください（例：【${currentYear}年最新】）。
2. 見出し（h2, h3）、太字（<strong>）、順不同リスト（<ul> <li>）などを使って綺麗にマークアップされたHTML本文（contentHtml）にしてください。
3. 記事内で、従来の「街の自動証明写真機（スピード写真ボックス）」との違い・差別化（Studio AIの圧倒的なメリット）を強くアピールしてください。
   - 自宅で自撮り1枚で30秒で完成する手軽さ（外出不要）
   - 写真ボックスのように回数制限がなく、納得いくまで何度も自撮りを試せる点
   - 私服の自撮りでもAIが綺麗なビジネススーツやジャケットに自動着せ替えしてくれる点
   - 写真ボックス（通常800〜1200円）に比べ、圧倒的に低価格（初回無料、コンビニ印刷代の数十円のみ）である点
   【重要】特定の他社サービス名や商標（「キレイ」「Ki-Re-i」など）は絶対に使用せず、一般的な名詞（「街の自動証明写真機」「スピード写真ボックス」など）を使って表現してください。
4. 記事内の後半に、当サービス（Studio AI）のAI証明写真・プロフィール写真作成機能を紹介し、以下のCTAリンクを「必ず」中央寄せで設置してください（HTMLタグに含めてください）：
   <p class="text-center my-8">
     <a href="/?contact=false" class="inline-flex items-center justify-center rounded-full bg-slate-900 px-8 py-4 text-sm font-bold text-white hover:bg-indigo-600 transition-all hover:scale-105 shadow-lg gap-2">
       📸 スマホ写真1枚で今すぐ証明写真を作ってみる
     </a>
   </p>
5. JSON構造に厳密に従ってください。HTML本文内ではダブルクォーテーションを適切にエスケープするか、シングルクォーテーションを使用してください。
`;

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY, vertexai: false });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: responseSchema,
    }
  });

  const textContent = response.text;
  if (!textContent) {
    throw new Error('Empty response from Gemini API');
  }
  return JSON.parse(textContent);
}

// ===================== アイキャッチ画像の生成 =====================
// 2026-08 変更点:
//   旧 imagen-3.0-generate-002 は Google 側で提供終了（後継の imagen-4.0 系も
//   2026-08-17 に提供終了）。そのため毎日の生成が失敗し、記事と無関係な
//   Unsplash 画像や低解像度の代替画像が公開されていた。
//   → Nano Banana 系（gemini-3-pro-image / gemini-3.1-flash-image）に移行し、
//     低品質なフォールバックは全廃した。画像が作れなければ記事も追加しない。
const IMAGE_MODELS = ['gemini-3-pro-image', 'gemini-3.1-flash-image'];
const ATTEMPTS_PER_MODEL = 2;
const MIN_IMAGE_BYTES = 30000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// generateContent 形式のレスポンスから画像バイト列を取り出す
function pickInlineImage(response) {
  const parts = response?.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    const data = part?.inlineData?.data ?? part?.inline_data?.data;
    if (data) return Buffer.from(data, 'base64');
  }
  return null;
}

// interactions 形式のレスポンスから画像バイト列を取り出す
function pickInteractionImage(interaction) {
  const direct = interaction?.output_image?.data ?? interaction?.outputImage?.data;
  if (direct) return Buffer.from(direct, 'base64');
  for (const step of interaction?.steps ?? []) {
    for (const block of step?.content ?? []) {
      const isImage = block?.type === 'image' ||
        (typeof block?.mime_type === 'string' && block.mime_type.startsWith('image/'));
      if (isImage && block?.data) return Buffer.from(block.data, 'base64');
    }
  }
  return null;
}

// 1モデルで1回だけ画像生成を試みる（新旧2つのAPI形式に対応）
async function renderImage(ai, model, prompt) {
  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseModalities: ['IMAGE'],
        imageConfig: { aspectRatio: '16:9', imageSize: '2K' }
      }
    });
    const buffer = pickInlineImage(response);
    if (buffer && buffer.length > MIN_IMAGE_BYTES) return buffer;
    console.log(`  [${model}] generateContent: 画像が返りませんでした`);
  } catch (error) {
    console.log(`  [${model}] generateContent 失敗: ${error.message}`);
  }

  if (typeof ai.interactions?.create === 'function') {
    try {
      const interaction = await ai.interactions.create({
        model,
        input: prompt,
        response_format: {
          type: 'image',
          mime_type: 'image/jpeg',
          aspect_ratio: '16:9',
          image_size: '2K'
        }
      });
      const buffer = pickInteractionImage(interaction);
      if (buffer && buffer.length > MIN_IMAGE_BYTES) return buffer;
      console.log(`  [${model}] interactions: 画像が返りませんでした`);
    } catch (error) {
      console.log(`  [${model}] interactions 失敗: ${error.message}`);
    }
  }

  return null;
}

// ブログ表示用の画像圧縮
// 生成直後の画像は 2752x1536・3MB 前後あり、ブログの読み込みが重くなる。
// 幅1600pxまで縮小し、品質82のJPEGに変換して 300KB 前後まで落とす（見た目はほぼ変わらない）。
// sharp が入っていない環境では圧縮せずそのまま保存する（生成自体は止めない）。
const MAX_IMAGE_WIDTH = 1600;
const JPEG_QUALITY = 82;

async function compressJpeg(buffer) {
  try {
    const sharp = (await import('sharp')).default;
    const output = await sharp(buffer)
      .rotate()
      .resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true, progressive: true })
      .toBuffer();
    if (output.length > 0 && output.length < buffer.length) {
      console.log(`  圧縮: ${Math.round(buffer.length / 1024)}KB -> ${Math.round(output.length / 1024)}KB`);
      return output;
    }
    return buffer;
  } catch (error) {
    console.log(`  警告: 画像を圧縮できませんでした（npm install sharp が必要です）: ${error.message}`);
    return buffer;
  }
}

// pro → flash の順に、各モデル2回ずつ試す。すべて駄目なら例外を投げる（＝記事を追加しない）
async function renderImageWithFallback(ai, prompt) {
  for (const model of IMAGE_MODELS) {
    for (let attempt = 1; attempt <= ATTEMPTS_PER_MODEL; attempt++) {
      console.log(`画像生成を試行中: ${model} (${attempt}/${ATTEMPTS_PER_MODEL})`);
      const buffer = await renderImage(ai, model, prompt);
      if (buffer) {
        console.log(`画像生成に成功しました: ${model} (${Math.round(buffer.length / 1024)}KB)`);
        return compressJpeg(buffer);
      }
      if (attempt < ATTEMPTS_PER_MODEL) await sleep(4000);
    }
  }
  throw new Error(
    'アイキャッチ画像を生成できませんでした。品質の低い代替画像は使用しない方針のため、今回の記事は追加しません。'
  );
}

// 同じような人物の写真ばかり並ばないよう、記事ごとに人物像を変える
// （旧スクリプトは似た雰囲気の女性のストック写真ばかり選んでいた）
const PERSONAS = [
  'a woman in her early 20s with shoulder-length straight black hair',
  'a man in his early 20s with a neat short haircut',
  'a woman in her late 20s with long dark hair worn down',
  'a man in his late 20s with softly textured short hair and glasses',
  'a woman in her early 30s with her hair tied back neatly',
  'a man in his early 30s with a tidy business haircut',
  'a woman in her late 30s with a chin-length bob',
  'a man in his late 30s with short hair and a calm, reliable expression',
  'a woman in her 40s with a short elegant haircut',
  'a man in his 50s with greying hair and a trustworthy, experienced look'
];

function pickPersona(slug) {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = slug.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PERSONAS[Math.abs(hash) % PERSONAS.length];
}

// 記事の内容に沿ったアイキャッチ画像を生成する（必ず Buffer を返す。作れなければ例外）
async function generateImage(title, excerpt, defaultEyecatch, keywords, existingEyecatches, slug) {
  console.log(`Generating matching eyecatch image for slug: ${slug}`);
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY, vertexai: false });
  const persona = pickPersona(slug);
  console.log(`  この記事の人物像: ${persona}`);

  const promptForImagePrompt = `
You are an expert prompt engineer for Google's Gemini image model (Nano Banana).
Write ONE detailed English prompt for a 16:9 blog cover photograph that matches this Japanese article about ID photos, profile photos and portrait photography (証明写真・プロフィール写真).

Article Title: ${title}
Article Excerpt: ${excerpt}
Keywords: ${(keywords || []).join(', ')}

SUBJECT PERSON (important for variety)
The blog already has many cover photos, and they must not all show the same kind of person.
Unless the article clearly requires otherwise, the person in this photo must be: **${persona}**.
Exceptions that override the above:
  - 就活 / 新卒 / 履歴書 -> a job-hunting student in their early 20s
  - 子供 / 赤ちゃん / キッズ -> a child or baby of the age the article discusses
  - 婚活 / マッチングアプリ -> someone in their 20s-30s dressed for a first impression
  - シニア / 遺影 -> an older adult
Describe this person's age, gender, hairstyle and clothing explicitly in the prompt so the
generated face is clearly different from a generic young model.

RULES
1. THE SUBJECT MUST MATCH THE ARTICLE. Read the title carefully:
   - 証明写真 / 履歴書 / パスポート / 免許証 / マイナンバー -> a straight-on head-and-shoulders portrait of a Japanese person in a dark suit, facing the camera, flat even lighting, plain white or pale blue backdrop
   - 背景 / 背景色 / 背景選び -> the SAME portrait composed so the plain studio backdrop itself is the visual subject, with a clean gradient of backdrop colour clearly visible behind the person
   - ビジネスプロフィール / LinkedIn -> a confident corporate headshot in smart business attire, soft directional studio light
   - 就活 / 面接 / 転職 -> a neatly groomed young Japanese person in a recruit suit, calm confident expression
   - SNSアイコン / サロンモデル -> a warm, stylish artistic studio portrait with beautiful hair styling
   - 宣材写真 / オーディション -> a three-quarter length promotional portrait with dramatic but clean lighting
   - 写真スタジオ選び / 写真館 / スピード写真機との比較 -> the interior of a tidy professional photo studio: seamless backdrop, softbox lights, camera on a tripod (a person may or may not appear)
   - 撮り方 / 写り / メイク / 髪型 -> a portrait where the face, hair and makeup are clearly and flatteringly lit
2. Any person shown must be a natural-looking Japanese adult with realistic skin texture, symmetrical undistorted features, correct number of fingers, and neat clothing. No uncanny faces, no warped hands, no melted collars or misaligned eyes.
3. Describe a photorealistic professional studio photograph: name the lighting setup (e.g. "even softbox key light with a fill card", "soft window-lit portrait light"), the lens feel (e.g. "85mm portrait lens, shallow but controlled depth of field"), and demand tack-sharp focus on the eyes.
4. Clean, uncluttered, high-end commercial photography quality.
5. The image must contain NO text, NO Japanese characters, NO letters, NO logos, NO watermarks, NO UI elements, NO frames, and NO collage or split-screen layouts.
6. Output ONLY the prompt text, with no preamble or closing remarks.
`;

  const promptResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: promptForImagePrompt
  });

  const imagePrompt = promptResponse.text.trim();
  console.log(`Generated Image Prompt: ${imagePrompt}`);

  const finalPrompt = `${imagePrompt}

Photorealistic professional studio portrait photography, 16:9 horizontal composition, clean studio backdrop, natural realistic skin texture, tack-sharp focus on the eyes, high-end commercial retouching quality. Absolutely no text, letters, characters, logos or watermarks anywhere in the image, and no collage or split-screen layout.`;

  return renderImageWithFallback(ai, finalPrompt);
}

async function main() {
  try {
    // lib/blog.ts から既存のブログ記事の情報を読み込む
    const filePath = path.join(process.cwd(), 'lib/blog.ts');
    let fileContent = fs.readFileSync(filePath, 'utf-8');

    // 既存の記事タイトル、キーワード、スラッグ、アイキャッチを正規表現で抽出
    const existingTitles = [...fileContent.matchAll(/"title":\s*"([^"]+)"/g)].map(m => m[1]);
    const existingKeywords = [...fileContent.matchAll(/"keywords":\s*\[([\s\S]*?)\]/g)].flatMap(m => {
      return m[1].split(',').map(k => k.trim().replace(/"/g, ''));
    });
    const existingSlugs = [...fileContent.matchAll(/"slug":\s*"([^"]+)"/g)].map(m => m[1]);
    const existingEyecatches = [...fileContent.matchAll(/"eyecatch":\s*"([^"]+)"/g)].map(m => m[1]);

    console.log(`Loaded ${existingSlugs.length} existing articles from lib/blog.ts.`);

    // プリセットトピックからまだ使われていないものを抽出
    const unusedTopics = topics.filter(topic => {
      // タイトルまたは主要な類似表現が既に存在するかチェック
      const isTitleExists = existingTitles.some(title => title.includes(topic.titleHint.slice(0, 8)));
      return !isTitleExists;
    });

    let selectedTopic;
    if (unusedTopics.length > 0) {
      // 未使用のプリセットがあれば、そこからランダムに選択
      selectedTopic = unusedTopics[Math.floor(Math.random() * unusedTopics.length)];
      console.log(`Selected unused preset topic: [Keyword: ${selectedTopic.keyword}]`);
    } else {
      // すべてのプリセットが使用済みの場合は、Geminiで新しいユニークなテーマを生成
      selectedTopic = await generateUniqueTopic(existingTitles, existingKeywords);
    }

    console.log('Generating AI Blog post...');
    const article = await generateArticle(selectedTopic);

    // 既存のスラッグと重複した場合の回避措置
    if (existingSlugs.includes(article.slug)) {
      article.slug = `${article.slug}-${Date.now().toString().slice(-4)}`;
    }
    
    // 画像の生成とローカル保存（生成できなかった場合は例外を投げ、記事を追加せず終了する）
    console.log('Generating matching eyecatch image...');
    const imageBuffer = await generateImage(article.title, article.excerpt, selectedTopic.defaultEyecatch, article.keywords, existingEyecatches, article.slug);
    
    // 出力フォルダ（public/blog）が存在することを確認
    const blogDir = path.join(process.cwd(), 'public/blog');
    if (!fs.existsSync(blogDir)) {
      fs.mkdirSync(blogDir, { recursive: true });
    }

    const imageFilename = `${article.slug}.jpg`;
    const imagePath = path.join(blogDir, imageFilename);
    fs.writeFileSync(imagePath, imageBuffer);
    console.log(`Saved eyecatch image to ${imagePath}`);
    article.eyecatch = `/blog/${imageFilename}`;
    
    // 本日の日付
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
    article.date = today;

    console.log(`Generated article title: ${article.title}`);

    // blogPosts 配列の定義部分を見つける
    const arrayStartMatch = fileContent.match(/export const blogPosts: BlogPost\[\] = \[\s*/);
    
    if (!arrayStartMatch) {
      throw new Error('Could not find blogPosts array in lib/blog.ts');
    }

    const insertIndex = arrayStartMatch.index + arrayStartMatch[0].length;
    
    // 挿入するJSONオブジェクトの生成
    const jsonString = JSON.stringify(article, null, 2);
    
    // 新しい記事を配列の先頭に追加
    const newContent = fileContent.slice(0, insertIndex) + jsonString + ',\n  ' + fileContent.slice(insertIndex);
    
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log('Successfully added new article to lib/blog.ts');
  } catch (error) {
    console.error('Failed to run blog generation:', error);
    process.exit(1);
  }
}

main();
