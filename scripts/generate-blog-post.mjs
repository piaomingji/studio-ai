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

// 記事の内容に沿ったアイキャッチ画像を生成する関数 (gemini-3.1-flash-image)
async function generateImage(title, excerpt, defaultEyecatch, keywords, existingEyecatches, slug) {
  const promptForImagePrompt = `
You are an expert prompt engineer for AI image generators.
Create a highly detailed, descriptive English prompt for generating a blog cover image that perfectly matches the following article:

Article Title: ${title}
Article Excerpt: ${excerpt}

MANDATORY REQUIREMENTS FOR HIGH-CTR CLICK-WORTHY IMAGES:
1. MUST be photorealistic, ultra-high quality, 8k resolution studio portrait photography of an attractive Japanese person.
2. Must feature warm, inviting studio lighting, sharp focus, clean background, and elegant aesthetic.
3. NO uncanny artifacts, NO text, NO empty distorted scenes.
1. Describe a realistic, high-quality, professional studio portrait photograph of an Asian person (either man or woman in neat clothing).
2. The image MUST visually represent the theme of the article. For example:
   - If the article is about "formal ID photo" or "passport", describe a professional head-and-shoulders portrait of an Asian person in a clean dark suit, facing directly forward, with flat studio lighting and a plain white or light blue backdrop.
   - If the article is about "business profile" or "LinkedIn", describe a confident, friendly corporate headshot of an Asian professional (man or woman) in smart-casual business attire with soft studio lighting.
   - If the article is about "SNS icons" or "salon model", describe an artistic, warm-lit studio portrait with beautiful hair styling and modern aesthetic.
3. Specify realistic lighting (e.g., "even studio lighting", "soft studio portrait lighting") and high-end camera details (e.g., "sharp focus, professional portrait photography, detailed hair and skin textures, 8k resolution").
4. Do NOT include any text, overlays, UI elements, signs, or borders in the image.
5. The prompt must be in English and output ONLY the prompt text, without any introductory or concluding remarks.
`;

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY, vertexai: false });
    const promptResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptForImagePrompt
    });

    const imagePrompt = promptResponse.text.trim();
    console.log(`Generated Image Prompt: ${imagePrompt}`);

    console.log('Attempting to generate image via gemini-3.1-flash-image...');
    // gemini-3.1-flash-image で画像を生成
    const imageResponse = await ai.interactions.create({
      model: 'gemini-3.1-flash-image',
      input: [
        { type: 'text', text: `${imagePrompt}, professional studio portrait photography, beautiful clean backdrop, highly detailed, blog header banner` }
      ],
      response_format: {
        type: 'image',
        aspect_ratio: '16:9',
        image_size: '2K'
      }
    });

    if (imageResponse.output_image && imageResponse.output_image.data) {
      const base64Image = imageResponse.output_image.data;
      return { type: 'buffer', data: Buffer.from(base64Image, 'base64') };
    }
    throw new Error('Image data not found in response');
  } catch (error) {
    console.log('Gemini Image generation failed. Falling back to specific image...', error.message);
    
    // プリセットのデフォルト画像が指定されており、まだ使われていない場合はそれを使用
    if (defaultEyecatch && !existingEyecatches.includes(defaultEyecatch)) {
      console.log(`Using default preset eyecatch: ${defaultEyecatch}`);
      return { type: 'url', data: defaultEyecatch };
    }

    // 静的なフォールバック画像リスト（他で使用済みのURLは排除する - 美しいスタジオポートレート、メイクアップ、ビフォーアフター、スタジオ設備）
    const photoIds = [
      // K-Pop / Classic Portrait Portraits (60)
      'photo-1507003211169-0a1dd7228f2d', 'photo-1494790108377-be9c29b29330', 'photo-1534528741775-53994a69daeb', 'photo-1500648767791-00dcc994a43e',
      'photo-1544005313-94ddf0286df2', 'photo-1506794778202-cad84cf45f1d', 'photo-1517841905240-472988babdf9', 'photo-1539571696357-5a69c17a67c6',
      'photo-1524504388940-b1c1722653e1', 'photo-1488426862026-3ee34a7d66df', 'photo-1508214751196-bcfd4ca60f91', 'photo-1519085360753-af0119f7cbe7',
      'photo-1492562080023-ab3db95bfbce', 'photo-1547425260-76bcadfb4f2c', 'photo-1501196354995-cbb51c65aaea', 'photo-1573496359142-b8d87734a5a2',
      'photo-1580489944761-15a19d654956', 'photo-1509783236416-c9ad59bab472', 'photo-1519345182560-3f2917c472ef', 'photo-1438761681033-6461ffad8d80',
      'photo-1485893086445-ed75865251e0', 'photo-1500048993953-d23a436266cf', 'photo-1519052537078-e6302a4968d4', 'photo-1531746020798-e6953c6e8e04',
      'photo-1554151228-14d9def656e4', 'photo-1567532939604-b6b5b0db2604', 'photo-1580489944761-15a19d654956', 'photo-1504257406236-90dd59b30b54',
      'photo-1531123897727-8f129e1688ce', 'photo-1506863530036-1efeddceb993', 'photo-1521119989659-a83eee488004', 'photo-1548142813-c348350df52b',
      'photo-1552058544-f2b08422138a', 'photo-1560250097-0b93528c311a', 'photo-1566492031773-4f4e44671857', 'photo-1570295999919-56ceb5ecca61',
      'photo-1573497019940-1c28c88b4f3e', 'photo-1589571894960-20bbe2828d02', 'photo-1607746882042-944635dfe10e', 'photo-1614644147724-2d4785d69962',
      'photo-1619380061814-58f03707f082', 'photo-1628157582853-a796fa650a6a', 'photo-1522075469751-3a6694fb2f61', 'photo-1534308983496-4fabb1a015ee',
      'photo-1542909168-82c3e7fdca5c', 'photo-1558203728-00f45181dd84', 'photo-1581092921461-eab62e97a780', 'photo-1584999734482-0361aecad10e',
      'photo-1589156280159-27698a70f29e', 'photo-1599566150163-29194dcaad36', 'photo-1601412436009-d964bd02edbc', 'photo-1613145400657-3f95f48ad313',
      'photo-1618077360395-f3068be8e001', 'photo-1618151313441-bc797fd88350', 'photo-1624561172888-ac93c696e10c', 'photo-1628890923662-2cb23c225a95',
      'photo-1543130006-aa9b02047806', 'photo-1552374196-1ab2a1c593e8', 'photo-1595152772835-219674b2a8a6', 'photo-1584999734482-0361aecad10e',
      // Studio Scenes & Camera/Lighting setups (20)
      'photo-1542038784456-1ea8e935640e', 'photo-1516035069371-29a1b244cc32', 'photo-1453060113865-968ce150c724', 'photo-1603566723801-4993ef933054',
      'photo-1520390138845-12522961e241', 'photo-1502444330042-d1a1ddf9b082', 'photo-1590602847861-f357a9332bbc', 'photo-1526374965328-7f61d4dc18c5',
      'photo-1616469829581-73993eb86b02', 'photo-1495707902641-75cac588d2e9', 'photo-1621252179027-94459d278660', 'photo-1615247001958-f4bc92fa6a4a',
      'photo-1492691527719-9d1e07e534b4', 'photo-1511556532299-8f662fc26c06', 'photo-1519751138087-5bf79df62d5b', 'photo-1560066984-138dadb4c035',
      'photo-1595853035070-5f29917d2abd', 'photo-1606761568288-402b5e7d229f', 'photo-1607604276583-eef5d076aa5f', 'photo-1616440347437-b1c73416efc2',
      // Before-After / Makeovers / Beauty / Hair Salons (20)
      'photo-1522337360788-8b13dee7a37e', 'photo-1487412720507-e7ab37603c6f', 'photo-1512496015851-a90fb38ba796', 'photo-1596462502278-27bfdc403348',
      'photo-1607604276583-eef5d076aa5f', 'photo-1562322140-8baeececf3df', 'photo-1527799881374-de5a91d186b5', 'photo-1616683693504-3ea7e9ad6fec',
      'photo-1515688594390-b649af70d282', 'photo-1522337094846-8a818192de2f', 'photo-1560066984-138dadb4c035', 'photo-1595425970377-c9703cf48b6d',
      'photo-1600948836101-f9ffda59d250', 'photo-1600334129128-685c5582fd35', 'photo-1605497746444-ac9db450f776', 'photo-1616683693504-3ea7e9ad6fec',
      'photo-1620331311520-246422fd82f9', 'photo-1621574539437-4b7cb63120b8', 'photo-1626015276510-290f6158090d', 'photo-1632345031435-8797b2d58045'
    ];

    const fallbackImages = photoIds.map(id => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`);

    // 未使用の画像のみにフィルタリング
    const unusedFallbackImages = fallbackImages.filter(img => !existingEyecatches.includes(img));
    
    if (unusedFallbackImages.length > 0) {
      const selectedUrl = unusedFallbackImages[Math.floor(Math.random() * unusedFallbackImages.length)];
      console.log(`Using unused fallback Unsplash image URL: ${selectedUrl}`);
      return { type: 'url', data: selectedUrl };
    } else {
      // すべて使用済みの場合は、slugのハッシュ値に基づいて決定論的にプールから選択し、リンク切れを回避
      let hash = 0;
      for (let i = 0; i < slug.length; i++) {
        hash = slug.charCodeAt(i) + ((hash << 5) - hash);
      }
      const index = Math.abs(hash) % fallbackImages.length;
      const selectedUrl = fallbackImages[index];
      console.log(`All fallback images used. Selecting deterministic image from pool: ${selectedUrl}`);
      return { type: 'url', data: selectedUrl };
    }
  }
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
    
    // 画像の自動生成
    console.log('Generating matching eyecatch image...');
    const resultImage = await generateImage(article.title, article.excerpt, selectedTopic.defaultEyecatch, article.keywords, existingEyecatches, article.slug);
    
    // 出力フォルダ（public/blog）が存在することを確認
    const blogDir = path.join(process.cwd(), 'public/blog');
    if (!fs.existsSync(blogDir)) {
      fs.mkdirSync(blogDir, { recursive: true });
    }

    if (resultImage.type === 'buffer') {
      const imageFilename = `${article.slug}.jpg`;
      const imagePath = path.join(blogDir, imageFilename);
      fs.writeFileSync(imagePath, resultImage.data);
      console.log();
      try {
        const pyCmd = ;
        execSync(pyCmd, { stdio: 'ignore' });
        console.log();
      } catch (err) {
        console.warn();
      }
      article.eyecatch = `/blog/${imageFilename}`;
    } else {
      console.log(`Using fallback Unsplash image URL: ${resultImage.data}`);
      article.eyecatch = resultImage.data;
    }
    
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
