/**
 * P1-B: AI 拍照識單字
 * 學生拍下教科書/圖片，Gemini Vision 自動辨識英文單字並加入個人單字庫
 */
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Loader2, Check, Plus, ArrowLeft, X, BookOpen, Sparkles } from 'lucide-react';
import { Link } from 'wouter';
import { UserExpBar } from '@/components/gamification/UserExpBar';
import { useWordLibrary } from '@/hooks/useWordLibrary';

interface DetectedWord {
  english: string;
  chinese: string;
  phonetic?: string;
  example?: string;
  category: string;
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

async function detectWordsFromImage(base64Image: string, mimeType: string): Promise<DetectedWord[]> {
  const prompt = 分析這張圖片，找出所有英文單字。
對於每個找到的英文單字，回傳以下 JSON 陣列格式（只回傳 JSON，不要其他文字）：
[
  { "english": "apple", "chinese": "蘋果", "phonetic": "ˈæp.əl", "example": "I eat an apple every day.", "category": "Food" }
]
規則：
- 只找出名詞、動詞、形容詞等實詞，略過 a/the/is 等功能詞
- category 選最適合的：Animals, Food, School, Family, Colors, Numbers, Sports, Nature, Body, Verbs, 或 General
- 限制最多回傳 15 個最重要的單字
- 如果圖片中沒有英文單字，回傳空陣列 [];

  const response = await fetch(
    https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: base64Image } }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 2048 }
      })
    }
  );
  if (!response.ok) throw new Error('Gemini API error');
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];
  return JSON.parse(jsonMatch[0]) as DetectedWord[];
}

export default function PhotoScan() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { addWord } = useWordLibrary() as unknown as { addWord?: (w: object) => Promise<void> };

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [detectedWords, setDetectedWords] = useState<DetectedWord[]>([]);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [addingIdx, setAddingIdx] = useState<number | null>(null);

  const handleFile = async (file: File) => {
    setError(null); setDetectedWords([]); setAddedIds(new Set());
    setPreviewUrl(URL.createObjectURL(file));
    setIsScanning(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const words = await detectWordsFromImage(base64, file.type || 'image/jpeg');
      if (words.length === 0) setError('圖片中找不到英文單字，請試試清晰的教科書頁面');
      else setDetectedWords(words);
    } catch { setError('掃描失敗，請確認網路連線後重試'); }
    finally { setIsScanning(false); }
  };

  const handleAddWord = async (word: DetectedWord, idx: number) => {
    setAddingIdx(idx);
    try {
      if (addWord) {
        await addWord({ english: word.english, chinese: word.chinese, phonetic: word.phonetic, example: word.example, category: word.category });
      }
      setAddedIds(prev => new Set([...prev, idx]));
    } catch { setError('新增失敗'); }
    finally { setAddingIdx(null); }
  };

  const handleAddAll = async () => {
    for (let i = 0; i < detectedWords.length; i++) {
      if (!addedIds.has(i)) await handleAddWord(detectedWords[i], i);
    }
  };

  const resetScan = () => { setPreviewUrl(null); setDetectedWords([]); setAddedIds(new Set()); setError(null); };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-violet-50 via-blue-50 to-cyan-50 py-4 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="p-2 rounded-full bg-white shadow hover:scale-105 transition-transform text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
              <Camera className="w-6 h-6 text-violet-500" /> AI 拍照識單字
            </h1>
            <p className="text-sm text-muted-foreground">拍下教科書，AI 自動辨識英文單字</p>
          </div>
        </div>
        <UserExpBar />

        {!previewUrl && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
            <button onClick={() => cameraInputRef.current?.click()} className="w-full flex items-center justify-center gap-4 p-8 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-3xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all font-black text-xl">
              <Camera className="w-8 h-8" /> 📷 拍照掃描
            </button>
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-4 p-6 bg-white border-4 border-dashed border-violet-300 text-violet-700 rounded-3xl hover:border-violet-500 hover:bg-violet-50 transition-all font-bold text-lg">
              <Upload className="w-6 h-6" /> 從相簿選擇圖片
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <div className="bg-white/80 rounded-2xl p-4 border border-violet-100">
              <p className="font-bold text-violet-700 mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4" /> 使用小技巧</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>對準英文課本頁面拍攝效果最佳</li>
                <li>確保文字清晰、光線充足</li>
                <li>AI 最多辨識 15 個重要單字</li>
              </ul>
            </div>
          </motion.div>
        )}

        {previewUrl && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-4">
            <div className="relative rounded-3xl overflow-hidden shadow-lg">
              <img src={previewUrl} alt="掃描圖片" className="w-full max-h-72 object-contain bg-black" />
              {isScanning && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-10 h-10 text-white animate-spin" />
                  <p className="text-white font-bold text-lg">AI 正在分析單字中...</p>
                </div>
              )}
              <button onClick={resetScan} className="absolute top-3 right-3 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"><X className="w-4 h-4" /></button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 font-bold text-sm">
                ⚠️ {error} <button onClick={resetScan} className="ml-3 underline text-red-500 text-xs">重新掃描</button>
              </div>
            )}

            <AnimatePresence>
              {detectedWords.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-black text-lg text-foreground flex items-center gap-2"><BookOpen className="w-5 h-5 text-violet-500" /> 辨識到 {detectedWords.length} 個單字</h2>
                    <button onClick={handleAddAll} className="text-sm font-bold bg-violet-500 text-white px-4 py-2 rounded-full hover:bg-violet-600 transition-colors flex items-center gap-1"><Plus className="w-4 h-4" /> 全部加入</button>
                  </div>
                  <div className="space-y-2">
                    {detectedWords.map((word, idx) => (
                      <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} className="bg-white rounded-2xl p-4 border-2 border-violet-100 flex items-center gap-3 shadow-sm">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-lg text-foreground">{word.english}</span>
                            {word.phonetic && <span className="text-xs text-slate-400 font-mono">{word.phonetic}</span>}
                            <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-bold">{word.category}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{word.chinese}</p>
                          {word.example && <p className="text-xs text-slate-400 italic truncate">{word.example}</p>}
                        </div>
                        <button onClick={() => handleAddWord(word, idx)} disabled={addedIds.has(idx) || addingIdx === idx} className={shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all }>
                          {addingIdx === idx ? <Loader2 className="w-4 h-4 animate-spin" /> : addedIds.has(idx) ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </button>
                      </motion.div>
                    ))}
                  </div>
                  {addedIds.size > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
                      <p className="font-bold text-green-700">✅ 已成功加入 {addedIds.size} 個單字！</p>
                      <Link href="/learn" className="inline-block mt-2 text-sm text-green-600 underline font-bold">前往學習 →</Link>
                    </motion.div>
                  )}
                  <button onClick={resetScan} className="w-full mt-4 py-3 border-2 border-dashed border-violet-300 text-violet-600 rounded-2xl font-bold hover:bg-violet-50 transition-colors">📷 再掃描一張</button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}