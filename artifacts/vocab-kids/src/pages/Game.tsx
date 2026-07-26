import { motion } from 'framer-motion';
import { Gamepad2, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

export default function Game() {
  return (
    <div className="min-h-[100dvh] pt-24 pb-12 px-4 flex flex-col items-center justify-center relative overflow-hidden bg-background">
      {/* Decorative background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[30%] left-[20%] w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-pulse delay-500" />
        <div className="absolute bottom-[10%] right-[30%] w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        className="relative z-10 w-full max-w-lg bg-card rounded-[2rem] border-2 border-border shadow-xl overflow-hidden"
        data-testid="coming-soon-card-game"
      >
        <div className="h-64 w-full relative bg-muted flex items-center justify-center overflow-hidden">
          <img 
            src="/coming-soon.png" 
            alt="Magical Treasure Chest" 
            className="absolute inset-0 w-full h-full object-cover opacity-90 hue-rotate-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
        </div>
        
        <div className="p-8 text-center flex flex-col items-center">
          <div className="inline-flex items-center justify-center p-3 bg-secondary/10 text-secondary rounded-full mb-4">
            <Gamepad2 className="w-8 h-8" />
          </div>
          
          <h1 className="text-4xl font-bold text-foreground mb-4">
            冒險闖關遊戲
          </h1>
          
          <h2 className="text-2xl font-bold text-secondary mb-4">
            即將推出！
          </h2>
          
          <p className="text-lg text-foreground/70 mb-8">
            遊戲競技場正在施法中！準備好測試你的英文技能，贏得豐厚獎勵吧！
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
