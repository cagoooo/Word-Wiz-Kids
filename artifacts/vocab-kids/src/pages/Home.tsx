import { HeroScene } from '@/components/hero/HeroScene';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Star, BookOpen, Gamepad2, Trophy, Swords, Camera, Headphones } from 'lucide-react';
import { Link } from 'wouter';
import { UserExpBar } from '@/components/gamification/UserExpBar';

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
        
        <div className="z-10 text-center px-4 max-w-3xl mx-auto pointer-events-none mt-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="backdrop-blur-md bg-black/20 p-8 rounded-3xl border border-white/10 shadow-2xl pointer-events-auto"
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-lg flex flex-col gap-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400">
                神奇單字
              </span>
              <span>等你來探索！</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-xl mx-auto drop-shadow-md">
              踏入發光的魔法世界，英文字母在這裡活了起來，每個單字後面都藏著精彩冒險！
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="/learn" 
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground text-xl font-bold rounded-full overflow-hidden shadow-[0_0_20px_rgba(200,100,255,0.5)] transition-transform hover:scale-105"
                data-testid="link-start-learning"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
                <Sparkles className="w-6 h-6" />
                <span>開始學習</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link 
                href="/game" 
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white text-xl font-bold rounded-full backdrop-blur-md border border-white/20 transition-all hover:scale-105"
                data-testid="link-play-game"
              >
                <Star className="w-6 h-6 text-yellow-300" />
                <span>單人挑戰</span>
              </Link>

              <Link 
                href="/arena/player" 
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-rose-500/80 hover:bg-rose-500 text-white text-xl font-bold rounded-full backdrop-blur-md border border-rose-400/40 transition-all hover:scale-105 shadow-lg"
                data-testid="link-arena-player"
              >
                <Swords className="w-6 h-6 text-rose-200" />
                <span>全班對戰</span>
              </Link>

              <Link
                href="/photo-scan"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-violet-500/80 hover:bg-violet-500 text-white text-xl font-bold rounded-full backdrop-blur-md border border-violet-400/40 transition-all hover:scale-105 shadow-lg"
                data-testid="link-photo-scan"
              >
                <Camera className="w-6 h-6 text-violet-200" />
                <span>拍照識字</span>
              </Link>

              <Link
                href="/listen-quiz"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-cyan-500/80 hover:bg-cyan-500 text-white text-xl font-bold rounded-full backdrop-blur-md border border-cyan-400/40 transition-all hover:scale-105 shadow-lg"
                data-testid="link-listen-quiz"
              >
                <Headphones className="w-6 h-6 text-cyan-200" />
                <span>聽力測驗</span>
              </Link>
            </div>
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
                  color: 'bg-primary/10 text-primary border-primary/20'
                },
                {
                  title: '趣味闖關遊戲',
                  desc: '用 Kahoot 風格的挑戰測試你的記憶力和反應速度，超級刺激！',
                  icon: <Gamepad2 className="w-14 h-14" />,
                  color: 'bg-secondary/10 text-secondary border-secondary/20'
                },
                {
                  title: '每日挑戰獎勵',
                  desc: '收集閃亮星星、爬上排行榜、解鎖可愛角色，每天都有驚喜！',
                  icon: <Trophy className="w-14 h-14" />,
                  color: 'bg-accent/10 text-yellow-600 border-accent/20'
                }
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
