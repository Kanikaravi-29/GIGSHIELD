import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, TrendingUp, Activity, ArrowRight, CloudRain, MapPin, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6 },
  }),
} as const;

export default function LandingPage() {
  return (
    <div className="min-h-screen gradient-surface">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 md:px-12 border-b border-border/30">
        <div className="flex items-center gap-2">
          <div className="gradient-primary p-1.5 rounded-lg">
            <ShieldCheck className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            GigShield <span className="text-primary">Pro</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm">Login</Button>
          </Link>
          <Link to="/register">
            <Button size="sm" className="gradient-primary text-primary-foreground border-none">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 md:px-12 pt-20 pb-24 max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          <motion.div custom={0} variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold mb-8">
            <Activity className="w-3 h-3" /> AI-Powered Parametric Insurance
          </motion.div>

          <motion.h1 custom={1} variants={fadeUp} className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-foreground leading-[1.1] mb-6">
            Income Protection<br />
            <span className="text-primary">for Gig Partners</span>
          </motion.h1>

          <motion.p custom={2} variants={fadeUp} className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Automated, instant payouts when disruptions strike. No claims, no paperwork — just protection that works as fast as you do.
          </motion.p>

          <motion.div custom={3} variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="gradient-primary text-primary-foreground border-none shadow-glow px-8 text-base">
                Start Protection <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="border-border text-foreground px-8 text-base">
                View Dashboard
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="px-6 md:px-12 pb-24 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: CloudRain,
              title: 'Parametric Triggers',
              desc: 'Rain, heat waves, platform outages, curfews — your policy pays out automatically when conditions are met.',
            },
            {
              icon: Zap,
              title: 'Instant Payouts',
              desc: 'No claims adjusters, no delays. When a trigger activates, your compensation hits your wallet within minutes.',
            },
            {
              icon: TrendingUp,
              title: 'AI Risk Scoring',
              desc: 'Real-time risk assessment using weather, traffic, and disruption data to keep premiums fair and accurate.',
            },
          ].map((feat, i) => (
            <motion.div
              key={feat.title}
              custom={i + 4}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="p-6 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center mb-4">
                <feat.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{feat.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 md:px-12 pb-24 max-w-4xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: '1,240+', label: 'Active Policies' },
            { value: '₹12.4L', label: 'Payouts Disbursed' },
            { value: '<2min', label: 'Avg Payout Time' },
            { value: '99.8%', label: 'Uptime SLA' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl md:text-3xl font-black text-primary font-mono">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-12 py-8 border-t border-border/30 text-center">
        <p className="text-xs text-muted-foreground">
          © 2026 GigShield Pro — Parametric Insurance for the Gig Economy.
        </p>
      </footer>
    </div>
  );
}
