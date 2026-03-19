import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck, Activity, LogOut, TrendingUp, Users, DollarSign, FileText, Search,
  Fingerprint, AlertCircle, Map, ClipboardCheck, ThumbsUp, ThumbsDown, CheckCircle2,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { MOCK_WORKERS, MOCK_PAYOUTS, AGGREGATE_RISK_DATA, CITIES, PLATFORMS } from '@/data/mockData';

export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [cityFilter, setCityFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<string | null>(null);

  const filteredWorkers = useMemo(() => {
    return MOCK_WORKERS.filter((w) => {
      if (cityFilter !== 'all' && w.city !== cityFilter) return false;
      if (platformFilter !== 'all' && w.platform !== platformFilter) return false;
      if (searchQuery && !w.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [cityFilter, platformFilter, searchQuery]);

  const selected = MOCK_WORKERS.find((w) => w.id === selectedWorker);

  const totalPolicies = MOCK_WORKERS.filter((w) => w.policyStatus === 'Active').length;
  const totalPayouts = MOCK_PAYOUTS.reduce((a, p) => a + p.amount, 0);
  const avgRisk = Math.round(MOCK_WORKERS.reduce((a, w) => a + w.riskScore, 0) / MOCK_WORKERS.length);

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center px-4 md:px-8 py-4 border-b border-border/30">
        <div className="flex items-center gap-2">
          <div className="gradient-primary p-1.5 rounded-lg">
            <ShieldCheck className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            GigShield <span className="text-primary">Admin</span>
          </h1>
          <Badge variant="outline" className="ml-3 bg-card border-border text-success text-xs">
            <Activity className="w-3 h-3 mr-1" /> Provider Portal
          </Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="mt-3 md:mt-0">
          <LogOut className="w-4 h-4 mr-1" /> Sign Out
        </Button>
      </header>

      <div className="p-4 md:p-8 space-y-6">
        {/* Overview Cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <OverviewCard icon={Users} label="Total Workers" value={String(MOCK_WORKERS.length)} color="text-primary" />
          <OverviewCard icon={FileText} label="Active Policies" value={String(totalPolicies)} color="text-success" />
          <OverviewCard icon={DollarSign} label="Total Payouts" value={`₹${totalPayouts.toLocaleString()}`} color="text-warning" />
          <OverviewCard icon={TrendingUp} label="Avg Risk Score" value={`${avgRisk}%`} color={avgRisk > 50 ? 'text-destructive' : 'text-success'} />
          <OverviewCard icon={AlertCircle} label="Suspicious" value="12" color="text-destructive" />
          <OverviewCard icon={ClipboardCheck} label="Review Queue" value="8" color="text-warning" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Workers Table */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-7">
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <CardTitle className="text-sm font-medium text-foreground">Worker Directory</CardTitle>
                  <div className="flex gap-2 flex-wrap">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 h-8 text-xs w-36 bg-background border-border"
                      />
                    </div>
                    <Select value={cityFilter} onValueChange={setCityFilter}>
                      <SelectTrigger className="h-8 text-xs w-28 bg-background border-border"><SelectValue placeholder="City" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Cities</SelectItem>
                        {CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={platformFilter} onValueChange={setPlatformFilter}>
                      <SelectTrigger className="h-8 text-xs w-28 bg-background border-border"><SelectValue placeholder="Platform" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Platforms</SelectItem>
                        {PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left py-2 font-medium">Name</th>
                        <th className="text-left py-2 font-medium">Platform</th>
                        <th className="text-left py-2 font-medium">Zone Match</th>
                        <th className="text-left py-2 font-medium">GPS Match</th>
                        <th className="text-center py-2 font-medium">Risk/Fraud</th>
                        <th className="text-center py-2 font-medium">Claim Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredWorkers.map((w) => (
                        <tr
                          key={w.id}
                          onClick={() => setSelectedWorker(w.id === selectedWorker ? null : w.id)}
                          className={`border-b border-border/50 cursor-pointer transition-colors hover:bg-background ${selectedWorker === w.id ? 'bg-primary/5' : ''}`}
                        >
                          <td className="py-2.5 font-semibold text-foreground">{w.name}</td>
                          <td className="py-2.5 text-muted-foreground">{w.platform}</td>
                          <td className="py-2.5">
                             <Badge variant="outline" className={`text-[9px] ${w.riskScore > 70 ? 'text-destructive border-destructive/30' : 'text-success border-success/30'}`}>
                                {w.riskScore > 70 ? 'Mismatch' : 'Matched'}
                             </Badge>
                          </td>
                          <td className="py-2.5">
                             <Badge variant="outline" className={`text-[9px] ${w.riskScore > 50 ? 'text-warning border-warning/30' : 'text-success border-success/30'}`}>
                                {w.riskScore > 50 ? 'Out of Sync' : 'Synced'}
                             </Badge>
                          </td>
                          <td className="py-2.5 text-center">
                             <Badge className={`text-[9px] border-none ${
                                w.riskScore > 75 ? 'bg-destructive/20 text-destructive' : 
                                w.riskScore > 40 ? 'bg-warning/20 text-warning' : 
                                'bg-success/20 text-success'
                             }`}>
                                {w.riskScore > 75 ? 'High Risk' : w.riskScore > 40 ? 'Medium' : 'Low Risk'}
                             </Badge>
                          </td>
                          <td className="py-2.5 text-center">
                            <Badge variant="outline" className={`text-[9px] ${
                              w.policyStatus === 'Active' ? 'text-success border-success/30' :
                              w.policyStatus === 'Pending' ? 'text-warning border-warning/30' :
                              'text-muted-foreground border-border'
                            }`}>
                              {w.policyStatus === 'Active' ? 'Approved' : 'Under Review'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right panel: Detail + Chart */}
          <div className="lg:col-span-5 space-y-6">
            {selected ? (
              <motion.div key={selected.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
                <Card className="bg-card border-border overflow-hidden">
                  <CardHeader className="border-b border-border/30 bg-primary/5">
                    <div className="flex justify-between items-center">
                       <CardTitle className="text-sm font-medium text-foreground">Verification Panel</CardTitle>
                       <Badge variant="secondary" className="text-[10px] font-bold">{selected.id}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-3 text-[11px]">
                        <DetailItem label="Full Name" value={selected.name} />
                        <DetailItem label="Platform Verified" value={selected.platform} />
                        <DetailItem label="City / Zone Match" value={`${selected.city} ${selected.zone}`} />
                        <DetailItem label="Historical Avg" value={`₹${selected.dailyIncome}`} />
                      </div>
                      
                      <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 space-y-3">
                         <div className="flex justify-between items-center">
                            <p className="text-[10px] uppercase font-bold text-destructive">Automated Fraud Score</p>
                            <span className="text-xl font-black font-mono text-destructive">{selected.riskScore}/100</span>
                         </div>
                         <div className="space-y-2">
                            <VerificationStep icon={CheckCircle2} label="Weather/Platform Trigger Verified" status="success" />
                            <VerificationStep icon={selected.riskScore > 60 ? AlertCircle : CheckCircle2} label="GPS Location Consistency" status={selected.riskScore > 60 ? 'warning' : 'success'} />
                            <VerificationStep icon={selected.riskScore > 75 ? AlertCircle : CheckCircle2} label="Activity Pattern Match" status={selected.riskScore > 75 ? 'danger' : 'success'} />
                            <VerificationStep icon={Fingerprint} label="Device Integrity Check" status="success" />
                         </div>
                      </div>

                      <div className="flex gap-2">
                         <Button size="sm" className="flex-1 bg-success hover:bg-success/90 text-success-foreground h-9 text-xs font-bold">
                            <ThumbsUp className="w-3.5 h-3.5 mr-1.5" /> Approve Claim
                         </Button>
                         <Button size="sm" variant="outline" className="flex-1 border-destructive text-destructive hover:bg-destructive/10 h-9 text-xs font-bold">
                            <ThumbsDown className="w-3.5 h-3.5 mr-1.5" /> Flag for Review
                         </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <Card className="bg-card border-border overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Fingerprint className="w-4 h-4 text-primary" /> Fraud Monitoring
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-6">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-background border border-border rounded-lg p-3">
                         <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">GPS Mismatch Alerts</p>
                         <p className="text-lg font-black font-mono text-warning">04</p>
                      </div>
                      <div className="bg-background border border-border rounded-lg p-3">
                         <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">High-Risk Claims</p>
                         <p className="text-lg font-black font-mono text-destructive">03</p>
                      </div>
                      <div className="bg-background border border-border rounded-lg p-3">
                         <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Inconsistent Activity</p>
                         <p className="text-lg font-black font-mono text-primary">05</p>
                      </div>
                      <div className="bg-background border border-border rounded-lg p-3">
                         <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Flagged Accounts</p>
                         <p className="text-lg font-black font-mono text-muted-foreground">02</p>
                      </div>
                   </div>
                </CardContent>
              </Card>
            )}

            {/* Aggregate Chart */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-foreground">Aggregate Risk & Payouts</CardTitle>
                </CardHeader>
                <CardContent className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={AGGREGATE_RISK_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" vertical={false} />
                      <XAxis dataKey="month" stroke="hsl(215, 20%, 65%)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(215, 20%, 65%)" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(217, 33%, 17%)', border: '1px solid hsl(217, 33%, 20%)', borderRadius: '8px', color: 'hsl(210, 40%, 98%)' }} />
                      <Bar dataKey="avgRisk" fill="hsl(239, 84%, 67%)" radius={[4, 4, 0, 0]} name="Avg Risk %" />
                      <Bar dataKey="totalPayouts" fill="hsl(160, 60%, 45%)" radius={[4, 4, 0, 0]} name="Total Payouts ₹" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Claims Management */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-foreground">Claims & Verification Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-2 font-medium">Worker Name</th>
                      <th className="text-left py-2 font-medium">Date</th>
                      <th className="text-left py-2 font-medium">Trigger Reason</th>
                      <th className="text-right py-2 font-medium">Amount</th>
                      <th className="text-center py-2 font-medium">Claim Status</th>
                      <th className="text-center py-2 font-medium">Fraud Check</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_PAYOUTS.map((p) => (
                      <tr key={p.id} className="border-b border-border/50">
                        <td className="py-2.5 font-semibold text-foreground">{p.workerName}</td>
                        <td className="py-2.5 text-muted-foreground">{p.date}</td>
                        <td className="py-2.5 text-muted-foreground">{p.reason}</td>
                        <td className="py-2.5 text-right font-mono font-bold text-success">₹{p.amount.toLocaleString()}</td>
                        <td className="py-2.5 text-center">
                          <Badge variant="outline" className={`text-[10px] ${p.status === 'Paid' ? 'text-success border-success/30' : 'text-warning border-warning/30'}`}>
                            {p.status === 'Paid' ? 'Approved' : 'Under Review'}
                          </Badge>
                        </td>
                        <td className="py-2.5 text-center">
                           <div className="flex items-center justify-center gap-1.5 text-[10px] text-success">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span className="font-bold uppercase tracking-tighter">Verified</span>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function OverviewCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center">
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={`text-xl font-mono font-bold ${color}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 rounded-lg bg-background border border-border">
      <p className="text-[9px] text-muted-foreground mb-0.5 uppercase font-bold">{label}</p>
      <p className="font-semibold text-foreground truncate">{value}</p>
    </div>
  );
}

function VerificationStep({ icon: Icon, label, status }: { icon: React.ElementType; label: string; status: 'success' | 'warning' | 'danger' }) {
   const colorClass = status === 'success' ? 'text-success' : status === 'warning' ? 'text-warning' : 'text-destructive';
   return (
      <div className="flex items-center justify-between text-[11px]">
         <div className="flex items-center gap-2 text-muted-foreground">
            <Icon className={`w-3.5 h-3.5 ${colorClass}`} />
            <span>{label}</span>
         </div>
         <span className={`font-bold capitalize ${colorClass}`}>{status === 'danger' ? 'Flagged' : status}</span>
      </div>
   );
}
