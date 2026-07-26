import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] pt-24 pb-12 w-full flex items-center justify-center bg-background relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[30%] left-[20%] w-72 h-72 bg-destructive/20 rounded-full blur-3xl animate-pulse delay-500" />
      
      <Card className="w-full max-w-md mx-4 relative z-10 border-2 border-border shadow-xl rounded-[2rem]">
        <CardContent className="pt-10 pb-8 text-center flex flex-col items-center">
          <div className="inline-flex items-center justify-center p-4 bg-destructive/10 text-destructive rounded-full mb-6">
            <AlertCircle className="h-12 w-12" />
          </div>
          
          <h1 className="text-4xl font-bold text-foreground mb-4">
            哎呀！找不到頁面
          </h1>

          <p className="text-lg text-foreground/70 mb-8">
            這條魔法路徑通往未知之地，我們回到安全的地方吧！
          </p>
          
          <Link 
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-full hover:scale-105 transition-transform shadow-md"
            data-testid="link-back-home-404"
          >
            <ArrowLeft className="w-5 h-5" />
            回首頁
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
