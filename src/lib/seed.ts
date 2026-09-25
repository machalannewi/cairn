import "server-only";
import { ingestFile } from "./ingest";
import { insertDocument, setFocus } from "./store";

/**
 * Sample workspace: Halden, a field-service scheduling SaaS, deciding where to
 * expand in Europe. Gives first-time visitors something real to research.
 */
const FILES: Record<string, string> = {
  "EU Field Service Software Market Report 2026.md": `# EU Field Service Management Software — Market Report 2026

Prepared by Northgate Research for Halden Strategy. Figures in EUR unless stated.

## Executive summary

The European field service management (FSM) software market reached €2.9B in 2025 and is forecast to grow at a 13.8% CAGR to €5.5B by 2030. Growth is concentrated in the SMB segment (5–200 technicians), where cloud adoption still sits below 40% in most markets. Germany and the United Kingdom together account for 46% of regional spend.

## Market size by country

Germany is the largest single market at €720M (2025), growing 12.1% annually. Adoption is slowed by long procurement cycles and a strong preference for on-premise or EU-hosted deployments; 68% of German buyers surveyed require data residency inside the EU, and 41% require a German-language contract and support.

The United Kingdom is €610M (2025), growing 15.4% annually — the fastest of the large markets. UK buyers are more comfortable with US and EU vendors, trial-led purchasing is common, and median sales cycles are 38 days for SMB deals compared with 74 days in Germany.

France (€390M, 11.2% CAGR) and the Nordics (€280M, 16.9% CAGR) round out the top four. The Nordics show the highest cloud adoption (61%) but a small absolute buyer pool.

## Competitive landscape

The market is fragmented. The top five vendors hold roughly 31% share. Enterprise suites (ServiceMax, Salesforce Field Service, IFS) dominate accounts above 500 technicians. In SMB, regional specialists lead: Fieldly and Mobilio in Germany, Jobwise and BigChange in the UK.

Fieldly is the German SMB leader with an estimated 9% share and aggressive discounting (up to 30% on annual contracts). Its product is well regarded for DATEV accounting integration, which 57% of German SMB buyers listed as a must-have.

In the UK, Jobwise competes on price (entry tier at £19 per user per month) but receives weak reviews for route optimisation and mobile offline support.

## Buyer priorities

Across all markets, the top three purchase criteria were: ease of scheduling and dispatch (72%), mobile app quality including offline mode (64%), and accounting integration (58%). Price ranked fifth overall but first among firms with fewer than 15 technicians.

AI-assisted scheduling is an emerging differentiator: 34% of UK buyers and 22% of German buyers said automated route and job optimisation would influence vendor choice.

## Regulation and risk

The EU Data Act (applicable from September 2025) and national works-council rules in Germany affect technician location tracking. Vendors must support configurable tracking controls and in some cases works-council approval before rollout. UK GDPR remains aligned with EU GDPR for practical purposes, though UK–EU data adequacy is subject to review in 2027.

Currency exposure is a secondary risk: GBP/EUR volatility averaged 6% annualised over the past three years.

## Outlook

We expect consolidation among regional SMB vendors over the next 24 months. New entrants with a strong mobile product and native accounting integrations are best placed in the UK; Germany rewards localisation depth and patience.
`,

  "Competitor Pricing Benchmark.csv": `Vendor,Market,Tier,Price per user / month,Currency,Offline mobile,Route optimisation,Accounting integrations,Notes
Fieldly,Germany,Starter,24,EUR,Yes,Basic,"DATEV, Lexware",Up to 30% discount on annual plans
Fieldly,Germany,Pro,39,EUR,Yes,Advanced,"DATEV, Lexware, SAP B1",Market leader in SMB
Mobilio,Germany,Standard,29,EUR,Partial,Basic,DATEV,Strong in HVAC vertical
Jobwise,UK,Entry,19,GBP,No,None,"Xero, QuickBooks",Low price leader; weak reviews on mobile
Jobwise,UK,Business,32,GBP,Partial,Basic,"Xero, QuickBooks, Sage",
BigChange,UK,Core,45,GBP,Yes,Advanced,"Xero, Sage",Enterprise-leaning; long onboarding
Halden,UK (pilot),Team,29,GBP,Yes,AI-assisted,"Xero, QuickBooks",Pilot pricing; list price TBD
Halden,Germany (proposed),Team,34,EUR,Yes,AI-assisted,None yet,DATEV integration est. 5 months to build
`,

  "Customer Interviews - UK Pilot (Aug 2026).md": `# Customer Interviews — UK Pilot Programme

Date: 12–21 August 2026
Attendees: Priya Nair (Product), Tom Ellery (Sales), 9 pilot customers
Format: 30-minute calls, notes consolidated

## Summary

Nine of twelve pilot customers completed interviews. Seven said they would convert to paid at the pilot price of £29 per user per month; two said they would only convert below £25. The strongest theme was time saved on scheduling: customers reported between 3 and 6 hours saved per dispatcher per week.

## What customers valued

- AI-assisted scheduling was mentioned unprompted by 6 of 9 customers. One HVAC firm said it "replaced the whiteboard and two phone calls per job".
- Offline mobile mode was critical for customers working in basements and rural areas.
- Xero integration "just worked" for all five Xero users.

## Pain points and requests

- Three customers asked for Sage 50 integration; two said it would be a blocker at renewal.
- Reporting was described as "thin" — customers want technician utilisation and first-time-fix rate dashboards.
- Two customers compared us directly with Jobwise and said Jobwise was cheaper but "unusable on mobile".

## Churn risk

One customer (a 40-technician plumbing firm) is at risk because they need multi-depot scheduling, which is on the roadmap for Q1 2027.

## Action items

- Priya to scope Sage 50 integration (owner: Product, due 15 Sept).
- Tom to test £27 annual-commitment pricing with the two price-sensitive customers.
- Share interview recordings with the expansion working group.
`,

  "Leadership Offsite Notes - Expansion Planning.md": `# Leadership Offsite — European Expansion Planning

Date: 3 September 2026
Attendees: Mara Okafor (CEO), Daniel Reyes (CFO), Priya Nair (CPO), Tom Ellery (VP Sales), Lena Vogt (Advisor)

## Decision on the table

Where should Halden focus its FY2027 expansion budget of €1.8M: the UK, Germany, or both in sequence?

## Option A — UK first

Tom presented the UK pilot results: 7 of 9 interviewed customers ready to convert and a 38-day median sales cycle. The UK needs no product localisation beyond Sage 50 integration (est. 6 weeks). Daniel estimated UK payback on customer acquisition cost at 14 months.

## Option B — Germany first

Lena argued Germany is the larger prize (€720M market) and that Fieldly's customers are frustrated with its dated mobile app. However, entering Germany requires EU data residency (Frankfurt region, est. €140K/year infrastructure uplift), DATEV integration (est. 5 months), German-language support, and works-council-friendly tracking controls. Daniel estimated payback at 26 months given the longer sales cycle.

## Option C — Sequenced: UK now, Germany in H2 2027

Mara proposed launching the UK in Q4 2026 while starting DATEV integration and EU hosting in parallel, so Germany can launch in H2 2027 with a proven playbook. Concern raised by Daniel: running both workstreams could consume €1.5M of the €1.8M budget before German revenue arrives.

## Constraints agreed

- Burn multiple must stay below 1.8x through FY2027.
- Engineering capacity: 11 engineers; no more than 4 can be allocated to expansion work.
- Board wants a written recommendation with evidence by 30 September.

## Open questions

- Can we hit a £27–29 price point in the UK and still reach 75% gross margin?
- How much of the German opportunity is realistic given Fieldly's 30% discounting?
- Should AI-assisted scheduling be priced as a premium add-on?

## Next steps

- Daniel to model three scenarios with CAC, payback and burn.
- Priya to confirm engineering estimates for DATEV and EU hosting.
- Research team to prepare a decision brief for the board.
`,

  "Q2 2026 Pipeline & Unit Economics.csv": `Region,Metric,Q1 2026,Q2 2026,Target FY2027,Notes
UK,Qualified pipeline (EUR),410000,690000,2400000,Pilot-driven inbound up 68%
UK,Win rate,21%,27%,30%,
UK,Median sales cycle (days),44,38,35,
UK,Average contract value (EUR),6800,7400,8000,
UK,Customer acquisition cost (EUR),8900,8600,8000,
UK,Gross margin,74%,76%,78%,
Germany,Qualified pipeline (EUR),90000,120000,1500000,Mostly partner referrals
Germany,Win rate,9%,11%,22%,Blocked by missing DATEV integration in 6 lost deals
Germany,Median sales cycle (days),81,74,60,
Germany,Average contract value (EUR),9200,9800,10500,
Germany,Customer acquisition cost (EUR),17400,16800,12000,
Germany,Gross margin,69%,70%,74%,EU hosting uplift not yet included
`,
};

export async function seedWorkspace(orgId: string) {
  for (const [name, text] of Object.entries(FILES)) {
    const { doc, chunks } = await ingestFile(name, Buffer.from(text, "utf8"), { sample: true });
    await insertDocument(orgId, doc, chunks);
  }
  await setFocus(orgId, "Market research · sample: Halden EU expansion");
}
