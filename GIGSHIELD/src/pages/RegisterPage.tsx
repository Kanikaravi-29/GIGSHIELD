import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { CITIES, PLATFORMS } from '@/data/mockData';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role, setRole] = useState<UserRole>('worker');
  const [form, setForm] = useState({
    name: '', email: '', platform: 'Amazon', city: 'Chennai', zone: 'A4', dailyIncome: '1400',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({
      name: form.name || 'Hebe John',
      email: form.email || 'hebe@mail.com',
      platform: form.platform,
      city: form.city,
      zone: form.zone,
      dailyIncome: Number(form.dailyIncome) || 1400,
      role,
    });
    navigate(role === 'admin' ? '/admin' : '/dashboard');
  };

  return (
    <div className="min-h-screen gradient-surface flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="gradient-primary p-1.5 rounded-lg">
            <ShieldCheck className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">GigShield <span className="text-primary">Pro</span></span>
        </Link>

        <div className="p-6 rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-foreground mb-6 text-center">Create Account</h2>

          <div className="flex rounded-lg bg-background p-1 mb-6">
            {(['worker', 'admin'] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
                  role === r ? 'gradient-primary text-primary-foreground shadow-glow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {r === 'worker' ? 'Delivery Partner' : 'Insurance Provider'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Name</label>
                <Input placeholder="Hebe John" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-background border-border" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
                <Input type="email" placeholder="hebe@mail.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-background border-border" />
              </div>
            </div>

            {role === 'worker' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Platform</label>
                    <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
                      <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>{PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">City</label>
                    <Select value={form.city} onValueChange={(v) => setForm({ ...form, city: v })}>
                      <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>{CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Delivery Zone</label>
                    <Input placeholder="A4" value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} className="bg-background border-border" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Avg. Daily Income (₹)</label>
                    <Input type="number" placeholder="1400" value={form.dailyIncome} onChange={(e) => setForm({ ...form, dailyIncome: e.target.value })} className="bg-background border-border" />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Password</label>
              <Input type="password" placeholder="••••••••" className="bg-background border-border" />
            </div>

            <Button type="submit" className="w-full gradient-primary text-primary-foreground border-none shadow-glow-sm">
              Create Account <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
