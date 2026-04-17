# 🛡️ GigShield PRO — AI-Powered Parametric Insurance

GigShield PRO is a state-of-the-art parametric insurance platform designed for e-commerce delivery partners. By eliminating the traditional claims process and leveraging AI for fraud detection and risk assessment, GigShield provides instant financial protection against environmental and platform disruptions.

---

## 🔗 Repository Link
[GIGSHIELD PRO Repository](https://github.com/Kanikaravi-29/GIGSHIELD)

## 🎥 Demo Video
[Demo Video](https://www.youtube.com/watch?v=DtoDLq9JVos)

## 🌐 Try It Out
[Live App](https://gigshield-iia9.onrender.com)

---

## RazorPay Demo Credentials

cards -> Add a New Card 
        Card Number : 4386 2894 0766 0153
        CVV : 123
        otp : 123456/1234

---

## 🚀 Phase 3: End-to-End Intelligent Flow

GigShield PRO demonstrates a complete **AI-driven, fraud-aware parametric insurance workflow**:

1. User registers and logs in as a delivery partner  
2. User activates a weekly insurance policy (Razorpay / simulation)  
3. Premium is calculated dynamically based on income + risk  
4. System monitors disruption signals (or simulated triggers)  
5. Disruption event occurs (Rain / Heat / Platform Down / Curfew)  
6. Claim is automatically triggered  
7. GPS + Fraud Engine evaluates authenticity  
8. Fraud Score (0–100) is generated  
9. Claim is classified as LOW / HIGH risk  
10. Approved claims trigger instant payout simulation  
11. Worker dashboard updates with claim + payout  
12. Admin dashboard reflects fraud analytics  

---

## 🛰️ Phase 3: The Intelligence Layer

GigShield PRO introduces a **fully automated AI ecosystem** with real-time verification and fraud prevention.

---

### 🧠 1. Neural Fraud Engine (TensorFlow.js)

A 3-layer deep learning model evaluates claims in milliseconds.

#### Input Features:
- GPS speed & trajectory
- Mock location detection (`isMocked`)
- City mismatch (Haversine distance)
- Payout-to-income ratio
- Claim frequency
- Device integrity signals

#### Decision Logic:
- **LOW (0–30)** → ✅ Auto Approved  
- **HIGH (31–100)** → ❌ Rejected / Fraud Flag  

---

### 🛰️ 2. Advanced GPS Anti-Spoofing System

Multi-layer GPS validation ensures authenticity:

#### ✔ Hardware-Level Detection
- Detects mock location using `isMocked` flag

#### ✔ Trajectory Analysis
- Haversine distance calculation
- Speed > 200 km/h → flagged as impossible

#### ✔ Teleportation Detection
- >10 km jump in <60 seconds → flagged

#### ✔ City Validation (Geofencing)
- Worker must be within registered city range
- Outside zone → flagged as mismatch

#### ✔ 200km Haversine Rule
- If user is far from registered city → treated as fraud

---

### 💳 3. Razorpay Integration & Payout Simulation

#### Premium Payment (Worker Side)
- Razorpay Checkout used for policy activation

#### Instant Payout Simulation
- Approved claims trigger simulated payout
- Reflected instantly in dashboard

> ⚠️ Note: Real payout APIs are not required. Simulation is sufficient for demo.

---

### 🗺️ 4. Real-Time Disruption Map

- Live GPS tracking using `navigator.geolocation`
- “You are here” dynamic marker
- Risk heatmaps for cities
- Auto-pan to current user location

---

## 🎯 Target Persona

### Ravi (Delivery Partner)
- **City:** Chennai  
- **Platform:** Amazon  
- **Daily Income:** ₹1400  

#### Scenario:
If heavy rain or platform outage occurs, Ravi loses income.  
GigShield PRO automatically compensates him using parametric triggers.

---

## ⚙️ Core Features

- AI-based fraud scoring (0–100)
- GPS anti-spoofing detection
- Dynamic weekly premium calculation
- Automated parametric claim triggers
- Instant payout simulation
- Fraud detection dashboard
- Hyper-local disruption monitoring
- Predictive alerts (mock)

---

## 🔁 Persona-Based Workflow

1. Worker registers and logs in  
2. Enters city, platform, income  
3. Risk score is calculated  
4. Weekly premium is generated  
5. Worker activates policy  
6. System monitors disruptions  
7. Claim auto-triggers  
8. Fraud engine verifies claim  
9. Approved → payout simulated instantly  

---

## 💰 Weekly Premium Model

Premium is calculated using:

- Worker income  
- City risk level  
- Disruption probability  
- Historical patterns  

### Why Weekly?
- Affordable  
- Flexible  
- Matches gig income cycles  
- Dynamic risk adjustment  

---

## ⚡ Parametric Triggers

Claims are triggered automatically based on:

- Heavy rainfall  
- Heatwave  
- Platform outage  
- Warehouse failure  
- Curfew  

### Benefits:
- No manual claims  
- Instant processing  
- Transparent rules  
- Fast payouts  

---

## 🛡️ Phase 3 Fraud Detection System

### Detection Capabilities:

- GPS spoofing detection  
- Impossible speed detection  
- City mismatch validation  
- Repeated claim detection  
- Income vs payout anomaly  

---

### 🔢 Fraud Score

**Range:** 0 – 100  

- Lower → Genuine  
- Higher → Fraud  

---

### 🚦 Risk Classification

- **LOW (0–30)** → Auto Approved  
- **HIGH (31–100)** → Rejected  

---

### ✅ Outcome

- Fast processing for real users  
- Fraud prevention at scale  
- Minimal false positives  
- Fully automated verification  

---

## 📊 Admin Dashboard

Provides insurers with:

- Fraud analytics  
- Claim monitoring  
- Loss ratio insights  
- GPS mismatch alerts  
- Manual override controls  

---

## 🛠️ Tech Stack

### Frontend
- React.js  
- TypeScript  
- Tailwind CSS  
- Recharts  

### Backend
- Node.js  
- Express.js  

### AI/ML
- TensorFlow.js  
- Haversine Algorithm  

### Database
- SQLite  

### Integrations
- Razorpay  
- Mapbox  
- Mock APIs  

---

## 💾 Data Persistence

Stored in SQLite:

- Users  
- Policies  
- Claims  
- Payouts  

✔ Fully persistent  
✔ Real-time updates  
✔ Backend integrated  

---

## 🎯 End Goal

GigShield PRO delivers a complete:

- AI-powered insurance workflow  
- Fraud-resistant claim system  
- GPS-verified validation layer  
- Instant payout simulation  

---

## 📈 Innovation

- Hyper-local insurance  
- AI fraud detection  
- Parametric automation  
- GPS anti-spoofing  
- Real-time dashboards  

---

## 🌍 Market Opportunity

Targets:

- Delivery workers  
- Gig economy  
- Logistics partners  

### Value:
- Workers → instant protection  
- Insurers → fraud-safe automation  
- Platforms → workforce stability  

---

## 📦 Phase 2 Status

✔ Authentication  
✔ Policy system  
✔ Premium calculation  
✔ Claim automation  
✔ Data persistence  

---

## 🔥 Phase 3 Enhancements

✔ AI Fraud Engine  
✔ GPS Anti-Spoofing  
✔ Razorpay Integration  
✔ Instant Payout Simulation  
✔ Advanced Dashboards  

---

*GigShield PRO — Protecting the backbone of the digital economy.*
