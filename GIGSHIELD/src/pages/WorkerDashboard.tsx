import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck, AlertTriangle, CloudRain, ThermometerSun,
  MapPin, Zap, TrendingUp, Activity, LogOut, Info, Shield, Clock,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { RISK_HISTORY, RISK_WEIGHTS } from '@/data/mockData';
import DisruptionMap from '@/components/DisruptionMap';

type RiskTrigger = 'rain' | 'heat' | 'outage' | 'curfew';

const TRIGGER_META = [
  { id: 'rain' as const, label: 'Heavy Rain', icon: CloudRain },
  { id: 'heat' as const, label: 'Heat Wave', icon: ThermometerSun },
  { id: 'outage' as const, label: 'Platform Down', icon: AlertTriangle },
  { id: 'curfew' as const, label: 'Zone Curfew', icon: MapPin },
];

export default function WorkerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [dailyIncome, setDailyIncome] = useState(user?.dailyIncome || 1400);
  const [riskProbability, setRiskProbability] = useState(0.5);
  const [coverageFactor, setCoverageFactor] = useState(0.8);
  const [activeTriggers, setActiveTriggers] = useState<RiskTrigger[]>(['rain']);
  const [packageType, setPackageType] = useState<'basic' | 'standard' | 'premium'>('standard');
  const [isPolicyActive, setIsPolicyActive] = useState(false);

  const policyDates = useMemo(() => {
    const start = new Date();
    const end = new Date();
    end.setDate(start.getDate() + 7);
    const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${formatDate(start)} - ${formatDate(end)}`;
  }, []);

  const handleActivate = () => {
    setIsPolicyActive(true);
    toast.success("Policy activated successfully", {
      description: `Your ${packageType} coverage is now live until ${policyDates.split(' - ')[1]}.`,
    });
  };

  const riskScore = useMemo(() => {
    const base = 5;
    const triggerImpact = activeTriggers.reduce((acc, t) => acc + RISK_WEIGHTS[t], 0);
    return Math.min(triggerImpact + base, 100);
  }, [activeTriggers]);

  const weeklyPremium = useMemo(() => {
    const multiplier = packageType === 'premium' ? 0.08 : packageType === 'standard' ? 0.05 : 0.03;
    return (dailyIncome * riskProbability * coverageFactor * 7 * multiplier).toFixed(2);
  }, [dailyIncome, riskProbability, coverageFactor, packageType]);

  const coverageAmount = useMemo(() => {
    return (Number(weeklyPremium) * coverageFactor * 7).toFixed(2);
  }, [weeklyPremium, coverageFactor]);

  const predictedLoss = useMemo(() => {
    return (dailyIncome * riskScore / 100).toFixed(0);
  }, [dailyIncome, riskScore]);

  const potentialPayout = useMemo(() => {
    return (dailyIncome * coverageFactor).toFixed(2);
  }, [dailyIncome, coverageFactor]);

  const toggleTrigger = (t: RiskTrigger) => {
    setActiveTriggers((prev) =>
      prev.includes(t) ? prev.filter((i) => i !== t) : [...prev, t]
    );
  };

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="min-h-screen bg-background">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center px-4 md:px-8 py-4 border-b border-border/30">
        <div className="flex items-center gap-2">
          <div className="gradient-primary p-1.5 rounded-lg">
            <ShieldCheck className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            GigShield <span className="text-primary">Pro</span>
          </h1>
          <Badge variant="outline" className="ml-3 bg-card border-border text-success text-xs">
            <Activity className="w-3 h-3 mr-1" /> Live
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-3 md:mt-0">
          <span className="text-xs text-muted-foreground">{user?.name || 'Hebe John'} • {user?.city || 'Chennai'} {user?.zone || 'A4'}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Trust Message Strip */}
      <div className="bg-primary/5 border-b border-primary/10 px-8 py-2">
        <div className="flex items-center gap-2 text-[11px] text-primary/80 font-medium">
          <Info className="w-3.5 h-3.5" />
          <span>Claims are verified automatically using disruption and activity signals for fair payouts.</span>
        </div>
      </div>

      <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Controls */}
        <div className="lg:col-span-4 space-y-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Policy Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Daily Income */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium text-foreground">Daily Target Income</label>
                    <span className="text-primary font-mono font-bold">₹{dailyIncome}</span>
                  </div>
                  <Slider value={[dailyIncome]} onValueChange={(v) => setDailyIncome(v[0])} max={5000} min={500} step={100} />
                </div>

                {/* Risk Probability */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium text-foreground">Risk Probability</label>
                    <span className="text-primary font-mono font-bold">{riskProbability.toFixed(2)}</span>
                  </div>
                  <Slider value={[riskProbability * 100]} onValueChange={(v) => setRiskProbability(v[0] / 100)} max={100} step={5} />
                </div>

                {/* Coverage Factor */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium text-foreground">Coverage Level</label>
                    <span className="text-primary font-mono font-bold">{Math.round(coverageFactor * 100)}%</span>
                  </div>
                  <Slider value={[coverageFactor * 100]} onValueChange={(v) => setCoverageFactor(v[0] / 100)} max={100} step={5} />
                </div>

                {/* Package */}
                <div className="space-y-3 pt-4 border-t border-border">
                  <label className="text-sm font-medium text-foreground">Premium Package</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['basic', 'standard', 'premium'] as const).map((pkg) => (
                      <button
                        key={pkg}
                        onClick={() => setPackageType(pkg)}
                        className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
                          packageType === pkg
                            ? 'gradient-primary text-primary-foreground border-primary/50 shadow-glow-sm'
                            : 'bg-background border-border text-muted-foreground hover:border-primary/30'
                        }`}
                      >
                        {pkg}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Triggers */}
                <div className="space-y-3 pt-4 border-t border-border">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Zap className="w-4 h-4 text-warning" /> Active Risk Triggers
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {TRIGGER_META.map((trigger) => (
                      <button
                        key={trigger.id}
                        onClick={() => toggleTrigger(trigger.id)}
                        className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                          activeTriggers.includes(trigger.id)
                            ? 'bg-primary/10 border-primary/50 text-primary'
                            : 'bg-background border-border text-muted-foreground hover:border-muted-foreground/30'
                        }`}
                      >
                        <trigger.icon className="w-4 h-4" />
                        <span className="text-xs font-semibold">{trigger.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Premium Card */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <Card className="gradient-primary border-none overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <ShieldCheck className="w-24 h-24 -mr-8 -mt-8" />
              </div>
              <CardContent className="p-6 space-y-4 relative z-10">
                <div>
                  <p className="text-primary-foreground/70 text-[10px] font-bold uppercase tracking-widest mb-1">Estimated Weekly Premium</p>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-4xl font-black font-mono text-primary-foreground">₹{weeklyPremium}</h2>
                    <span className="text-primary-foreground/60 text-sm">/ week</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 py-3 border-t border-primary-foreground/20">
                  <div className="text-xs">
                    <p className="text-primary-foreground/70 text-[9px] uppercase font-bold">Selected Package</p>
                    <p className="font-bold text-primary-foreground capitalize">{packageType}</p>
                  </div>
                  <div className="text-xs">
                    <p className="text-primary-foreground/70 text-[9px] uppercase font-bold">Protection Level</p>
                    <p className="font-bold text-primary-foreground">{Math.round(coverageFactor * 100)}%</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-primary-foreground/20 flex justify-between items-center">
                  <div className="text-xs">
                    <p className="text-primary-foreground/70 text-[10px] uppercase font-bold">Instant Payout Trigger</p>
                    <p className="font-bold text-lg text-primary-foreground">₹{potentialPayout}</p>
                    <p className="text-[9px] text-primary-foreground/60 mt-0.5">
                      Active: {activeTriggers.map(t => TRIGGER_META.find(m => m.id === t)?.label).join(', ')}
                    </p>
                  </div>
                </div>
                
                <Button 
                  onClick={handleActivate}
                  disabled={isPolicyActive}
                  className={`w-full font-bold mt-2 shadow-lg transition-all ${
                    isPolicyActive 
                      ? 'bg-success text-success-foreground hover:bg-success cursor-default' 
                      : 'bg-primary-foreground text-primary hover:bg-primary-foreground/90'
                  }`}
                >
                  {isPolicyActive ? (
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" /> Policy Active
                    </span>
                  ) : (
                    "Activate Policy"
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right: Analytics */}
        <div className="lg:col-span-8 space-y-6">
          {/* Metrics */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard label="Real-time Risk Score" value={`${riskScore}%`} color={riskScore > 60 ? 'text-destructive' : 'text-success'} />
            <MetricCard label="Predicted Loss" value={`₹${predictedLoss}`} color="text-warning" />
            <MetricCard label="Coverage Amount" value={`₹${coverageAmount}`} color="text-primary" />
            <MetricCard label="Active Policies" value="1,240" color="text-primary" />
          </motion.div>

          {/* New Sections: Coverage & Claim Status */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Coverage Status Card */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4 text-success" /> Coverage Status
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase">Weekly Coverage</p>
                  <Badge className={`${isPolicyActive ? 'bg-success/20 text-success border-success/30' : 'bg-muted/20 text-muted-foreground border-border'} hover:none text-[10px]`}>
                    {isPolicyActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase">Policy Period</p>
                  <p className="text-xs font-bold">{isPolicyActive ? policyDates : 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase">Coverage Level</p>
                  <p className="text-xs font-bold">{isPolicyActive ? `${Math.round(coverageFactor * 100)}% Protection` : '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase">Trigger Protection</p>
                  <p className="text-xs font-bold">{isPolicyActive ? `${activeTriggers.length} Active Triggers` : '—'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Claim Status Card */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-warning" /> Claim Status
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase">Current Status</p>
                  <Badge variant="outline" className="border-warning text-warning text-[10px]">Under Review</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase">Trigger Reason</p>
                  <p className="text-xs font-bold">Heavy Rain (Mar 18)</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase">Estimated Payout</p>
                  <p className="text-xs font-bold text-success">₹{potentialPayout}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase">Last Update</p>
                  <p className="text-xs font-bold text-muted-foreground">2 hours ago</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-foreground">Risk vs. Income Protection Trend</CardTitle>
                <Tabs defaultValue="7d">
                  <TabsList className="bg-background border border-border">
                    <TabsTrigger value="7d" className="text-xs">7 Days</TabsTrigger>
                    <TabsTrigger value="30d" className="text-xs">30 Days</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={RISK_HISTORY}>
                    <defs>
                      <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(347, 77%, 60%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(347, 77%, 60%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" vertical={false} />
                    <XAxis dataKey="day" stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(217, 33%, 17%)', border: '1px solid hsl(217, 33%, 20%)', borderRadius: '8px', color: 'hsl(210, 40%, 98%)' }} />
                    <Area type="monotone" dataKey="risk" stroke="hsl(239, 84%, 67%)" fillOpacity={1} fill="url(#colorRisk)" strokeWidth={2} name="Risk %" />
                    <Area type="monotone" dataKey="loss" stroke="hsl(347, 77%, 60%)" fillOpacity={1} fill="url(#colorLoss)" strokeWidth={2} name="Loss ₹" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Map & Payouts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
              <Card className="bg-card border-border overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-foreground">Disruption Heatmap</CardTitle>
                </CardHeader>
                <CardContent>
                  <DisruptionMap activeTriggers={activeTriggers} />
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-foreground">Claim History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { date: 'Mar 12', type: 'Rain Trigger', amount: '₹1,120', status: 'Paid' },
                      { date: 'Mar 08', type: 'Platform Outage', amount: '₹1,400', status: 'Paid' },
                      { date: 'Mar 05', type: 'Zone Curfew', amount: '₹960', status: 'Paid' },
                    ].map((claim, i) => (
                      <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-background border border-border">
                        <div>
                          <p className="text-xs font-bold text-foreground">{claim.type}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                             <p className="text-[10px] text-muted-foreground">{claim.date}</p>
                             <span className="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
                             <p className="text-[10px] text-success font-semibold px-1 rounded bg-success/10">{claim.status}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-mono font-bold text-foreground">{claim.amount}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-5">
        <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
        <h3 className={`text-2xl font-mono font-bold ${color}`}>{value}</h3>
        <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" /> Real-time
        </p>
      </CardContent>
    </Card>
  );
}
