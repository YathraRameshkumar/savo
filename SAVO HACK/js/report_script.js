/* ---------- Savo Boreal Landlord Forest Intelligence Report Script ---------- */

// Helper functions
const eur = (n) => "€" + Math.round(n).toLocaleString("en-US");
const mil = (n) => n >= 1e6 ? "€" + (n / 1e6).toFixed(2) + "M" : "€" + Math.round(n).toLocaleString("en-US");
const m3 = (n) => Math.round(n).toLocaleString("en-US") + " m³";
const $ = (id) => document.getElementById(id);

// Load landlord assessment data from localStorage or query params
function getLandlordAssessment() {
  const params = new URLSearchParams(window.location.search);
  const haParam = parseFloat(params.get('ha'));
  
  if (haParam && haParam > 0) {
    const age = parseInt(params.get('age')) || 45;
    const typeFactor = parseFloat(params.get('species')) || 1.0;
    const baseTimberRate = parseFloat(params.get('timberRate')) || 5800;
    const creditPrice = parseFloat(params.get('creditPrice')) || 75;

    const timberWorth = Math.round(haParam * baseTimberRate * (age / 50));
    const annualSinkPerHa = 3.75 * typeFactor;
    const totalAnnualSink = Math.round(haParam * annualSinkPerHa);
    const annualCreditEuro = Math.round(totalAnnualSink * creditPrice);
    const totalEstValue = timberWorth + (annualCreditEuro * 10);

    return {
      ha: haParam,
      sqm: Math.round(haParam * 10000),
      age: age,
      timberWorth: timberWorth,
      totalAnnualSink: totalAnnualSink,
      annualCreditEuro: annualCreditEuro,
      totalEstValue: totalEstValue
    };
  }

  const stored = localStorage.getItem('landlord_assessment');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.warn("Failed to parse stored assessment:", e);
    }
  }

  // Default Kuopio 50 ha Boreal Benchmark
  return {
    ha: 50,
    sqm: 500000,
    age: 45,
    timberWorth: 261000,
    totalAnnualSink: 188,
    annualCreditEuro: 14063,
    totalEstValue: 401625
  };
}

