import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth, UserRole } from '@/contexts/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role, setRole] = useState<UserRole>('worker');
  const [email, setEmail] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'admin') {
      login({ name: 'Admin User', email: email || 'admin@gigshield.com', platform: '', city: '', zone: '', dailyIncome: 0, role: 'admin' });
      navigate('/admin');
    } else {
      login({ name: 'Hebe John', email: email || 'hebe@mail.com', platform: 'Amazon', city: 'Chennai', zone: 'A4', dailyIncome: 1400, role: 'worker' });
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen gradient-surface flex items-center justify-center px-4">
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
          <h2 className="text-xl font-bold text-foreground mb-6 text-center">Sign In</h2>

          {/* Role Toggle */}
          <div className="flex rounded-lg bg-background p-1 mb-6">
            {(['worker', 'admin'] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
                  role === r
                    ? 'gradient-primary text-primary-foreground shadow-glow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {r === 'worker' ? 'Delivery Partner' : 'Insurance Provider'}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
              <Input
                type="email"
                placeholder={role === 'admin' ? 'admin@gigshield.com' : 'hebe@mail.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background border-border"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Password</label>
              <Input type="password" placeholder="••••••••" defaultValue="demo123" className="bg-background border-border" />
            </div>
            <Button type="submit" className="w-full gradient-primary text-primary-foreground border-none shadow-glow-sm">
              Sign In <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Don't have an account? <Link to="/register" className="text-primary hover:underline">Register</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
