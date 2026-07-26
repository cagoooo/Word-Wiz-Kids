/**
 * NicknameSetup — modal-style overlay for choosing nickname + avatar.
 * Shown when the student has no nickname yet.
 * All text in Traditional Chinese. No emojis.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from 'lucide-react';
import type { Student } from '@/hooks/useStudent';

const AVATAR_COUNT = 8;
const AVATAR_COLORS = [
  'bg-red-400',
  'bg-blue-400',
  'bg-green-400',
  'bg-yellow-400',
  'bg-purple-400',
  'bg-pink-400',
  'bg-orange-400',
  'bg-teal-400',
];
const AVATAR_INITIALS = ['貓', '狗', '兔', '熊', '鳥', '魚', '獅', '虎'];

interface Props {
  open: boolean;
  studentId: string;
  onSave: (student: Student) => void;
}

export function NicknameSetup({ open, studentId, onSave }: Props) {
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState(1);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = nickname.trim();
    if (!trimmed) return;
    onSave({ id: studentId, nickname: trimmed, avatar });
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
        >
          <motion.div
            initial={{ scale: 0.8, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 40 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="w-full max-w-md bg-card rounded-3xl border-2 border-border shadow-2xl p-8"
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <User className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-black text-foreground">建立你的英雄檔案</h2>
              <p className="text-muted-foreground mt-1">選一個頭像，再輸入你的名字</p>
            </div>

            {/* Avatar grid */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              {Array.from({ length: AVATAR_COUNT }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setAvatar(n)}
                  className={`w-full aspect-square rounded-2xl font-black text-xl text-white transition-all ${AVATAR_COLORS[n - 1]} ${
                    avatar === n
                      ? 'scale-110 ring-4 ring-primary ring-offset-2 shadow-lg'
                      : 'opacity-60 hover:opacity-90'
                  }`}
                  data-testid={`avatar-btn-${n}`}
                >
                  {AVATAR_INITIALS[n - 1]}
                </button>
              ))}
            </div>

            {/* Nickname input */}
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="輸入你的暱稱（最多 6 個字）"
                maxLength={6}
                className="w-full px-4 py-3 rounded-2xl border-2 border-border bg-muted text-foreground text-lg font-bold text-center focus:outline-none focus:border-primary transition-colors mb-4"
                data-testid="nickname-input"
                autoFocus
              />
              <button
                type="submit"
                disabled={!nickname.trim()}
                className="w-full py-4 bg-primary text-primary-foreground rounded-2xl text-xl font-black disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors active:scale-95"
                data-testid="nickname-save"
              >
                出發冒險！
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { AVATAR_COLORS, AVATAR_INITIALS };