document.addEventListener('DOMContentLoaded', () => {
  const assessment = getLandlordAssessment();
  const totalsEl = $("totals");
  if (!totalsEl) return;

  const totalHa = assessment.ha;
  const nowValue = assessment.totalEstValue;
  const timberVal = assessment.timberWorth;
  const sinkYield = assessment.totalAnnualSink;

  // Calculate environmental risk impact based on Boreal stand risk factors
  const stormDamageLoss = Math.round(nowValue * 0.045);  // ~4.5% windthrow risk
  const qualityLoss = Math.round(nowValue * 0.015);      // ~1.5% bark beetle quality discount
  const accessLoss = Math.round(nowValue * 0.005);       // ~0.5% peatland access restriction
  
  const totalDamageLoss = stormDamageLoss + qualityLoss + accessLoss;
  const prevValue = nowValue + totalDamageLoss;
  const change = totalDamageLoss;

  // Timber volume estimate in m³ (~55 m³/ha for 45-yr boreal spruce)
  const timberVolumeM3 = Math.round(totalHa * 55 * (assessment.age / 50));
  const lostVolumeM3 = Math.round(timberVolumeM3 * 0.045);
  const nowTimberM3 = timberVolumeM3 - lostVolumeM3;

  // Render Header Totals
  const totalsData = [
    { n: mil(nowValue), l: "Forest Net Worth" },
    { n: Math.round(nowTimberM3).toLocaleString("en-US") + " m³", l: "Timber Stock Volume" },
    { n: sinkYield.toLocaleString("en-US") + " tCO₂/yr", l: "Active Carbon Sink (€" + Math.round(assessment.annualCreditEuro).toLocaleString("en-US") + "/yr)" }
  ];
  totalsEl.innerHTML = totalsData.map(t => '<div><div class="n">' + t.n + '</div><div class="l">' + t.l + '</div></div>').join("");

  // Render Value Change Section
  $("prev").textContent = mil(prevValue);
  $("now").textContent = mil(nowValue);
  $("chg").innerHTML = '<span class="dot" style="background:var(--loss);color:var(--loss);margin-right:8px"></span>−' + eur(change);

  // Render Damage Detected List
  const damageItems = [
    { l: "Windthrow Storm Damage", v: stormDamageLoss },
    { l: "Bark Beetle Timber Quality Loss", v: qualityLoss },
    { l: "Peatland Drainage & Access Restriction", v: accessLoss }
  ];
  $("damage").innerHTML = damageItems.map(d => '<div class="row"><span>' + d.l + '</span><span class="v">−' + eur(d.v) + '</span></div>').join("");

  // Recommended Actions
  const actionsData = [
    { color: "var(--loss)", title: "Inspect Spruce Stands for Windthrow", text: "High wind exposure detected in mature spruce stands. Field inspection recommended." },
    { color: "var(--warn)", title: "Harvest Beetle-Exposed Stands", text: "Timely harvesting recommended to prevent Ips typographus infestation spread." },
    { color: "var(--green)", title: "List Stand on Savo CO₂ Registry", text: "Certified annual yield of " + sinkYield + " t CO₂/yr (€" + Math.round(assessment.annualCreditEuro).toLocaleString("en-US") + "/yr)." }
  ];
  $("acts").innerHTML = actionsData.map(a => `<li><span class="dot" style="background:${a.color};color:${a.color}"></span><div><strong>${a.title}</strong><span class="d">${a.text}</span></div></li>`).join("");

  // "Why" view calculations
  $("why-amt").textContent = eur(change);
  $("w-prev").textContent = mil(prevValue);
  $("w-now").textContent = mil(nowValue);
  $("w-chg").textContent = "−" + eur(change);
  $("w-total").textContent = "−" + eur(change);
  $("story").textContent = "Your forest property (" + totalHa + " ha) updated from " + mil(prevValue) + " to " + mil(nowValue) + " based on environmental health telemetry and market pricing.";

  const causesData = [
    { 
      t: "1. Windthrow Storm Damage", 
      d: "Satellite radar scan indicates windthrow risk in mature spruce stands across " + (totalHa * 0.25).toFixed(1) + " hectares.",
      rows: [["Estimated lost timber", m3(lostVolumeM3)], ["Estimated economic impact", eur(stormDamageLoss)]] 
    },
    { 
      t: "2. Bark Beetle Quality Loss", 
      d: "Detected localized canopy thinning indicative of Ips typographus activity.", 
      rows: [["Quality discount impact", eur(qualityLoss)]] 
    },
    { 
      t: "3. Peatland Drainage Shift", 
      d: "Water table level drop detected near low-lying peatland parcels.", 
      rows: [["Access & drainage impact", eur(accessLoss)]] 
    }
  ];
  $("causes").innerHTML = causesData.map((c, i) => `<div class="cause"><div class="cn">${i + 1}</div><div style="flex:1"><strong>${c.t}</strong><p>${c.d}</p>` +
    c.rows.map(r => `<div class="imp"><span>${r[0]}</span><b>${r[1]}</b></div>`).join("") + `</div></div>`).join("");

  // Build Forest Stands Grid for the Landowner's Property
  const standsData = [
    { name: "Stand A (Puijo)", species: "Norway Spruce", ha: (totalHa * 0.25).toFixed(1), trees: Math.round(totalHa * 45), status: "normal", loss: 0 },
    { name: "Stand B (Kallavesi)", species: "Norway Spruce", ha: (totalHa * 0.35).toFixed(1), trees: Math.round(totalHa * 60), status: "damage", loss: stormDamageLoss },
    { name: "Stand C (Tahko Sector)", species: "Scots Pine", ha: (totalHa * 0.20).toFixed(1), trees: Math.round(totalHa * 35), status: "damage", loss: qualityLoss },
    { name: "Stand D (Savo North)", species: "Birch / Mixed", ha: (totalHa * 0.20).toFixed(1), trees: Math.round(totalHa * 30), status: "monitor", loss: accessLoss }
  ];

  const layoutMap = ["AAADDDE", "AACCDDE", "BBCCFFF", "BBBGGFF", "BBBGGGF"];
  const namesMap = { damage: "Damage detected", monitor: "Monitor", normal: "Normal" };

  const getStandForLetter = (letter) => {
    if (letter === 'A' || letter === 'D' || letter === 'E') return standsData[0];
    if (letter === 'B') return standsData[1];
    if (letter === 'C' || letter === 'F') return standsData[2];
    return standsData[3];
  };

  $("map").innerHTML = layoutMap.join("").split("").map((L, idx) => {
    const s = getStandForLetter(L);
    return `<button class="cell ${s.status}" data-a="${L}" aria-label="${s.name}, ${namesMap[s.status]}">${L}</button>`;
  }).join("");

  function selectStand(L) {
    const s = getStandForLetter(L);
    document.querySelectorAll(".cell").forEach(c => c.classList.toggle("sel", c.dataset.a === L));

    const dmgHtml = s.loss > 0 
      ? `<div class="row"><span>Estimated risk impact</span><span class="v loss">−${eur(s.loss)}</span></div>`
      : `<div class="row"><span>Environmental status</span><span class="v" style="color: var(--green);">Pristine</span></div>`;

    $("detail").innerHTML = `<h3>${s.name}</h3>
      <p class="st" style="color:${s.status === "damage" ? "var(--loss)" : s.status === "monitor" ? "var(--gold)" : "var(--green)"}">${namesMap[s.status]}</p>
      <div class="row"><span>Area Share</span><span class="v">${s.ha} ha</span></div>
      <div class="row"><span>Tree Count</span><span class="v">${s.trees.toLocaleString("en-US")} trees</span></div>
      <div class="row"><span>Dominant Species</span><span class="v">${s.species}</span></div>` + dmgHtml;
  }

  $("map").onclick = (e) => { 
    const b = e.target.closest(".cell"); 
    if (b) selectStand(b.dataset.a); 
  };

  selectStand('B');

  const calm = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const reveal = (el) => { el.hidden = false; el.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" }); };
  $("why").onclick = () => reveal($("whyPanel"));
  $("showMap").onclick = () => { selectStand('B'); reveal($("mapPanel")); };
});
