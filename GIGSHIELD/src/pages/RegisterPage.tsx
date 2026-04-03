import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { CITIES, PLATFORMS } from '@/data/mockData';
import { toast } from 'sonner';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role, setRole] = useState<UserRole>('worker');
  const [form, setForm] = useState({
    name: '', email: '', platform: 'Amazon', registrationNumber: '', city: 'Chennai', zone: 'A4', dailyIncome: '1400', password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 0. Format Validation (only for workers)
      if (role === 'worker') {
        const prefix = form.platform === 'Amazon' ? 'AMZ-' : 'FLP-';
        if (!form.registrationNumber.toUpperCase().startsWith(prefix)) {
          toast.error('Invalid Registration Format', { description: `Number must start with ${prefix} for ${form.platform}` });
          setLoading(false);
          return;
        }
      }
      // 1. Sign Up
      const signupRes = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name || 'Anonymous',
          email: form.email,
          password: form.password,
          role,
          platform: form.platform,
          registrationNumber: form.registrationNumber,
          city: form.city,
          zone: form.zone,
          dailyIncome: Number(form.dailyIncome) || 1400,
        })
      });

      const signupData = await signupRes.json();
      if (!signupRes.ok) {
        toast.error('Registration Failed', { description: signupData.error });
        setLoading(false);
        return;
      }

      // 2. Auto Login to grab JWT and set context
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password })
      });

      const loginData = await loginRes.json();
      if (loginRes.ok) {
        login(loginData.user, loginData.token);
        toast.success('Account Created');
        navigate(role === 'admin' ? '/admin' : '/dashboard');
      } else {
        toast.error('Login Failed', { description: loginData.error });
      }

    } catch (err) {
      console.error(err);
      toast.error('Network Error', { description: 'Could not communicate with SQLite 3 backend.' });
    } finally {
      setLoading(false);
    }
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
            <button
              onClick={() => setRole('worker')}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${role === 'worker' ? 'gradient-primary text-primary-foreground shadow-glow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Delivery Partner
            </button>
            <button
              onClick={() => setRole('provider')}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${role === 'provider' ? 'gradient-primary text-primary-foreground shadow-glow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Platform Admin
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Name</label>
                <Input 
                  placeholder={role === 'worker' ? "Hebe John" : "admin"} 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                  className="bg-background border-border" 
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
                <Input 
                  type="email" 
                  placeholder={role === 'worker' ? "hebejohn@gmail.com" : "admin@platform.com"} 
                  value={form.email} 
                  onChange={(e) => setForm({ ...form, email: e.target.value })} 
                  className="bg-background border-border" 
                />
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
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Platform Registration Number</label>
                    <Input
                      placeholder={form.platform === 'Amazon' ? "AMZ-XXXXXX" : "FLP-XXXXXX"}
                      value={form.registrationNumber}
                      onChange={(e) => setForm({ ...form, registrationNumber: e.target.value.toUpperCase() })}
                      className="bg-background border-border"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Delivery Zone</label>
                    <Select value={form.zone} onValueChange={(v) => setForm({ ...form, zone: v })}>
                      <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2'].map((z) => (
                          <SelectItem key={z} value={z}>{z}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Avg. Daily Income (₹)</label>
                    <Input type="number" placeholder="1400" value={form.dailyIncome} onChange={(e) => setForm({ ...form, dailyIncome: e.target.value })} className="bg-background border-border" />
                  </div>
                </div>
              </>
            )}

            <div className="relative">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Password</label>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="bg-background border-border pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[32px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground border-none shadow-glow-sm">
              {loading ? 'Creating Account...' : <>Create Account <ArrowRight className="w-4 h-4 ml-1" /></>}
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
