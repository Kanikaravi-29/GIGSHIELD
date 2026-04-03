import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

export type TriggerType = 'rain' | 'heat' | 'outage' | 'curfew';

export interface Claim {
  id: string;
  user_id: string;
  worker_name?: string;
  created_at: string;
  trigger_type: string;
  payout_amount: number;
  status: 'Under Review' | 'Approved' | 'Paid' | 'Rejected' | 'Flagged';
  gps_match: boolean;
  fraud_risk: string;
  zone?: string;
}

interface DemoContextType {
  isPolicyActive: boolean;
  setIsPolicyActive: (val: boolean) => void;
  activeTriggers: TriggerType[];
  setActiveTriggers: React.Dispatch<React.SetStateAction<TriggerType[]>>;
  demoClaims: Claim[];
  setDemoClaims: React.Dispatch<React.SetStateAction<Claim[]>>;
  activatePolicyAPI: (packageType: string, coverageLevel: number, premium: number, selectedTriggers: TriggerType[], riskProbability: number) => Promise<void>;
  triggerDisruption: (type: TriggerType, amount: number, workerName: string, zone?: string) => Promise<void>;
  fetchUserClaims: () => Promise<void>;
  fetchAllClaims: () => Promise<Claim[]>;
  fetchUserPolicy: () => Promise<void>;
}

const DemoContext = createContext<DemoContextType>({
  isPolicyActive: false,
  setIsPolicyActive: () => {},
  activeTriggers: [],
  setActiveTriggers: () => {},
  demoClaims: [],
  setDemoClaims: () => {},
  activatePolicyAPI: async () => {},
  triggerDisruption: async () => {},
  fetchUserClaims: async () => {},
  fetchAllClaims: async () => [],
  fetchUserPolicy: async () => {},
});

export const useDemo = () => useContext(DemoContext);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isPolicyActive, setIsPolicyActive] = useState(false);
  const [activeTriggers, setActiveTriggers] = useState<TriggerType[]>([]);
  const [demoClaims, setDemoClaims] = useState<Claim[]>([]);
  const { user, token } = useAuth();

  const fetchUserPolicy = async () => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:3001/api/policy/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIsPolicyActive(!!data);
        if (data && data.selected_triggers) {
          setActiveTriggers(data.selected_triggers.split(',') as TriggerType[]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch policy', error);
    }
  };

  const fetchUserClaims = async () => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:3001/api/claims/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDemoClaims(data);
      }
    } catch (error) {
      console.error('Failed to fetch claims', error);
    }
  };

  const fetchAllClaims = async () => {
    if (!token) return [];
    try {
      const res = await fetch(`http://localhost:3001/api/claims`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (error) {
      console.error('Failed to fetch all claims', error);
    }
    return [];
  };

  const activatePolicyAPI = async (packageType: string, coverageLevel: number, premium: number, selectedTriggers: TriggerType[], riskProbability: number) => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:3001/api/policy/activate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          packageType, 
          coverage_level: coverageLevel, 
          premium,
          selected_triggers: selectedTriggers,
          risk_probability: riskProbability
        })
      });
    if (res.ok) {
        setIsPolicyActive(true);
        setActiveTriggers(selectedTriggers);
        await fetchUserPolicy(); // Force sync with DB immediately
      } else {
        toast.error("Failed to save policy to Database");
      }
    } catch (err) {
      console.error(err);
      toast.error("Connection to Database Failed");
    }
  };

  const triggerDisruption = async (type: TriggerType, amount: number, workerName: string, zone?: string) => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:3001/api/trigger', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ trigger_type: type, zone })
      });

      const data = await res.json();

      if (res.ok) {
        if (data.claim) {
          // Instantly prepend the new claim so the UI updates without reload
          const newClaim = {
            ...data.claim,
            created_at: data.claim.created_at || new Date().toISOString()
          };
          setDemoClaims(prev => [newClaim, ...prev]);
          toast.success("Disruption detected → Claim generated successfully", {
            description: `₹${data.claim.payout_amount} approved for "${type}" trigger.`,
          });
        } else if (isPolicyActive) {
          toast.info("Disruption logged", {
            description: `"${type}" is not in your covered triggers. Activate a policy that includes it.`
          });
        } else {
          toast.error("No Active Policy", {
            description: "Activate a policy first to generate claims automatically."
          });
        }
        // Always re-sync claims from DB after any trigger
        await fetchUserClaims();
      } else {
        toast.error("Trigger Failed", { description: data.error || "Unknown server error" });
      }
    } catch (err) {
      console.error(err);
      toast.error("Connection Failed", { description: "Could not reach the backend." });
    }
  };

  useEffect(() => {
    if (user?.role === 'worker') {
      fetchUserPolicy();
      fetchUserClaims();
    }
  }, [user]);

  return (
    <DemoContext.Provider value={{
      isPolicyActive, setIsPolicyActive,
      activeTriggers, setActiveTriggers,
      demoClaims, setDemoClaims, activatePolicyAPI, triggerDisruption,
      fetchUserClaims, fetchAllClaims, fetchUserPolicy
    }}>
      {children}
    </DemoContext.Provider>
  );
}
