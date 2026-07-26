import { motion } from 'framer-motion';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

export default function Learn() {
  return (
    <div className="min-h-[100dvh] pt-24 pb-12 px-4 flex flex-col items-center justify-center relative overflow-hidden bg-background">
      {/* Decorative background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[20%] right-[10%] w-72 h-72 bg-secondary/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        className="relative z-10 w-full max-w-lg bg-card rounded-[2rem] border-2 border-border shadow-xl overflow-hidden"
        data-testid="coming-soon-card-learn"
      >
        <div className="h-64 w-full relative bg-muted flex items-center justify-center overflow-hidden">
          <img 
            src="/coming-soon.png" 
            alt="Magical Treasure Chest" 
            className="absolute inset-0 w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
        </div>
        
        <div className="p-8 text-center flex flex-col items-center">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 text-primary rounded-full mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          
          <h1 className="text-4xl font-bold text-foreground mb-4">
            魔法單字課程
          </h1>
          
          <h2 className="text-2xl font-bold text-primary mb-4">
            即將推出！
          </h2>
          
          <p className="text-lg text-foreground/70 mb-8">
            魔法師們正在準備神奇的單字書，請稍後回來解鎖全新的英文單字吧！
          </p>
          
          <Link 
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-muted text-foreground font-bold rounded-full hover:bg-muted/80 transition-colors"
            data-testid="link-back-home"
          >
            <ArrowLeft className="w-5 h-5" />
            回首頁
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
