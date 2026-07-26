import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X, BookOpen, Gamepad2, Trophy, Settings, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function Navbar() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: '首頁', icon: Sparkles, testId: 'nav-home' },
    { href: '/learn', label: '學習', icon: BookOpen, testId: 'nav-learn' },
    { href: '/game', label: '遊戲', icon: Gamepad2, testId: 'nav-game' },
    { href: '/leaderboard', label: '排行榜', icon: Trophy, testId: 'nav-leaderboard' },
    { href: '/admin', label: '管理', icon: Settings, testId: 'nav-admin' },
  ];

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2 group" data-testid="nav-logo">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-sm group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="font-bold text-xl tracking-tight text-foreground">
                單字小英雄
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              {navLinks.map((link) => {
                const isActive = location === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    data-testid={link.testId}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-md scale-105'
                        : 'text-foreground/80 hover:bg-accent/20 hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 rounded-full text-foreground hover:bg-accent/20 transition-colors"
                data-testid="button-mobile-menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMenu}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] md:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-3/4 max-w-sm bg-card z-[70] shadow-2xl flex flex-col md:hidden"
            >
              <div className="p-4 flex justify-between items-center border-b border-border">
                <span className="font-bold text-xl text-foreground">選單</span>
                <button
                  onClick={closeMenu}
                  className="p-2 rounded-full bg-muted text-muted-foreground hover:bg-accent/20 transition-colors"
                  data-testid="button-close-menu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-2">
                {navLinks.map((link) => {
                  const isActive = location === link.href;
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={closeMenu}
                      data-testid={`${link.testId}-mobile`}
                      className={`flex items-center gap-4 px-4 py-4 rounded-xl font-medium transition-all ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'bg-muted/50 text-foreground hover:bg-accent/20'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${isActive ? 'bg-white/20' : 'bg-background'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-lg">{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
