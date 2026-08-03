export type CategoryId = "business" | "id" | "fun" | "custom";

export interface StyleCategory {
  id: CategoryId;
  label: string;
  emoji: string;
  description: string;
}

export interface StyleDef {
  id: string;
  category: CategoryId;
  label: string;
  description: string;
  emoji: string;
  /** English edit instruction sent to the image model */
  prompt: string;
  /** Overrides the default identity-preservation suffix (e.g. cartoon styles) */
  identityNote?: string;
  /** Styles that support background color selection (ID photos) */
  supportsBgColor?: boolean;
  /** Styles whose results make sense on a print sheet */
  printable?: boolean;
}

export const CATEGORIES: StyleCategory[] = [
  {
    id: "business",
    label: "ビジネス",
    emoji: "💼",
    description: "履歴書・LinkedIn・社内プロフィール用ヘッドショット",
  },
  {
    id: "id",
    label: "証明写真・パスポート",
    emoji: "🪪",
    description: "各種サイズに合わせた証明写真とパスポート写真",
  },
  {
    id: "fun",
    label: "コンセプト・お遊び",
    emoji: "🎨",
    description: "SNSで映えるユニークなコンセプト写真",
  },
  {
    id: "custom",
    label: "カスタム",
    emoji: "✍️",
    description: "作りたいスタイルを直接テキストで指定",
  },
];

export type BgColor = "white" | "blue" | "gray";

export const BG_COLORS: { id: BgColor; label: string; swatch: string; prompt: string }[] = [
  { id: "white", label: "ホワイト", swatch: "#ffffff", prompt: "plain pure white background" },
  { id: "blue", label: "ライトブルー", swatch: "#cfe4f7", prompt: "solid soft light blue studio background" },
  { id: "gray", label: "ライトグレー", swatch: "#e5e7eb", prompt: "solid light gray studio background" },
];

