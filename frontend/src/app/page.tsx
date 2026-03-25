'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModeToggle } from '@/components/theme-toggle';
import { UserProfileNav } from '@/components/user-profile-nav';
import { 
  Brain, Shield, MessageSquare, CheckCircle2, 
  Cpu, MessageCircle, Bell, Gauge, Timer, 
  MoveVertical, Bot, ChartLine, Lightbulb
} from 'lucide-react';

// Scroll animation component - WITH DEBUG LOGGING
const ScrollAnimationWrapper = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const debugIdRef = useRef(Math.random().toString(36).substr(2, 9));

  useEffect(() => {
    // Don't run on server
    if (typeof window === 'undefined') return;

    const debugId = debugIdRef.current;
    console.log(`[${debugId}] ScrollAnimationWrapper mounted, delay=${delay}`);

    // Function to check if element is in viewport
    const isInViewport = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const visible = rect.top <= window.innerHeight && rect.bottom >= 0;
      console.log(`[${debugId}] isInViewport check: top=${rect.top}, bottom=${rect.bottom}, visible=${visible}`);
      return visible;
    };

    // Check if already visible and trigger animation
    const checkAndTrigger = () => {
      if (ref.current && isInViewport(ref.current)) {
        console.log(`[${debugId}] ✓ Element already in viewport on mount, triggering animation with delay=${delay}`);
        setTimeout(() => {
          console.log(`[${debugId}] Setting isVisible=true (delayed by ${delay}ms)`);
          setIsVisible(true);
        }, delay);
      } else {
        console.log(`[${debugId}] Element NOT in viewport on mount`);
      }
    };

    // Use requestAnimationFrame to ensure DOM is fully ready
    console.log(`[${debugId}] Requesting animation frame...`);
    const rafId = requestAnimationFrame(() => {
      console.log(`[${debugId}] Animation frame callback fired`);
      checkAndTrigger();
    });

    // Create intersection observer for scroll-based animation
    const observer = new IntersectionObserver(
      (entries) => {
        console.log(`[${debugId}] Observer fired with ${entries.length} entries`);
        entries.forEach((entry) => {
          console.log(`[${debugId}] Entry isIntersecting=${entry.isIntersecting}, boundingClientRect:`, entry.boundingClientRect);
          if (entry.isIntersecting) {
            // Element is in viewport - trigger animation
            console.log(`[${debugId}] Element entering viewport, setting isVisible=true with delay=${delay}`);
            setTimeout(() => {
              console.log(`[${debugId}] Executing delayed setIsVisible(true)`);
              setIsVisible(true);
            }, delay);
          } else {
            // Element is out of viewport - reset for replay
            if (delay === 0) {
              console.log(`[${debugId}] Skipping reset for delay=0 (hero section)`);
              return;
            }
            console.log(`[${debugId}] Element leaving viewport, setting isVisible=false`);
            setIsVisible(false);
          }
        });
      },
      {
        threshold: 0.1
      }
    );

    // Observe the element
    if (ref.current) {
      console.log(`[${debugId}] Starting to observe element`);
      observer.observe(ref.current);
    } else {
      console.log(`[${debugId}] ERROR: ref.current is null!`);
    }

    // Cleanup
    return () => {
      console.log(`[${debugId}] Cleaning up (component unmounting)`);
      cancelAnimationFrame(rafId);
      if (ref.current) {
        observer.unobserve(ref.current);
      }
      observer.disconnect();
    };
  }, [delay]);

  console.log(`[${debugIdRef.current}] Rendering with isVisible=${isVisible}, opacity=${isVisible ? '100' : '0'}`);


  console.log(`[${debugIdRef.current}] Rendering with isVisible=${isVisible}, opacity=${isVisible ? '100' : '0'}`);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-8'
      }`}
    >
      {children}
    </div>
  );
};

export default function LandingPage() {
  // User profile feature added to navbar
  useEffect(() => {
    // Enable smooth scrolling
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-50 selection:bg-indigo-600 selection:text-white transition-colors duration-300">
      {/* NAVIGATION */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-4 flex flex-wrap items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:-translate-y-0.5 transition-transform duration-300 cursor-pointer group">
            <Brain className="text-indigo-600 dark:text-indigo-400 w-8 h-8 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-2xl tracking-tight text-slate-900 dark:text-white">
              Mind<span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-500 dark:from-indigo-400 dark:to-cyan-400">Breaker</span>
            </span>
            <span className="hidden md:inline-block ml-2 text-xs font-medium bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-500/20">AI · Beta</span>
          </Link>
          <div className="hidden md:flex items-center space-x-8 text-slate-600 dark:text-slate-400 font-medium tracking-sm">
            <Link href="#features" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Features</Link>
            <Link href="#how-it-works" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">How it works</Link>
            <Link href="/dashboard" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Dashboard</Link>
            <ModeToggle />
          </div>
          <div className="flex items-center gap-4">
            <div className="md:hidden"><ModeToggle /></div>
            <UserProfileNav />
          </div>
        </div>
      </nav>

      <main>
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] dark:from-indigo-950 dark:via-slate-950 dark:to-slate-950 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-6 md:px-10">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <ScrollAnimationWrapper delay={0}>
                <div className="z-10 relative">
                  <div className="inline-flex items-center gap-2 bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 mb-6 shadow-sm">
                    <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Break doomscrolling · AI intervention
                  </div>
                  <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                    Stop scrolling <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-500 dark:from-indigo-400 dark:to-cyan-400">mindlessly.</span><br /> Reclaim focus.
                  </h1>
                  <p className="text-xl text-slate-600 dark:text-slate-400 mt-6 max-w-lg leading-relaxed">
                    The intervention system that detects doomscrolling patterns and uses behavioral psychology + AI to wake you up. 
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400 block mt-2">Intentional scrolling only.</span>
                  </p>
                  <div className="flex flex-wrap gap-4 mt-8">
                    <Link href="/register">
                      <Button size="lg" className="rounded-full px-8 h-14 text-lg shadow-xl shadow-indigo-200 dark:shadow-indigo-900/50 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                         Join waitlist
                      </Button>
                    </Link>
                    <Link href="#intervention-demo">
                      <Button variant="outline" size="lg" className="rounded-full px-8 h-14 text-lg bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border-slate-300 dark:border-slate-600 hover:border-indigo-400 gap-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                        <MessageSquare className="w-5 h-5" /> See demo
                      </Button>
                    </Link>
                  </div>
                  <div className="flex flex-wrap gap-6 mt-10 text-sm text-slate-500 dark:text-slate-400 font-medium">
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-indigo-500" /> AI intent detection</div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-indigo-500" /> Psychology triggers</div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-indigo-500" /> Empathic nudges</div>
                  </div>
                </div>
              </ScrollAnimationWrapper>
              
              {/* HERO VISUAL / GLASS CARD */}
              <ScrollAnimationWrapper delay={200}>
                <div className="relative flex justify-center mt-10 md:mt-0">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-indigo-200 to-cyan-100 dark:from-indigo-300 dark:to-cyan-200 rounded-full blur-[80px] opacity-40 -z-10"></div>
                  <div className="relative w-full max-w-md bg-white/60 dark:bg-white/40 backdrop-blur-xl border border-white/80 dark:border-white/60 rounded-3xl shadow-2xl p-4 md:p-6 transform transition-transform hover:-translate-y-2 duration-500">
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 text-slate-900 dark:text-slate-100 font-mono text-sm shadow-inner ring-1 ring-slate-200 dark:ring-slate-800">
                      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700/80 pb-3 mb-4">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-slate-400 dark:text-slate-500 ml-2">MindBreaker Extension · active</span>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between text-slate-400 dark:text-slate-500 text-xs">
                          <span>Session: <span className="text-slate-200 dark:text-slate-300">22m 14s</span></span>
                          <span>Viewed: <span className="text-slate-200 dark:text-slate-300">247 posts</span></span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-gradient-to-r from-red-500 to-orange-400 w-[92%] h-full rounded-full animate-pulse"></div>
                        </div>
                        <div className="bg-indigo-500/10 p-4 rounded-xl border-l-2 border-indigo-400 mt-4 relative overflow-hidden group">
                          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                          <div className="flex gap-3 items-start relative z-10">
                            <Timer className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-slate-100 mb-1">⚠️ Doomscrolling detected</p>
                              <p className="text-indigo-200 text-xs leading-relaxed">AI inference: mindless scrolling pattern (velocity ↑, intent ↓)</p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 relative bg-slate-800 p-4 rounded-xl text-sm border border-slate-700 shadow-lg">
                          <div className="absolute -top-2 left-6 w-4 h-4 bg-slate-800 border-t border-l border-slate-700 rotate-45"></div>
                          <div className="flex gap-2">
                             <Bot className="w-5 h-5 text-indigo-400 shrink-0" />
                             <span className="font-medium text-slate-200">You've scrolled 247 posts in 22 mins. Still intentional?</span>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-4 text-xs font-sans">
                            <button className="bg-indigo-600 px-4 py-2 rounded-full hover:bg-indigo-500 transition-colors shadow-sm text-white font-medium">Keep scrolling</button>
                            <button className="bg-slate-700 px-4 py-2 rounded-full hover:bg-slate-600 transition-colors shadow-sm text-slate-200 font-medium">Take a break →</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollAnimationWrapper>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" className="py-24 bg-slate-50 dark:bg-slate-900 relative transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-6 md:px-10">
            <ScrollAnimationWrapper>
              <div className="text-center max-w-2xl mx-auto mb-16">
                <span className="text-indigo-600 dark:text-indigo-400 font-bold tracking-wider text-xs uppercase px-3 py-1 bg-indigo-100 dark:bg-indigo-500/10 rounded-full inline-block mb-4 border border-indigo-200 dark:border-indigo-500/20">The core logic</span>
                <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white mt-2">AI that understands <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-500 dark:from-indigo-400 dark:to-cyan-400">intent</span></h2>
                <p className="text-slate-600 dark:text-slate-400 mt-6 text-lg leading-relaxed">Not all scrolling is bad. We only intervene when your brain is on autopilot — powered by behavioral psychology and real-time biometric pattern detection.</p>
              </div>
            </ScrollAnimationWrapper>
            
            <div className="grid md:grid-cols-3 gap-8">
              <ScrollAnimationWrapper delay={100}>
                <div className="group rounded-3xl p-8 bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] transition-all duration-300">
                  <div className="w-14 h-14 bg-slate-100 dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-300 dark:border-slate-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Cpu className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Intent vs. Mindless AI</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Proprietary rule engine + ML classifies scrolling patterns: velocity, dwell time, skimming vs. deliberate reading. Only mindless spirals trigger intervention.</p>
                </div>
              </ScrollAnimationWrapper>

              <ScrollAnimationWrapper delay={200}>
                <div className="group rounded-3xl p-8 bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] transition-all duration-300">
                  <div className="w-14 h-14 bg-slate-100 dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-300 dark:border-slate-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Brain className="w-7 h-7 text-pink-500 dark:text-pink-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Behavioral Psychology</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Interventions based on cognitive reframing, friction, and mindful questioning. Example: <span className="italic text-slate-700 dark:text-slate-300 font-medium">Is this adding value right now?</span> Breaks the loop instantly.</p>
                </div>
              </ScrollAnimationWrapper>

              <ScrollAnimationWrapper delay={300}>
                <div className="group rounded-3xl p-8 bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] transition-all duration-300">
                  <div className="w-14 h-14 bg-slate-100 dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-300 dark:border-slate-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <MessageCircle className="w-7 h-7 text-cyan-500 dark:text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">LLM Emotional Messaging</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Optional empathetic AI that crafts personalized, context-aware messages. <span className="text-slate-700 dark:text-slate-300 font-medium">You've scrolled 47 mindless posts. What emotion are you chasing?</span></p>
                </div>
              </ScrollAnimationWrapper>
            </div>
          </div>
        </section>

        {/* INTERVENTION PREVIEW CARD */}
        <section id="intervention-demo" className="py-24 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-900 border-b relative transition-colors duration-300">
          <div className="max-w-6xl mx-auto px-6 md:px-10">
            <ScrollAnimationWrapper>
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 dark:shadow-indigo-500/10 border border-slate-200 dark:border-slate-800 overflow-hidden md:flex flex-row-reverse">
                {/* Right Side: Demo UI */}
                <div className="md:w-1/2 p-8 md:p-12 lg:p-16 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white relative overflow-hidden flex flex-col justify-center border-l border-slate-200 dark:border-slate-800">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full mix-blend-screen filter blur-[80px] opacity-20"></div>
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500 rounded-full mix-blend-screen filter blur-[80px] opacity-10"></div>
                  
                  <h3 className="text-2xl font-bold mb-8 relative z-10 flex items-center gap-3">
                    <Bell className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /> Real Intervention
                  </h3>
                  <div className="bg-slate-100 dark:bg-white/5 backdrop-blur-md rounded-2xl p-6 shadow-2xl relative z-10 border border-slate-300 dark:border-white/10">
                    <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-300 text-sm font-medium mb-4">
                      <Bot className="w-5 h-5"/> MindBreaker AI · Just now
                    </div>
                    <p className="text-xl font-medium leading-relaxed">
                      Your scroll velocity is rising, and you haven't interacted with a post in 10 minutes. Pause to breathe?
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 mt-8">
                      <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-full font-medium transition-colors shadow-lg shadow-indigo-900/30 text-sm border-none">Take a 2-min break</button>
                      <button className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-300 px-6 py-3 rounded-full font-medium transition-colors border border-slate-300 dark:border-slate-700 text-sm">Dismiss</button>
                    </div>
                  </div>
                  <div className="mt-8 flex items-start gap-3 text-indigo-600/60 dark:text-indigo-200/60 text-sm relative z-10 bg-slate-100/50 dark:bg-black/40 p-4 rounded-xl">
                    <Lightbulb className="w-5 h-5 shrink-0 text-amber-500 dark:text-amber-400" />
                    <p>Psychological trigger: Metacognitive questioning and forced choice architecture mapped to disrupt automatic scrolling loops.</p>
                  </div>
                </div>

                {/* Left Side: Metrics */}
                <div className="md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center bg-white dark:bg-slate-900">
                  <div className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold mb-4 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 w-fit px-4 py-1.5 rounded-full text-sm">
                    <ChartLine className="w-4 h-4" /> Pattern detection metrics
                  </div>
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 tracking-tight">How we know you're stuck</h3>
                  <ul className="space-y-6 text-slate-600 dark:text-slate-400">
                    <li className="flex gap-5">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-950 flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-800 shadow-sm">
                        <Gauge className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div><strong className="text-slate-900 dark:text-white block mb-1">Velocity Spike</strong> Scroll velocity &gt; 3 posts/sec flags mindless browsing.</div>
                    </li>
                    <li className="flex gap-5">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-950 flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-800 shadow-sm">
                        <Timer className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div><strong className="text-slate-900 dark:text-white block mb-1">Idle Dwell</strong> Session duration &gt; 5min without meaningful clicks or engagement.</div>
                    </li>
                    <li className="flex gap-5">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-950 flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-800 shadow-sm">
                        <MoveVertical className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div><strong className="text-slate-900 dark:text-white block mb-1">Skimming Pattern</strong> AI intent classifier differentiates deep reading from erratic swiping.</div>
                    </li>
                  </ul>
                </div>
              </div>
            </ScrollAnimationWrapper>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-24 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white relative overflow-hidden transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-6 md:px-10 relative z-10">
            <ScrollAnimationWrapper>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold">The intervention loop</h2>
                <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mt-4 text-lg">Seamless workflow to interrupt destructive habits in real-time.</p>
              </div>
            </ScrollAnimationWrapper>
            
            <div className="grid md:grid-cols-4 gap-8">
              <ScrollAnimationWrapper delay={0}>
                <div className="relative p-6 text-center">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto text-2xl font-bold border border-slate-300 dark:border-slate-800 shadow-inner mb-6 relative z-10">
                    1
                  </div>
                  <h3 className="font-bold text-lg mb-2">Install Extension</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Secure, lightweight browser extension running passively in the background.</p>
                </div>
              </ScrollAnimationWrapper>
              <ScrollAnimationWrapper delay={100}>
                <div className="relative p-6 text-center">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto text-2xl font-bold border border-slate-300 dark:border-slate-800 shadow-inner mb-6 relative z-10">
                    2
                  </div>
                  <h3 className="font-bold text-lg mb-2">Passive Monitoring</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Tracks velocity, idle time, and interaction rates anonymously.</p>
                </div>
              </ScrollAnimationWrapper>
              <ScrollAnimationWrapper delay={200}>
                <div className="relative p-6 text-center">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto text-2xl font-bold border border-slate-300 dark:border-slate-800 shadow-inner mb-6 relative z-10">
                    3
                  </div>
                  <h3 className="font-bold text-lg mb-2">AI Classification</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Rules engine identifies patterns matching the doomscrolling signature.</p>
                </div>
              </ScrollAnimationWrapper>
              <ScrollAnimationWrapper delay={300}>
                <div className="relative p-6 text-center">
                  <div className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto text-2xl font-bold shadow-[0_0_30px_rgba(79,70,229,0.5)] mb-6 relative z-10">
                    4
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-indigo-600 dark:text-indigo-100">Active Nudge</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Presents an immediate, friction-based psychological interruption.</p>
                </div>
              </ScrollAnimationWrapper>
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section id="waitlist" className="py-24 relative overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
          <div className="max-w-4xl mx-auto px-6 relative z-10">
            <ScrollAnimationWrapper>
              <div className="bg-gradient-to-br from-indigo-600 to-cyan-500 rounded-[2.5rem] p-10 md:p-16 text-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/20 rounded-full mix-blend-overlay blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-900/30 rounded-full mix-blend-overlay blur-3xl"></div>
                
                <div className="relative z-10">
                  <Shield className="w-16 h-16 text-white/90 mx-auto mb-6 drop-shadow-lg" />
                  <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">Ready to regain your focus?</h2>
                  <p className="text-indigo-100 text-lg font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
                    Join the early access beta to try the MindBreaker system. AI-powered interruptions that actually work to restore your daily productivity.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
                    <Input 
                      type="email" 
                      placeholder="Enter your email address" 
                      className="h-14 rounded-full px-6 text-lg bg-black/10 border-white/20 text-white placeholder:text-white/70 focus-visible:ring-2 focus-visible:ring-white focus-visible:border-transparent transition"
                    />
                    <Button size="lg" className="h-14 rounded-full px-8 text-lg bg-white text-indigo-600 hover:bg-slate-50 transition-colors shadow-xl font-bold shrink-0">
                      Get access
                    </Button>
                  </div>
                  <p className="text-indigo-100/80 text-sm mt-6 font-medium">No spam. Just an invite when we unlock beta testing.</p>
                </div>
              </div>
            </ScrollAnimationWrapper>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-12 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 md:px-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <Link href="/" className="flex items-center gap-2 hover:-translate-y-0.5 transition-transform group">
            <Brain className="w-7 h-7 text-indigo-600 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xl text-slate-800 dark:text-white tracking-tight">MindBreaker</span>
          </Link>
          <div className="flex gap-8 text-slate-500 dark:text-slate-400 text-sm font-medium">
            <Link href="#" className="hover:text-indigo-600 transition">Privacy</Link>
            <Link href="#" className="hover:text-indigo-600 transition">Terms</Link>
          </div>
          <div className="flex gap-4 items-center">
            <a href="#" className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 hover:text-indigo-600 transition">
               <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 hover:text-indigo-600 transition">
               <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </a>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 md:px-10 mt-8 text-center md:text-left text-xs text-slate-400 dark:text-slate-500 font-medium">
          © {new Date().getFullYear()} MindBreaker — AI + behavioral psychology against doomscrolling. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
