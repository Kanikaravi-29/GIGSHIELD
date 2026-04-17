# 🛡️ GigShield: AI-Powered Parametric Insurance for Gig Workers (Phase 3)

GigShield is an AI-powered parametric insurance platform designed to protect delivery workers in India’s gig economy from income loss caused by external disruptions such as heavy rain, extreme heat, curfews, warehouse outages, and delivery platform failures.

The platform implements a smart, transparent, and automated insurance system where workers receive weekly coverage and payouts are triggered automatically based on predefined disruption conditions, enhanced with AI-driven fraud detection and GPS validation.

---

## 🔗 Repository Link

[GIGSHIELD Repository](https://github.com/Kanikaravi-29/GIGSHIELD)

---

## 🎥 Demo Video

[Demo Video](https://www.youtube.com/watch?v=DtoDLq9JVos)

---

## 🌐 Try It Out

[Live Application](https://gigshield-iia9.onrender.com)

---

## 🚀 Phase 3: End-to-End Demo Flow (Fraud-Aware + Payout Simulation)

The GigShield platform demonstrates a complete intelligent parametric insurance flow:

1. User registers and logs in as a delivery partner  
2. User activates a weekly insurance policy (payment simulation)  
3. Premium is calculated dynamically based on income and risk  
4. System monitors disruption signals (or simulated triggers)  
5. Disruption event occurs (Rain / Heat / Platform Down / Curfew)  
6. System automatically triggers a claim  
7. GPS + Fraud Detection Engine evaluates the claim  
8. Fraud score (0–100) is generated  
9. Claim is classified as Low / Medium / High Risk  
10. Approved claims trigger instant payout simulation  
11. Worker dashboard updates with claim + payout status  
12. Admin dashboard reflects fraud insights and analytics  

This demonstrates a **fully automated, fraud-aware, zero-touch insurance system with instant payout simulation**.

---

## 🎯 Problem Statement

Delivery workers earn based on completed deliveries. When disruptions such as weather events, platform outages, or city restrictions occur, their income drops significantly.

Traditional insurance is:
- Slow  
- Manual  
- Not suited for daily earners  

GigShield solves this using:
- Parametric insurance  
- Automated triggers  
- Instant payout simulation  
- Fraud-aware verification  

---

## 👤 Target Persona

### Example: Ravi
- **City:** Chennai  
- **Platform:** Amazon  
- **Daily Income:** ₹1400  

### Scenario

If heavy rain or a platform outage occurs, Ravi cannot complete deliveries. GigShield automatically compensates him based on disruption triggers.

---

## ⚙️ Core Strategy

GigShield provides weekly income protection using:

- AI-driven risk analysis  
- Automated parametric triggers  
- Fraud-aware claim validation  
- Instant payout simulation  

---

## 🔄 Persona-Based Workflow

1. Worker Registration  
2. Risk Analysis  
3. Premium Calculation  
4. Policy Activation  
5. Disruption Monitoring  
6. Automatic Claim Trigger  
7. Fraud + GPS Verification  
8. Payout Processing  

---

## 💰 Weekly Premium Model

Premium depends on:

- Income  
- Zone risk  
- Disruption history  
- Claim probability  

### Why Weekly?

- Matches gig income cycle  
- Affordable  
- Flexible  

---

## ⚡ Parametric Triggers

- Heavy Rain  
- Heatwave  
- Platform Outage  
- Warehouse Disruption  
- Curfew  

### Benefits

- No manual claims  
- Instant processing  
- Transparent rules  

---

## 🧠 Phase 3 Implementation

### 1. Advanced Fraud Detection

#### Detection Layers

- **GPS Spoofing Detection**
  - Mock location detection (`isMocked`)
  - Impossible speed (> 200 km/h)
  - Sudden location jumps

- **City / Zone Validation**
  - Compares GPS vs registered city  
  - Flags mismatches  

- **Repeated Claim Detection**
  - Identifies abnormal claim patterns  

- **Income vs Payout Check**
  - Detects unrealistic claims  

---

### 2. AI-Based Fraud Scoring

Fraud Score Range: **0 – 100**

- Low score → Genuine  
- High score → Suspicious  

#### Features Used:
- GPS integrity  
- Movement patterns  
- City mismatch  
- Claim frequency  
- Income ratio  

---

### 3. Risk Classification

- **Low Risk (0–30)**  
  → Automatically Approved  

- **Medium Risk (31–70)**  
  → Allowed but flagged as moderately risky  

- **High Risk (71–100)**  
  → Blocked or flagged  

---

### 4. Payment & Payout Simulation

- Premium payment (simulation-ready for Razorpay)  
- Instant payout simulation on approval  
- Dashboard reflects payout instantly  

---

### 5. GPS & Location Validation

- Uses browser geolocation  
- Tracks real user position  
- Validates:
  - Movement continuity  
  - Distance from registered city  
  - Fraud signals  

---

## 🤖 AI / ML Integration

### Risk Score (Premium)
Risk = (weather + traffic + disruption) / 3  

### Fraud Score (NEW)
Based on:
- GPS  
- Speed  
- Claim patterns  
- Income ratio  

### Additional Capabilities

- Predictive alerts  
- Income loss estimation  
- Fraud pattern detection  

---

## 🛡️ System Behavior

- Every claim is validated  
- GPS is a critical verification layer  
- Fraud score determines outcome  
- Suspicious claims are flagged or blocked  

---

## 💡 Innovation

- Hyper-local insurance  
- GPS-based fraud detection  
- AI fraud scoring  
- Instant payout simulation  
- Zero-touch claims  

---

## 📈 Market Opportunity

Target users:
- Delivery workers  
- Logistics partners  
- Gig economy workforce  

### Value

- Workers → Income protection  
- Insurers → Fraud control  
- Platforms → Worker retention  

---

## 🛠️ Tech Stack

### Frontend
- Next.js  
- React  
- TypeScript  
- Tailwind CSS  

### Backend
- Node.js  
- Express.js  

### Database
- SQLite 3  

### Integrations
- Mapbox  
- JWT Auth  
- Mock APIs  
- Razorpay (simulation-ready)  

---

## 💾 Data Persistence

Stored data:

- Users  
- Policies  
- Claims  
- Triggers  
- Fraud scores  
- GPS validation  
- Payout records  

---

## 📊 Phase 3 Completion Status

✔ Registration & Authentication  
✔ Policy Management  
✔ Premium Calculation  
✔ Automated Claim Trigger  
✔ Fraud Detection Engine  
✔ GPS Anti-Spoofing  
✔ Instant Payout Simulation  
✔ SQLite Persistence  

---

## 🎯 End Goal

GigShield demonstrates a complete:

- AI-powered  
- Fraud-aware  
- GPS-validated  
- Parametric insurance system  

Designed for real-world scalability in the gig economy.

---

**GigShield — Protecting gig workers with intelligent, automated insurance.**