export const STYLES: StyleDef[] = [
  // ───────── ビジネス ─────────
  {
    id: "corporate",
    category: "business",
    label: "ビジネススーツ",
    description: "端正なスーツとワイシャツ姿",
    emoji: "👔",
    prompt:
      "Convert the clothing to a clean, professional dark blue business blazer with a white collar shirt and a necktie. Solid light gray background.",
  },
  {
    id: "studio",
    category: "business",
    label: "スタジオ撮影",
    description: "人物を引き立てる本格スタジオ照明",
    emoji: "📸",
    prompt:
      "Apply soft, flattering studio portrait lighting. Clean professional indoor studio backdrop.",
  },
  {
    id: "outdoor",
    category: "business",
    label: "屋外自然光",
    description: "爽やかで立体感のある自然光",
    emoji: "🌤️",
    prompt:
      "Apply bright, natural outdoor sunlight lighting with soft bokeh background representing a high-end corporate campus or clean park.",
  },
  // ───────── 証明写真・パスポート ─────────
  {
    id: "id_photo",
    category: "id",
    label: "履歴書用証明写真",
    description: "スーツ着用・標準フレーミング",
    emoji: "🪪",
    supportsBgColor: true,
    printable: true,
    prompt:
      "Convert into a formal Japanese ID photo: head-and-shoulders framing centered in the frame, facing directly forward at the camera, calm confident expression with a slight natural smile, neat dark suit jacket over a crisp white dress shirt, tidy hair away from the face, perfectly even flat studio lighting with no shadows on the face or background.",
  },
  {
    id: "passport",
    category: "id",
    label: "パスポート・ビザ写真",
    description: "国際基準に準拠した白背景",
    emoji: "🛂",
    printable: true,
    prompt:
      "Convert into a passport-compliant photo: face directly forward at the camera, neutral expression with mouth closed, both eyes open and clearly visible, ears visible where possible, hair tidy and off the face, absolutely even lighting with zero shadows on the face or background, plain pure white background, head centered and occupying the standard passport proportion of the frame.",
  },
  {
    id: "student",
    category: "id",
    label: "社員証・学生証",
    description: "明るく清潔感のあるカジュアルスタイル",
    emoji: "🎓",
    supportsBgColor: true,
    printable: true,
    prompt:
      "Convert into a bright, friendly ID badge photo: head-and-shoulders framing facing forward, warm natural smile, smart-casual outfit (neat collared shirt or clean knitwear), soft even studio lighting.",
  },
  // ───────── コンセプト・お遊び ─────────
  {
    id: "yearbook",
    category: "fun",
    label: "90年代風卒業アルバム",
    description: "レトロなアメリカのハイスクール感性",
    emoji: "📒",
    prompt:
      "Transform into a nostalgic 1990s American high school yearbook portrait: retro hairstyle, vintage 90s outfit, the classic blue-gray laser beam studio backdrop, soft focus and subtle film grain.",
  },
  {
    id: "idol",
    category: "fun",
    label: "サロンモデル風",
    description: "ヘアサロンやSNSで映える透明感ヘアスタイル",
    emoji: "🌟",
    prompt:
      "Transform into a Japanese salon model portrait: natural glowing skin, beautiful glossy hair with soft details, cozy warm indoor studio or cafe lighting, clean aesthetic background, professional styling.",
  },
  {
    id: "kdrama",
    category: "fun",
    label: "映画の主役風ポスター",
    description: "シネマティックな映画のポスター風カット",
    emoji: "🎬",
    prompt:
      "Transform into a cinematic movie poster portrait: dramatic moody lighting, nostalgic and artistic atmosphere, shallow depth of field, professional film color grading, elegant styling worthy of a movie lead role.",
  },
  {
    id: "magazine",
    category: "fun",
    label: "ファッション誌カバー",
    description: "ハイファッション誌のグラビア風",
    emoji: "🖤",
    prompt:
      "Transform into a high-fashion magazine cover portrait: bold editorial studio lighting, designer outfit, confident powerful expression, clean minimal backdrop, Vogue-style composition.",
  },
  {
    id: "noir",
    category: "fun",
    label: "モノクロアート写真",
    description: "フィルムの深みのある白黒写真",
    emoji: "🎞️",
    prompt:
      "Transform into a black-and-white fine-art studio portrait: dramatic Rembrandt lighting, deep rich shadows, timeless monochrome film look, artistic and emotional.",
  },
  {
    id: "cartoon",
    category: "fun",
    label: "3Dアニメ風キャラクター",
    description: "アニメーション映画の主人公のように",
    emoji: "🧸",
    identityNote:
      "Keep a strong, instantly recognizable resemblance to the person's face and features.",
    prompt:
      "Transform into a charming 3D animated movie character portrait in the style of a modern animation studio: big expressive eyes, soft global illumination, stylized but adorable look.",
  },
];

export const DEFAULT_IDENTITY_NOTE =
  "Preserve the person's exact face, identity and features completely unchanged. Photorealistic professional quality.";

export function getStyle(id: string): StyleDef | undefined {
  return STYLES.find((s) => s.id === id);
}

/** Build the final English prompt sent to the model. */
export function buildPrompt(opts: {
  styleId: string;
  bgColor?: BgColor;
  customPrompt?: string;
}): string {
  const { styleId, bgColor, customPrompt } = opts;

  if (styleId === "custom" && customPrompt) {
    return `Edit this portrait photo as follows: ${customPrompt.trim()}. ${DEFAULT_IDENTITY_NOTE}`;
  }

  const style = getStyle(styleId);
  if (!style) {
    return `Professional business headshot. ${DEFAULT_IDENTITY_NOTE}`;
  }

  let prompt = style.prompt;
  if (style.supportsBgColor) {
    const bg = BG_COLORS.find((b) => b.id === (bgColor ?? "white")) ?? BG_COLORS[0];
    prompt += ` Background: ${bg.prompt}.`;
  }
  return `${prompt} ${style.identityNote ?? DEFAULT_IDENTITY_NOTE}`;
}
