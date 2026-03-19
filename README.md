# GigShield: AI-Powered Parametric Insurance for Gig Workers

GigShield is an AI-powered parametric insurance platform designed to protect delivery workers in India’s gig economy from income loss caused by external disruptions such as heavy rain, extreme heat, curfews, warehouse outages, and delivery platform failures.

This project focuses on building a smart, transparent, and automated insurance system where workers receive weekly coverage and payouts are triggered automatically when predefined disruption conditions are met.

---

## Problem Statement

Delivery workers from platforms like Amazon and Flipkart earn based on successful deliveries. When disruptions such as bad weather, heatwaves, city restrictions, or platform outages occur, they lose working hours and daily income.

Traditional insurance is often too slow, claim-heavy, and unsuitable for gig workers who need fast and flexible support. GigShield solves this through a parametric insurance model that provides automatic compensation based on real-world trigger conditions.

---

## Target Persona

### Example Persona: Ravi
- **City:** Chennai
- **Platform:** Amazon
- **Average Daily Income:** ₹1400

### Scenario
Ravi depends on daily deliveries for his earnings. If heavy rain or a platform outage happens, he completes fewer deliveries and loses income. GigShield protects his weekly earnings through parametric insurance coverage that activates automatically during such disruptions.

---

## Core Strategy

GigShield provides weekly income protection for delivery workers using AI-driven risk analysis and automated parametric claims.

### Key Features
- AI-based risk scoring
- Smart weekly premium calculation
- Automatic parametric claim triggers
- Instant payout simulation
- Fraud detection dashboard
- Hyper-local disruption monitoring
- Predictive disruption alerts

---

## Persona-Based Workflow

1. **Worker Registration**
   - Delivery partner signs up on the platform
   - Provides work zone, platform, and income details

2. **Risk Analysis**
   - System evaluates worker risk using weather, traffic, and disruption history

3. **Premium Generation**
   - Weekly premium is calculated based on income and zone risk

4. **Policy Activation**
   - Worker purchases weekly insurance coverage

5. **Disruption Monitoring**
   - System tracks rainfall, heatwaves, curfews, warehouse outages, and platform issues

6. **Automatic Trigger**
   - If disruption thresholds are met, claim is triggered automatically

7. **Payout Processing**
   - Compensation is calculated and processed without manual claim filing

---

## Weekly Premium Model

GigShield uses a **weekly premium model** because gig workers earn on a short-cycle basis and face changing risks every week.

### Premium depends on:
- Average worker income
- Delivery zone risk level
- Historical disruption frequency
- Probability of claim occurrence

### Why weekly insurance?
- Affordable for gig workers
- Flexible and adaptable
- Matches real work and earning patterns
- Easier to manage than monthly or yearly plans

---

## Parametric Triggers

The system uses **parametric insurance**, which means payouts are based on measurable real-world events instead of manual damage verification.

### Example triggers:
- Heavy rainfall above threshold
- Extreme heat / heatwave
- City curfew
- Warehouse outage
- Delivery platform outage

### Benefits of parametric triggers
- Fast claim settlement
- No paperwork-heavy process
- Transparent and rule-based
- Better trust and efficiency

---

## Platform Choice

GigShield is designed as a **web platform**.

### Why web?
- Easy access on both desktop and mobile browsers
- Faster development for prototype stage
- Convenient for delivery workers, insurers, and admins
- Simple integration with dashboards, analytics, and maps
- Scalable for future mobile app expansion

---

## AI / ML Integration

AI is a major part of GigShield’s workflow.

### 1. Risk Score Model
Risk Score = (weather risk + traffic risk + disruption frequency) / 3

This score helps determine worker risk level and premium amount.

### 2. Premium Optimization
AI helps generate fair weekly premiums based on worker profile and disruption probability.

### 3. Predictive Alerts
The platform can warn workers about likely disruptions in advance.

**Example:**  
“Heavy rain predicted tomorrow. Insurance recommended.”

### 4. Income Loss Prediction
AI estimates likely income loss caused by a disruption event.

### 5. Fraud Detection
The system can detect suspicious activities such as:
- Duplicate claims
- Repeated unusual payouts
- Claims from inactive or unaffected zones

---

## Innovation & Novelty

GigShield introduces a modern insurance approach for gig workers through:

- **Hyper-local risk assessment**
- **Predictive disruption alerts**
- **Dynamic premium optimization**
- **Automated parametric claims**
- **Fraud detection dashboard**

This makes insurance more practical, faster, and worker-friendly.

---

## Tech Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- Recharts

### Backend
- Node.js
- Express.js

### Database
- PostgreSQL
- Prisma ORM

### Other Integrations
- Mapbox
- Mock Weather & Disruption APIs
- JWT Authentication

---

## Development Plan

GigShield will be developed in three structured phases across six weeks, moving from idea validation to automation and finally to optimization and scale. The goal is to build a complete AI-powered parametric insurance platform that protects gig delivery workers from income loss through dynamic pricing, automated triggers, seamless claims, fraud detection, and instant payout simulation.

### Phase 1: Ideation & Foundation (March 4 – March 20)
**Theme:** *Ideate & Know Your Delivery Worker*

