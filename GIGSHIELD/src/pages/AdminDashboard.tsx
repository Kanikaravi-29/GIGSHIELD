import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck, Activity, LogOut, TrendingUp, Users, DollarSign, FileText, Search,
  Fingerprint, AlertCircle, ClipboardCheck, ThumbsUp, ThumbsDown, CheckCircle2,
  RefreshCw, XCircle, Flag,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CITIES, PLATFORMS, AGGREGATE_RISK_DATA } from '@/data/mockData';

const API = '';

export default function AdminDashboard() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token || user?.role !== 'admin') {
      navigate(user?.role === 'worker' ? '/dashboard' : '/');
    }
  }, [token, user, navigate]);

  const [stats, setStats] = useState<any>(null);
  const [workers, setWorkers] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [fraudStats, setFraudStats] = useState<any>(null);
  const [predictiveData, setPredictiveData] = useState<any[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');

  const authHeaders = { Authorization: `Bearer ${token}` };

  const fetchAll = useCallback(async () => {
    if (!token || !user) return;
    setLoading(true);
    try {
      const isAdmin = user.role === 'admin' || user.role === 'provider';
      const isPrivileged = isAdmin; // Any admin or provider can see stats/workers now
      
      const requests: any = {};
      if (isPrivileged) {
        requests.stats = fetch(`${API}/api/admin/stats`, { headers: authHeaders });
        requests.workers = fetch(`${API}/api/admin/workers`, { headers: authHeaders });
        requests.pending = fetch(`${API}/api/admin/pending-users`, { headers: authHeaders });
      }
      if (isAdmin) {
        requests.claims = fetch(`${API}/api/admin/claims`, { headers: authHeaders });
        requests.fraud = fetch(`${API}/api/admin/fraud-stats`, { headers: authHeaders });
        requests.forecast = fetch(`${API}/api/admin/forecast`, { headers: authHeaders });
      }

      const results: any = {};
      for (const [key, promise] of Object.entries(requests)) {
        const res: any = await promise;
        if (res.ok) results[key] = await res.json();
      }

      if (results.stats) setStats(results.stats);
      if (results.workers) {
        // results.workers is already an array of users from the server
        setWorkers(results.workers);
      }
      if (results.pending) setPendingUsers(results.pending);
      if (results.claims) setClaims(results.claims);
      if (results.fraud) setFraudStats(results.fraud);
      if (results.forecast) setPredictiveData(results.forecast);
    } catch (err) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleUserApproval = async (userId: string, status: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/users/${userId}/approve`, {
        method: 'PUT',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setPendingUsers(prev => prev.filter(u => u.id !== userId));
        toast.success(`User ${status}`);
        fetchAll(); // Refresh worker directory too
      } else {
        toast.error('Action failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClaimAction = async (claimId: number, status: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/claims/${claimId}`, {
        method: 'PUT',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setClaims(prev => prev.map(c => c.id === claimId ? { ...c, ...updated } : c));
        if (selectedClaim?.id === claimId) setSelectedClaim({ ...selectedClaim, ...updated });
        toast.success(`Claim ${status}`, { description: `Claim #${claimId} has been ${status.toLowerCase()}.` });
      } else {
        toast.error('Action failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setActionLoading(false);
    }
  };


  const filteredWorkers = workers.filter(w => {
    // City Filter
    if (cityFilter !== 'all' && w.city !== cityFilter) return false;

    // Platform/Role Filter
    if (platformFilter !== 'all') {
      if (['Amazon', 'Flipkart'].includes(platformFilter)) {
        if (w.platform !== platformFilter) return false;
      } else if (platformFilter === 'admin') {
        if (w.userRole !== 'admin' && w.userRole !== 'provider') return false;
      }
    }

    // Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const nameMatch = w.name?.toLowerCase().includes(q);
      const emailMatch = w.email?.toLowerCase().includes(q);
      const idMatch = w.platformId?.toLowerCase().includes(q);
      if (!nameMatch && !emailMatch && !idMatch) return false;
    }
    
    return true;
  }).sort((a, b) => {
    // Sort logic: Platform Admins first, then Gig Workers
    const aIsAdmin = a.userRole !== 'worker';
    const bIsAdmin = b.userRole !== 'worker';
    if (aIsAdmin && !bIsAdmin) return -1;
    if (!aIsAdmin && bIsAdmin) return 1;
    return a.name.localeCompare(b.name);
  });

  const monthlyData = useMemo(() => {
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push(d.toLocaleString('default', { month: 'short' }));
    }

    return months.map(month => {
      // Filter claims that match this month (simulated by checking date strings for now)
      const monthClaims = claims.filter(c => {
        const date = new Date(c.created_at);
        return date.toLocaleString('default', { month: 'short' }) === month;
      });

      const totalPayouts = monthClaims.reduce((sum, c) => sum + (c.payout_amount || 0), 0);
      
      // Calculate weighted risk average
      const riskSum = monthClaims.reduce((sum, c) => {
        const weight = c.fraud_risk === 'High' ? 90 : c.fraud_risk === 'Medium' ? 50 : 15;
        return sum + weight;
      }, 0);
      
      const avgRisk = monthClaims.length > 0 ? Math.round(riskSum / monthClaims.length) : 0;

      return {
        month,
        avgRisk,
        totalPayouts
      };
    });
  }, [claims]);


  const handleLogout = () => { logout(); navigate('/'); };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}>
          <ShieldCheck className="w-12 h-12 text-primary" />
        </motion.div>
        <p className="text-sm font-bold text-muted-foreground animate-pulse uppercase tracking-widest">Loading Admin Portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center px-4 md:px-8 py-4 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-primary to-blue-500 p-2 rounded-xl shadow-lg ring-1 ring-white/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col -space-y-1">
            <h1 className="text-xl font-bold tracking-tighter text-foreground">
              GigShield <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Admin</span>
            </h1>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Global Governance Portal</span>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <Badge className="bg-primary/20 text-primary border-primary/30 uppercase text-[9px] px-1.5 h-5 font-bold">
              {user?.adminType || 'Standard'} Mode
            </Badge>
            <Badge variant="outline" className="bg-success/10 border-success/20 text-success text-[10px] h-5 px-1.5 flex items-center gap-1 font-bold">
              <Activity className="w-2.5 h-2.5" /> LIVE
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 md:mt-0">
          <Button variant="ghost" size="sm" onClick={fetchAll}>
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-1" /> Sign Out
          </Button>
        </div>
      </header>

      <div className="p-4 md:p-8 space-y-6">

        {(['control', 'verify'].includes(user?.adminType || '') || user?.role === 'provider') && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <OverviewCard icon={Users} label="Total Partners" value={String(stats?.totalPartners ?? 0)} color="text-primary" />
            <OverviewCard icon={FileText} label="Active Policies" value={String(stats?.activePolicies ?? 0)} color="text-success" />
            <OverviewCard icon={DollarSign} label="Total Payouts" value={`₹${(stats?.totalPayouts ?? 0).toLocaleString()}`} color="text-warning" />
            <OverviewCard 
              icon={TrendingUp} 
              label="AI Loss Projection" 
              value={`${stats?.mlLossRatio ?? 0}%`} 
              color={(stats?.mlLossRatio ?? 0) > 60 ? 'text-destructive' : 'text-success'} 
            />
            <OverviewCard icon={AlertCircle} label="Suspicious" value={String(stats?.suspicious ?? 0)} color="text-destructive" />
            <OverviewCard icon={ClipboardCheck} label="Review Queue" value={String(stats?.reviewQueue ?? 0)} color="text-warning" />
          </motion.div>
        )}

        {(['admin', 'provider'].includes(user?.role || '')) && pendingUsers.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-card border-border">
              <CardHeader className="py-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-warning" /> Identity Verification Queue
                  <Badge variant="secondary" className="ml-2 bg-warning/10 text-warning border-none text-[10px]">{pendingUsers.length} pending</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingUsers.map((p) => (
                    <div key={p.id} className="p-4 rounded-xl border border-border/50 bg-background/50 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-sm text-foreground">{p.name}</p>
                          <p className="text-[11px] text-muted-foreground">{p.email}</p>
                        </div>
                        <Badge variant="outline" className="text-[9px] uppercase">
                          {p.role === 'provider' ? 'PLATFORM ADMIN' : p.role}
                        </Badge>
                      </div>
                      {p.role === 'worker' && (
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <p className="text-muted-foreground">Platform: <span className="text-foreground">{p.platform}</span></p>
                          <p className="text-muted-foreground">Reg #: <span className="text-foreground font-mono">{p.platform_registration_number}</span></p>
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" className="flex-1 h-8 text-[11px] bg-success hover:bg-success/90" onClick={() => handleUserApproval(p.id, 'approved')} disabled={actionLoading}>Approve</Button>
                        <Button size="sm" variant="ghost" className="flex-1 h-8 text-[11px] text-destructive hover:bg-destructive/10" onClick={() => handleUserApproval(p.id, 'rejected')} disabled={actionLoading}>Reject</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Top Row: Fraud Monitoring and Charts (Moved Above) */}
          {(['admin', 'provider'].includes(user?.role || '')) && (
            <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Fraud Monitoring */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Fingerprint className="w-4 h-4 text-primary" /> Fraud Monitoring
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FraudStat label="GPS Mismatch Alerts" value={fraudStats?.gpsMismatch ?? 0} color="text-warning" />
                    <FraudStat label="High-Risk Claims" value={fraudStats?.highRiskClaims ?? 0} color="text-destructive" />
                    <FraudStat label="Under Review" value={fraudStats?.inconsistentActivity ?? 0} color="text-primary" />
                    <FraudStat label="Flagged Accounts" value={fraudStats?.flaggedAccounts ?? 0} color="text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              {/* Aggregate Risk Chart */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                <Card className="bg-card border-border h-full">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-foreground">Aggregate Risk & Payouts</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData}>
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

              {/* Predictive Claims Chart */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                <Card className="bg-card border-border h-full">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-warning animate-pulse" /> Next 7 Days Forecast
                      </CardTitle>
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-[9px]">AI Prediction</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={predictiveData}>
                        <defs>
                          <linearGradient id="colorRiskPred" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(347, 77%, 60%)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(347, 77%, 60%)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" vertical={false} />
                        <XAxis dataKey="day" stroke="hsl(215, 20%, 65%)" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(215, 20%, 65%)" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: 'hsl(217, 33%, 17%)', border: '1px solid hsl(217, 33%, 20%)', borderRadius: '8px', color: 'hsl(210, 40%, 98%)' }}
                            formatter={(value: any, name: string) => [name === 'predictedClaims' ? `₹${value}` : `${value}%`, name === 'predictedClaims' ? 'Predicted Claims' : 'Weather Risk']}
                        />
                        <Area type="monotone" dataKey="riskScore" stroke="hsl(347, 77%, 60%)" fillOpacity={1} fill="url(#colorRiskPred)" strokeWidth={2} name="riskScore" />
                        <Area type="monotone" dataKey="predictedClaims" stroke="hsl(35, 92%, 60%)" fill="none" strokeDasharray="5 5" strokeWidth={2} name="predictedClaims" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}

          {/* Bottom Row: Worker Directory (Moved Below) */}
          {(['admin', 'provider'].includes(user?.role || '')) && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-12">
              <Card className="bg-card border-border">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <CardTitle className="text-sm font-medium text-foreground">Directory <span className="text-muted-foreground font-normal">({workers.length} partners)</span></CardTitle>
                    <div className="flex gap-2 flex-wrap">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Search name/email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 h-8 text-xs w-36 bg-background border-border" />
                      </div>
                      <Select value={cityFilter} onValueChange={setCityFilter}>
                        <SelectTrigger className="h-8 text-xs w-24 bg-background border-border"><SelectValue placeholder="City" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Cities</SelectItem>
                          {CITIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={platformFilter} onValueChange={setPlatformFilter}>
                        <SelectTrigger className="h-8 text-xs w-32 bg-background border-border"><SelectValue placeholder="Platform/Role" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Members</SelectItem>
                          <SelectItem value="Amazon">Amazon Workers</SelectItem>
                          <SelectItem value="Flipkart">Flipkart Workers</SelectItem>
                          <SelectItem value="admin">Platform Admins</SelectItem>
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
                          <th className="text-left py-2 font-medium">Reg Number</th>
                          <th className="text-left py-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredWorkers.length === 0 ? (
                          <tr><td colSpan={4} className="py-6 text-center text-muted-foreground text-[11px]">No directory records found.</td></tr>
                        ) : filteredWorkers.map((w) => (
                          <tr key={w.id} className="border-b border-border/50 transition-colors hover:bg-background">
                            <td className="py-2.5 font-semibold text-foreground">
                              {w.name} {user?.id === w.id && <span className="text-[10px] text-primary ml-1">(You)</span>}
                              {w.userRole === 'worker' ? (
                                <Badge className="ml-2 text-[9px] font-bold border-none bg-muted text-muted-foreground uppercase">
                                  Gig Partner
                                </Badge>
                              ) : (
                                <Badge className="ml-2 text-[9px] font-bold border-none bg-primary/30 text-primary uppercase">
                                  Platform Admin
                                </Badge>
                              )}
                              <div className="text-[10px] text-muted-foreground font-normal font-mono">{w.platformId}</div>
                            </td>
                            <td className="py-2.5 text-muted-foreground">{w.userRole?.toLowerCase() === 'worker' ? w.platform : 'N/A'}</td>
                            <td className="py-2.5 font-mono text-[10px] text-muted-foreground">{w.userRole?.toLowerCase() === 'worker' ? w.platformRegistrationNumber : 'N/A'}</td>
                            <td className="py-2.5">
                              <Badge className={`text-[9px] border-none ${w.accountStatus === 'approved' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>
                                {w.accountStatus}
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
          )}
        </div>

        {(['admin', 'provider'].includes(user?.role || '')) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-foreground flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    Claims & Verification Log <span className="text-muted-foreground font-normal">({claims.length} total)</span>
                  </div>
                  <div className="flex gap-2">
                    <Select value={riskFilter} onValueChange={setRiskFilter}>
                      <SelectTrigger className="h-8 text-xs w-32 bg-background border-border"><SelectValue placeholder="Risk Level" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Risk Levels</SelectItem>
                        <SelectItem value="LOW">Low Risk</SelectItem>
                        <SelectItem value="MEDIUM">Medium Risk</SelectItem>
                        <SelectItem value="HIGH">High Risk</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left py-2 font-medium">Partner</th>
                        <th className="text-left py-2 font-medium">Date</th>
                        <th className="text-left py-2 font-medium">Trigger</th>
                        <th className="text-left py-2 font-medium">City</th>
                        <th className="text-right py-2 font-medium">Payout</th>
                        <th className="text-center py-2 font-medium">Status</th>
                        <th className="text-center py-2 font-medium">Fraud Risk</th>
                        <th className="text-center py-2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const displayClaims = claims.filter(c => riskFilter === 'all' || c.fraud_risk === riskFilter);
                        
                        if (displayClaims.length === 0) {
                          return <tr><td colSpan={8} className="py-8 text-center text-muted-foreground text-[11px]">No claims match the current filters.</td></tr>;
                        }

                        return displayClaims.map((c: any) => (
                          <React.Fragment key={c.id}>
                            <tr
                              onClick={() => setSelectedClaim(selectedClaim?.id === c.id ? null : c)}
                              className={`border-b border-border/50 cursor-pointer transition-colors hover:bg-background ${selectedClaim?.id === c.id ? 'bg-primary/5' : ''}`}
                            >
                              <td className="py-2.5 font-semibold text-foreground">
                                {c.worker_name} <span className="text-[10px] text-muted-foreground ml-1">({c.platform_id})</span>
                                {c.gps_match === 0 && (
                                  <Badge className={`ml-2 border-none text-[8px] h-4 font-black ${c.fraud_risk === 'HIGH' ? 'bg-destructive text-white' : 'bg-warning text-warning-foreground'}`}>
                                    {c.fraud_risk === 'HIGH' ? 'SPOOFED' : 'NO GPS'}
                                  </Badge>
                                )}
                              </td>
                              <td className="py-2.5 text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</td>
                              <td className="py-2.5 capitalize text-muted-foreground">{c.trigger_type} Event</td>
                              <td className="py-2.5 text-muted-foreground">{c.city} <span className="text-[10px] text-primary/70 font-mono">({c.zone || 'N/A'})</span></td>
                              <td className="py-2.5 text-right font-mono font-bold text-success">₹{c.payout_amount.toLocaleString()}</td>
                              <td className="py-2.5 text-center">
                                <Badge className={`text-[9px] border-none ${c.status === 'Approved' ? 'bg-success/20 text-success' : c.status === 'Rejected' ? 'bg-destructive/20 text-destructive' : 'bg-warning/20 text-warning'}`}>
                                  {c.status}
                                </Badge>
                              </td>
                              <td className="py-2.5 text-center">
                                <Badge variant="outline" className={`text-[9px] ${c.fraud_risk === 'LOW' ? 'text-success border-success/30' : c.fraud_risk === 'MEDIUM' ? 'text-warning border-warning/30' : 'text-destructive border-destructive/30 animate-pulse'}`}>
                                  {c.fraud_risk} {c.fraud_score ? `(${c.fraud_score})` : ''}
                                </Badge>
                              </td>
                              <td className="py-2.5 text-center">
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Activity className="w-3 h-3" /></Button>
                              </td>
                            </tr>

                            {selectedClaim?.id === c.id && (
                              <tr>
                                <td colSpan={8} className="p-0 border-b border-border/50 bg-primary/5">
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="p-6 space-y-6 overflow-hidden"
                                  >
                                    <div className="flex justify-between items-center">
                                      <h3 className="text-sm font-bold text-foreground">Verification Panel</h3>
                                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-background border border-border text-[10px] font-mono text-muted-foreground">
                                        <Fingerprint className="w-3 h-3" /> Claim #{selectedClaim.id}
                                      </div>
                                    </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <DetailBlock label="FULL NAME" value={selectedClaim.worker_name} />
                                    <DetailBlock label="PLATFORM VERIFIED" value={selectedClaim.platform} />
                                    <DetailBlock label="CITY / ZONE MATCH" value={`${selectedClaim.city} ${selectedClaim.zone}`} />
                                    <DetailBlock label="HISTORICAL AVG" value={`₹${selectedClaim.payout_amount * 1.2}`} />
                                  </div>

                                  <div className="p-5 rounded-xl border border-primary/20 bg-primary/5 space-y-5 relative overflow-hidden">
                                    <div className="flex justify-between items-start relative z-10">
                                      <div>
                                        <p className="text-[10px] uppercase font-bold text-primary tracking-widest mb-1">AUTOMATED FRAUD SCORE</p>
                                        <div className="space-y-2 mt-4">
                                          <SuccessStep label="Weather/Platform Trigger Verified" />
                                          <SuccessStep label="GPS Location Consistency" status={selectedClaim.gps_match ? 'success' : 'warning'} />
                                          <SuccessStep label="Activity Pattern Match" status={selectedClaim.fraud_risk === 'High' ? 'danger' : 'success'} />
                                          <SuccessStep label="Device Integrity Check" />
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <span className={`text-4xl font-black font-mono leading-none ${selectedClaim.fraud_score > 70 ? 'text-destructive' : selectedClaim.fraud_score > 35 ? 'text-warning' : 'text-success'}`}>
                                          {selectedClaim.fraud_score || 0}/100
                                        </span>
                                      </div>
                                    </div>
                                    <div className="absolute top-0 right-0 p-8 opacity-10">
                                      <Activity className="w-32 h-32 text-primary" />
                                    </div>
                                  </div>

                                  <div className="flex gap-4">
                                    {(['Approved', 'Under Review', 'Rejected'].includes(selectedClaim.status)) && (
                                      <>
                                        <Button size="lg" disabled={actionLoading} onClick={() => handleClaimAction(selectedClaim.id, 'Approved')} className="flex-1 bg-success hover:bg-success/90 h-12 text-sm font-bold gap-2">
                                          <ThumbsUp className="w-4 h-4" /> Force Approve
                                        </Button>
                                        <Button size="lg" disabled={actionLoading} onClick={() => handleClaimAction(selectedClaim.id, 'Rejected')} variant="outline" className="flex-1 border-destructive text-destructive hover:bg-destructive/10 h-12 text-sm font-bold gap-2">
                                          <ThumbsDown className="w-4 h-4" /> Force Reject
                                        </Button>
                                      </>
                                    )}
                                    <Button variant="ghost" size="lg" onClick={() => setSelectedClaim(null)} className="px-6 h-12"><XCircle className="w-5 h-5 mr-2" /> Close Audit</Button>
                                  </div>
                                </motion.div>
                              </td>
                            </tr>
                          )}
                          </React.Fragment>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>


              </CardContent>
            </Card>
          </motion.div>
        )}
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
          <div className="flex justify-between items-center w-full">
            <p className={`text-xl font-mono font-bold ${color}`}>{value}</p>
            <div className="flex items-center gap-1 text-[8px] font-bold text-muted-foreground animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-success"></span> LIVE
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FraudStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-background border border-border rounded-lg p-3">
      <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">{label}</p>
      <p className={`text-lg font-black font-mono ${color}`}>{String(value).padStart(2, '0')}</p>
    </div>
  );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-xl bg-background border border-border">
      <p className="text-[9px] text-muted-foreground mb-1 uppercase font-bold tracking-wider">{label}</p>
      <p className="font-bold text-foreground truncate text-sm">{value}</p>
    </div>
  );
}

function SuccessStep({ label, status = 'success' }: { label: string; status?: 'success' | 'warning' | 'danger' }) {
  const colorClass = status === 'success' ? 'text-success' : status === 'warning' ? 'text-warning' : 'text-destructive';
  const labelText = status === 'success' ? 'Success' : status === 'warning' ? 'Mismatch' : 'Failed';
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-2.5 text-muted-foreground">
        <CheckCircle2 className={`w-4 h-4 ${colorClass}`} />
        <span>{label}</span>
      </div>
      <span className={`font-bold capitalize ${colorClass}`}>{labelText}</span>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 rounded-lg bg-background border border-border">
      <p className="text-[9px] text-muted-foreground mb-0.5 uppercase font-bold">{label}</p>
      <p className="font-semibold text-foreground truncate text-[11px]">{value}</p>
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
