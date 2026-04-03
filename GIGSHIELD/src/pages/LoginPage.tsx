import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck, ArrowRight, Lock, Eye, EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role, setRole] = useState<UserRole>('worker');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Default placeholder bypass for quick demo if empty
    const targetEmail = email || (role === 'admin' ? 'admin@platform.com' : 'hebejohn@gmail.com');
    const targetPassword = password || 'demo123';

    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, password: targetPassword })
      });

      const data = await res.json();

      if (res.ok) {
        login(data.user, data.token);
        if (['admin', 'provider'].includes(data.user.role)) {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        toast.error('Authentication Failed', { description: data.error || 'Invalid credentials' });
      }
    } catch (err) {
      console.error(err);
      toast.error('Network Error', { description: 'Could not connect to SQLite 3 backend.' });
    } finally {
      setLoading(false);
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
                className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${role === r
                  ? 'gradient-primary text-primary-foreground shadow-glow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                {r === 'worker' ? 'Delivery Partner' : 'Platform Admin'}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
              <Input
                type="email"
                placeholder={role === 'admin' ? 'admin@platform.com' : 'hebejohn@gmail.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground ml-1">Password</label>
              <div className="relative group">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  className="pl-10 pr-10 h-11 bg-background/50 border-border"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground border-none shadow-glow-sm">
              {loading ? 'Authenticating...' : <>Sign In <ArrowRight className="w-4 h-4 ml-1" /></>}
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
