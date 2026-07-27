import { HeroScene } from '@/components/hero/HeroScene';
import { motion } from 'framer-motion';
import {
  Sparkles, ArrowRight, Star, BookOpen, Gamepad2, Trophy,
  Swords, Camera, Headphones, Zap, ChevronRight,
} from 'lucide-react';
import { Link } from 'wouter';
import { UserExpBar } from '@/components/gamification/UserExpBar';

const NAV_CARDS = [
  {
    href: '/learn',
    label: '開始學習',
    sub: '單字卡片 × 發音練習',
    icon: BookOpen,
    gradient: 'from-violet-500 via-purple-500 to-indigo-600',
    glow: 'shadow-violet-500/40',
    border: 'border-violet-400/30',
    badge: '📚',
    testId: 'link-start-learning',
    featured: true,
  },
  {
    href: '/game',
    label: '單人挑戰',
    sub: '限時搶答 × EXP 獎勵',
    icon: Star,
    gradient: 'from-amber-400 via-orange-500 to-rose-500',
    glow: 'shadow-orange-500/40',
    border: 'border-orange-400/30',
    badge: '⚡',
    testId: 'link-play-game',
    featured: false,
  },
  {
    href: '/arena/player',
    label: '全班對戰',
    sub: 'Kahoot 即時搶答',
    icon: Swords,
    gradient: 'from-rose-500 via-pink-500 to-fuchsia-600',
    glow: 'shadow-rose-500/40',
    border: 'border-rose-400/30',
    badge: '⚔️',
    testId: 'link-arena-player',
    featured: false,
  },
  {
    href: '/photo-scan',
    label: 'AI 拍照識字',
    sub: '拍教科書 × 自動加入',
    icon: Camera,
    gradient: 'from-cyan-500 via-teal-500 to-emerald-600',
    glow: 'shadow-cyan-500/40',
    border: 'border-cyan-400/30',
    badge: '📷',
    testId: 'link-photo-scan',
    featured: false,
  },
  {
    href: '/listen-quiz',
    label: '聽力測驗',
    sub: '純音訊 × 訓練耳力',
    icon: Headphones,
    gradient: 'from-blue-500 via-indigo-500 to-violet-600',
    glow: 'shadow-blue-500/40',
    border: 'border-blue-400/30',
    badge: '🎧',
    testId: 'link-listen-quiz',
    featured: false,
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.08, duration: 0.45, ease: 'easeOut' as const },
  }),
};


export default function Home() {
  return (
    <div className="min-h-[100dvh] flex flex-col pt-20">
      {/* Exp Bar */}
      <div className="w-full max-w-4xl mx-auto px-4 z-20">
        <UserExpBar />
      </div>

      {/* Hero Section */}
      <section className="relative h-[80vh] w-full flex items-center justify-center overflow-hidden">
        <HeroScene />

        <div className="z-10 text-center px-4 w-full max-w-5xl mx-auto pointer-events-none mt-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="backdrop-blur-md bg-black/25 p-6 sm:p-10 rounded-3xl border border-white/10 shadow-2xl pointer-events-auto"
          >
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold text-white mb-4 drop-shadow-lg flex flex-col gap-1">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400">
                神奇單字
              </span>
              <span>等你來探索！</span>
            </h1>
            <p className="text-base sm:text-xl text-white/85 mb-8 max-w-xl mx-auto drop-shadow-md">
              踏入發光的魔法世界，英文字母在這裡活了起來，每個單字後面都藏著精彩冒險！
            </p>

            {/* ── 功能卡片 Grid ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {NAV_CARDS.map((card, i) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={card.href}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                    className={card.featured ? 'col-span-2 sm:col-span-1' : ''}
                  >
                    <Link
                      href={card.href}
                      data-testid={card.testId}
                      className={[
                        'group relative flex flex-col items-center justify-center gap-2',
                        'rounded-2xl sm:rounded-3xl border p-4 sm:p-5',
                        'bg-gradient-to-br', card.gradient,
                        'shadow-xl', card.glow, card.border,
                        'transition-all duration-200',
                        'hover:scale-[1.06] hover:brightness-110 hover:-translate-y-1',
                        'active:scale-95',
                        'overflow-hidden',
                        card.featured ? 'min-h-[110px] sm:min-h-[130px]' : 'min-h-[100px] sm:min-h-[120px]',
                      ].join(' ')}
                    >
                      {/* Shimmer overlay on hover */}
                      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-200 rounded-2xl sm:rounded-3xl" />

                      {/* Top-right corner glow blob */}
                      <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />

                      {/* Badge emoji */}
                      <span className="text-2xl sm:text-3xl leading-none drop-shadow-lg">
                        {card.badge}
                      </span>

                      {/* Icon */}
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white/90 drop-shadow-sm" />

                      {/* Label */}
                      <span className="text-white font-black text-sm sm:text-base leading-tight tracking-wide drop-shadow-md text-center">
                        {card.label}
                      </span>

                      {/* Sub-label */}
                      <span className="text-white/70 text-[10px] sm:text-xs font-medium text-center leading-tight hidden sm:block">
                        {card.sub}
                      </span>

                      {/* Arrow on hover */}
                      <ChevronRight className="absolute right-2 bottom-2 w-4 h-4 text-white/50 group-hover:text-white/90 group-hover:translate-x-0.5 transition-all duration-200" />
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* 快捷按鈕 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-5 flex items-center justify-center gap-3"
            >
              <Link
                href="/learn"
                className="group inline-flex items-center gap-2 px-6 py-3 bg-white/90 hover:bg-white text-purple-700 font-black rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all text-sm sm:text-base"
                data-testid="link-start-now"
              >
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                立即開始學習
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/game"
                className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-400/90 hover:bg-yellow-400 text-yellow-900 font-black rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all text-sm sm:text-base"
              >
                <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                開始挑戰
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="flex-1 bg-background py-20 px-4 relative overflow-hidden">
        {/* Decorative background blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-12">
              為什麼小朋友愛單字小英雄
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: '神奇單字書',
                  desc: '每個單字都能解鎖故事宇宙的新篇章，讓學習變成一場冒險！',
                  icon: <BookOpen className="w-14 h-14" />,
                  color: 'bg-primary/10 text-primary border-primary/20',
                },
                {
                  title: '趣味闖關遊戲',
                  desc: '用 Kahoot 風格的挑戰測試你的記憶力和反應速度，超級刺激！',
                  icon: <Gamepad2 className="w-14 h-14" />,
                  color: 'bg-secondary/10 text-secondary border-secondary/20',
                },
                {
                  title: '每日挑戰獎勵',
                  desc: '收集閃亮星星、爬上排行榜、解鎖可愛角色，每天都有驚喜！',
                  icon: <Trophy className="w-14 h-14" />,
                  color: 'bg-accent/10 text-yellow-600 border-accent/20',
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className={`p-8 rounded-3xl border shadow-sm hover:shadow-md transition-shadow bg-card flex flex-col items-center ${feature.color}`}
                  data-testid={`feature-card-${i}`}
                >
                  <div className="mb-6">{feature.icon}</div>
                  <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-foreground/70 text-lg">{feature.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
