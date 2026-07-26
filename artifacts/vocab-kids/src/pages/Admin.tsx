import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, KeyRound, ArrowRight } from 'lucide-react';

export default function Admin() {
  const [pin, setPin] = useState('');
  
  const handleNumberClick = (num: number) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
    }
  };
  
  const handleClear = () => setPin('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder - no actual logic here yet
    if (pin.length === 4) {
      alert(`已輸入 PIN 碼：${pin}，管理後台即將推出！`);
      setPin('');
    }
  };

  return (
    <div className="min-h-[100dvh] pt-24 pb-12 px-4 flex flex-col items-center justify-center bg-background relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[10%] left-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-muted rounded-full mb-4">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">家長專區</h1>
          <p className="text-muted-foreground mt-2">請輸入 PIN 碼進入管理設定</p>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-card p-8 rounded-3xl border-2 border-border shadow-xl">
          <div className="flex justify-center gap-4 mb-8">
            {[0, 1, 2, 3].map((index) => (
              <div 
                key={index}
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-2xl font-bold transition-colors ${
                  index < pin.length 
                    ? 'border-primary bg-primary text-primary-foreground' 
                    : 'border-border bg-muted'
                }`}
                data-testid={`pin-dot-${index}`}
              >
                {index < pin.length ? '*' : ''}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleNumberClick(num)}
                className="h-16 rounded-2xl bg-muted hover:bg-muted/80 text-2xl font-bold text-foreground transition-transform active:scale-95"
                data-testid={`pin-pad-${num}`}
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="h-16 rounded-2xl bg-destructive/10 text-destructive hover:bg-destructive/20 font-bold transition-transform active:scale-95 flex items-center justify-center"
              data-testid="pin-pad-clear"
            >
              清除
            </button>
            <button
              type="button"
              onClick={() => handleNumberClick(0)}
              className="h-16 rounded-2xl bg-muted hover:bg-muted/80 text-2xl font-bold text-foreground transition-transform active:scale-95"
              data-testid="pin-pad-0"
            >
              0
            </button>
            <button
              type="submit"
              disabled={pin.length < 4}
              className="h-16 rounded-2xl bg-primary text-primary-foreground font-bold transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center"
              data-testid="pin-pad-submit"
            >
              <ArrowRight className="w-8 h-8" />
            </button>
          </div>
          
          <div className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
            <KeyRound className="w-4 h-4" />
            預設 PIN 碼為 0000
          </div>
        </form>
      </motion.div>
    </div>
  );
}
