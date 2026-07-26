import { motion } from 'framer-motion';
import { Trophy, Medal, Star } from 'lucide-react';

const MOCK_LEADERBOARD = [
  { id: 1, name: '小明', score: 2540, avatar: '/avatar1.png', rank: 1 },
  { id: 2, name: '小美', score: 2120, avatar: '/avatar2.png', rank: 2 },
  { id: 3, name: '阿豪', score: 1890, avatar: '/avatar3.png', rank: 3 },
  { id: 4, name: '小芸', score: 1450, avatar: null, rank: 4 },
  { id: 5, name: '小傑', score: 1200, avatar: null, rank: 5 },
];

export default function Leaderboard() {
  return (
    <div className="min-h-[100dvh] pt-24 pb-12 px-4 relative overflow-hidden bg-background">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
      
      <div className="max-w-3xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5 }}
            className="inline-block p-4 bg-accent/20 rounded-full mb-4"
          >
            <Trophy className="w-12 h-12 text-yellow-500" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            單字英雄榜
          </h1>
          <p className="text-xl text-foreground/70">
            最勇敢的單字小英雄就在這裡！
          </p>
        </div>

        <div className="bg-card rounded-3xl border-2 border-border shadow-xl overflow-hidden">
          <div className="p-6 bg-primary/5 border-b border-border flex justify-between items-center font-bold text-lg text-foreground/80">
            <div className="w-16 text-center">排名</div>
            <div className="flex-1 px-4">英雄</div>
            <div className="w-32 text-right">星星數</div>
          </div>
          
          <ul className="divide-y divide-border">
            {MOCK_LEADERBOARD.map((user, index) => (
              <motion.li
                key={user.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 sm:p-6 flex items-center transition-colors hover:bg-muted/50 ${
                  user.rank <= 3 ? 'bg-primary/5' : ''
                }`}
                data-testid={`leaderboard-row-${user.id}`}
              >
                <div className="w-16 flex justify-center items-center">
                  {user.rank === 1 && <Medal className="w-8 h-8 text-yellow-500" />}
                  {user.rank === 2 && <Medal className="w-8 h-8 text-gray-400" />}
                  {user.rank === 3 && <Medal className="w-8 h-8 text-amber-600" />}
                  {user.rank > 3 && <span className="text-2xl font-bold text-foreground/50">#{user.rank}</span>}
                </div>
                
                <div className="flex-1 px-4 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-muted border-2 border-primary/20 overflow-hidden shadow-sm">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary/20 text-secondary text-xl font-bold">
                        {user.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <span className="text-xl font-bold text-foreground">{user.name}</span>
                </div>
                
                <div className="w-32 flex justify-end items-center gap-2">
                  <span className="text-2xl font-bold text-accent-foreground">{user.score}</span>
                  <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
