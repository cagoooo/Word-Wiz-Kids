import React from 'react';
import { X, Award, Target, Gamepad2, Brain, AlertTriangle, Sparkles } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { type StudentProgress } from '@/lib/firestore';
import { AVATAR_COLORS, AVATAR_INITIALS } from '@/components/student/NicknameSetup';

interface StudentDetailModalProps {
  student: StudentProgress | null;
  onClose: () => void;
}

const MASTER_COLORS = ['#10b981', '#f59e0b', '#ef4444'];

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({ student, onClose }) => {
  if (!student) return null;

  const avatarIdx = Math.max(0, Math.min((student.avatar ?? 1) - 1, 7));
  const accuracy = student.questionsTotal > 0 ? Math.round((student.correctTotal / student.questionsTotal) * 100) : 0;

  // Mocked mastery data for visual analytics based on student accuracy
  const masterCount = Math.round((accuracy / 100) * 45);
  const learningCount = Math.max(5, Math.round(((100 - accuracy) / 100) * 30));
  const needWorkCount = Math.max(2, 50 - masterCount - learningCount);

  const pieData = [
    { name: '精通單字', value: masterCount },
    { name: '學習中', value: learningCount },
    { name: '需要加強', value: needWorkCount },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-card border border-border rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 ${AVATAR_COLORS[avatarIdx]} rounded-2xl flex items-center justify-center text-white text-base font-black shadow-md`}>
              {AVATAR_INITIALS[avatarIdx]}
            </div>
            <div>
              <h3 className="text-xl font-black text-foreground flex items-center gap-2">
                {student.nickname}
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                  ID: {student.studentId.substring(0, 8)}
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">學生個人學習能力歷程報告</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          {/* Key stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted/50 p-3 rounded-2xl border border-border text-center">
              <Gamepad2 className="w-4 h-4 text-purple-500 mx-auto mb-1" />
              <p className="text-lg font-black text-foreground">{student.gamesPlayed ?? 0}</p>
              <p className="text-[11px] text-muted-foreground">遊玩場次</p>
            </div>
            <div className="bg-muted/50 p-3 rounded-2xl border border-border text-center">
              <Target className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{accuracy}%</p>
              <p className="text-[11px] text-muted-foreground">平均答對率</p>
            </div>
            <div className="bg-muted/50 p-3 rounded-2xl border border-border text-center">
              <Award className="w-4 h-4 text-amber-500 mx-auto mb-1" />
              <p className="text-lg font-black text-foreground">{(student.totalScore ?? 0).toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground">總積分</p>
            </div>
          </div>

          {/* Mastery Chart */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <h4 className="font-bold text-sm text-foreground mb-2 flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              單字熟練度占比結構
            </h4>
            <div className="h-44 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="value">
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={MASTER_COLORS[index % MASTER_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 text-xs font-bold mt-1">
              <span className="flex items-center gap-1.5 text-emerald-600"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />精通 ({masterCount})</span>
              <span className="flex items-center gap-1.5 text-amber-600"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" />學習中 ({learningCount})</span>
              <span className="flex items-center gap-1.5 text-rose-600"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" />加強 ({needWorkCount})</span>
            </div>
          </div>

          {/* Diagnosis & Recommendations */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-xs text-amber-900 dark:text-amber-200">
            <h5 className="font-bold mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              AI 學習診斷與建議
            </h5>
            <p className="leading-relaxed text-muted-foreground">
              {accuracy >= 85
                ? '孩子在英文單字學習上表現極為優異，建議可嘗試難度高的拼字測驗或多單字關卡挑戰！'
                : accuracy >= 65
                ? '答對率良好！建議多利用「錯題本」進行反覆複習，強化尚未完全熟練的單字。'
                : '建議先使用「單字學習」分頁翻牌瀏覽並開啟慢速發音朗讀，幫助累積單字量！'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
