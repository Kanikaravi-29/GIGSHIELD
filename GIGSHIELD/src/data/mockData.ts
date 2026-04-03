export const MOCK_WORKERS = [
  { id: '1', name: 'Hebe John', email: 'hebe@mail.com', platform: 'Amazon', city: 'Chennai', zone: 'A4', dailyIncome: 1400, policyStatus: 'Active' as const, riskScore: 42 },
  { id: '2', name: 'Raj Kumar', email: 'raj@mail.com', platform: 'Flipkart', city: 'Mumbai', zone: 'B2', dailyIncome: 1200, policyStatus: 'Active' as const, riskScore: 65 },
  { id: '3', name: 'Priya Singh', email: 'priya@mail.com', platform: 'Amazon', city: 'Delhi', zone: 'C1', dailyIncome: 1600, policyStatus: 'Pending' as const, riskScore: 28 },
  { id: '4', name: 'Amit Patel', email: 'amit@mail.com', platform: 'Swiggy', city: 'Bangalore', zone: 'D3', dailyIncome: 1100, policyStatus: 'Active' as const, riskScore: 55 },
  { id: '5', name: 'Deepa Nair', email: 'deepa@mail.com', platform: 'Flipkart', city: 'Chennai', zone: 'A2', dailyIncome: 1300, policyStatus: 'Expired' as const, riskScore: 72 },
  { id: '6', name: 'Suresh Reddy', email: 'suresh@mail.com', platform: 'Amazon', city: 'Hyderabad', zone: 'E1', dailyIncome: 1500, policyStatus: 'Active' as const, riskScore: 38 },
  { id: '7', name: 'Meena Das', email: 'meena@mail.com', platform: 'Zomato', city: 'Kolkata', zone: 'F4', dailyIncome: 900, policyStatus: 'Active' as const, riskScore: 81 },
  { id: '8', name: 'Vikram Joshi', email: 'vikram@mail.com', platform: 'Amazon', city: 'Pune', zone: 'G2', dailyIncome: 1350, policyStatus: 'Pending' as const, riskScore: 47 },
];

export const MOCK_PAYOUTS = [
  { id: '1', workerName: 'Hebe John', date: 'Mar 12, 2026', reason: 'Heavy Rain Trigger', amount: 1120, status: 'Paid' as const },
  { id: '2', workerName: 'Raj Kumar', date: 'Mar 08, 2026', reason: 'Platform Outage', amount: 1400, status: 'Paid' as const },
  { id: '3', workerName: 'Deepa Nair', date: 'Mar 05, 2026', reason: 'Zone Curfew', amount: 960, status: 'Paid' as const },
  { id: '4', workerName: 'Amit Patel', date: 'Mar 02, 2026', reason: 'Heat Wave', amount: 780, status: 'Processing' as const },
  { id: '5', workerName: 'Meena Das', date: 'Feb 28, 2026', reason: 'Heavy Rain Trigger', amount: 650, status: 'Paid' as const },
];

export const RISK_HISTORY = [
  { day: 'Mon', risk: 12, loss: 140, coverage: 1120 },
  { day: 'Tue', risk: 45, loss: 520, coverage: 980 },
  { day: 'Wed', risk: 30, loss: 310, coverage: 1050 },
  { day: 'Thu', risk: 85, loss: 1100, coverage: 300 },
  { day: 'Fri', risk: 20, loss: 240, coverage: 1160 },
  { day: 'Sat', risk: 15, loss: 180, coverage: 1220 },
  { day: 'Sun', risk: 10, loss: 120, coverage: 1280 },
];

export const RISK_WEIGHTS = {
  rain: 15,
  heat: 10,
  outage: 25,
  curfew: 40,
};

export const AGGREGATE_RISK_DATA = [
  { month: 'Oct', avgRisk: 35, totalPayouts: 45000, policies: 890 },
  { month: 'Nov', avgRisk: 42, totalPayouts: 62000, policies: 920 },
  { month: 'Dec', avgRisk: 58, totalPayouts: 89000, policies: 1050 },
  { month: 'Jan', avgRisk: 48, totalPayouts: 71000, policies: 1120 },
  { month: 'Feb', avgRisk: 32, totalPayouts: 41000, policies: 1180 },
  { month: 'Mar', avgRisk: 40, totalPayouts: 55000, policies: 1240 },
];

export const CITIES = ['Chennai', 'Coimbatore', 'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Kolkata', 'Pune'];
export const PLATFORMS = ['Amazon', 'Flipkart'];