This phase focuses on understanding the problem, defining the worker journey, and building the foundation of the solution.

#### Objectives
- Research the day-to-day challenges faced by delivery workers
- Define target personas and disruption-based scenarios
- Design the overall workflow of the application
- Finalize the weekly premium model and parametric trigger approach
- Plan AI/ML integration for premium pricing, disruption prediction, and fraud detection
- Select the tech stack and prepare the repository structure

#### Key Work in This Phase
- Create the idea document in the GitHub README
- Describe persona-based workflows and application flow
- Explain how the weekly premium model works
- Define hyper-local parametric triggers
- Plan the AI-based risk scoring and fraud detection approach
- Build the initial UI prototype and project structure

#### Deliverables
- GitHub repository with README.md
- Clear explanation of the core strategy
- 2-minute public demo video explaining the idea, prototype, and execution plan

---

### Phase 2: Automation & Protection (March 21 – April 4)
**Theme:** *Protect Your Worker*

This phase focuses on building the main product features that automate worker protection and insurance handling.

#### Objectives
- Implement registration and authentication for delivery workers and insurers
- Build insurance policy creation and management
- Develop dynamic weekly premium calculation
- Implement automated claims management
- Integrate 3–5 automated disruption triggers using public or mock APIs
- Create a seamless zero-touch claims experience for users

#### Modules to Develop

**1. Registration Process**
- Delivery partner signup and login
- Insurance provider/admin login
- Role-based authentication and protected access

**2. Insurance Policy Management**
- Weekly policy generation
- Coverage activation and expiry tracking
- Policy view for workers and insurers
- Active, expired, and triggered policy states

**3. Dynamic Premium Calculation**
- Calculate premiums using income and hyper-local risk
- Use weather risk, traffic conditions, and disruption history
- Offer lower premiums for safer zones
- Suggest higher protection based on predictive weather trends

**4. Claims Management**
- Automatically generate claims when disruption thresholds are met
- Show claim reason, status, and payout amount
- Remove the need for manual claim filing

**5. Automated Trigger Engine**
The platform will simulate or integrate 3–5 disruption triggers such as:
- Heavy rainfall
- Extreme heat / heatwave
- Delivery platform outage
- Warehouse outage
- Curfew or local restriction alerts

#### User Experience Vision
The best user experience is a **zero-touch claim process**:
1. Worker buys weekly insurance coverage  
2. System continuously monitors disruption conditions  
3. If thresholds are met, claim is triggered automatically  
4. Payout is calculated in the background  
5. Worker receives instant status and payout notification  

This makes the platform simple, fast, and worker-friendly.

#### Deliverables
- Executable source code
- 2-minute demo video
- Registration module
- Insurance policy management
- Dynamic premium engine
- Automated claims workflow

---

### Phase 3: Scale & Optimise (April 5 – April 17)
**Theme:** *Perfect for Your Worker*

This phase focuses on making the platform smarter, more secure, and more business-ready through fraud prevention, payout simulation, and advanced dashboards.

#### Objectives
- Build advanced fraud detection for delivery-specific abuse cases
- Simulate instant worker payout using mock payment gateways
- Develop intelligent dashboards for workers and insurers
- Consolidate the final project for judging and presentation

#### Modules to Develop

**1. Advanced Fraud Detection**
- Detect GPS spoofing attempts
- Flag fake weather-related claims using historical and location-based data
- Detect repeated suspicious claims
- Identify mismatches between worker activity and disruption zones

**2. Instant Payout System (Simulated)**
- Integrate Razorpay test mode, Stripe sandbox, or mock UPI simulator
- Simulate instant compensation for approved claims
- Show transaction and payout success in the dashboard

**3. Intelligent Dashboard for Workers**
- Active weekly coverage
- Earnings protected
- Claim history
- Payout history
- Disruption alerts and protection insights

**4. Intelligent Dashboard for Insurers/Admin**
- Worker and policy overview
- Claims and payout monitoring
- Loss ratio analytics
- Predictive insights for next week’s disruptions
- Fraud alerts and suspicious activity tracking

#### Final Submission Package
- **5-minute demo video**
  - Complete walkthrough of the platform
  - Simulated disruption event
  - Automated AI-based claim approval
  - Instant payout demonstration

- **Final Pitch Deck (PDF)**
  - Delivery worker persona
  - AI and fraud detection architecture
  - Weekly pricing model
  - Business value and scalability

---

## Overall Build Roadmap

The complete platform will include the following major modules:
- Delivery Partner Onboarding
- Insurance Provider/Admin Portal
- Weekly Policy Management
- AI Risk Scoring Engine
- Dynamic Premium Calculator
- Disruption Trigger Engine
- Automated Claims Processing
- Fraud Detection Engine
- Instant Payout Simulation
- Worker Dashboard
- Admin Analytics Dashboard

## End Goal

By the end of the six-week development cycle, GigShield will deliver a complete AI-powered parametric insurance workflow for gig delivery workers. The platform will demonstrate worker onboarding, weekly coverage generation, disruption monitoring, automated claim approval, fraud prevention, and simulated instant payout in a practical and scalable manner.

## Repository Link

[(https://github.com/Kanikaravi-29/GIGSHIELD)]

## Demo Video

[Demo Video Link]
