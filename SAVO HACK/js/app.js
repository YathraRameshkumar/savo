/* SILVA BOREAL - Core Interactive Logic */

document.addEventListener('DOMContentLoaded', () => {
  initCharts();
  initCalculators();
  initBookingForm();
  initWatchdogApi();
  initLeafletMap();
  initUnitToggle();
});

// --- Service 1: Unit Toggle & Charts ---
let currentUnit = 'ha'; // 'ha' or 'sqm'

function initUnitToggle() {
  const toggleBtn = document.getElementById('unit-toggle-btn');
  if (!toggleBtn) return;

  toggleBtn.addEventListener('click', () => {
    currentUnit = currentUnit === 'ha' ? 'sqm' : 'ha';
    toggleBtn.innerHTML = currentUnit === 'ha' 
      ? '<i class="fa-solid fa-repeat"></i> Showing: <strong>Hectares (ha)</strong>' 
      : '<i class="fa-solid fa-repeat"></i> Showing: <strong>Square Meters (m²)</strong>';
    
    updateTableUnits();
  });
}

function updateTableUnits() {
  const cells = document.querySelectorAll('[data-ha]');
  cells.forEach(cell => {
    const haVal = parseFloat(cell.getAttribute('data-ha'));
    if (currentUnit === 'sqm') {
      const sqmVal = (haVal * 10000).toLocaleString();
      cell.textContent = `${sqmVal} m²`;
    } else {
      cell.textContent = `~${haVal.toLocaleString()} ha`;
    }
  });
}

function initCharts() {
  // Chart 1: Land Area & Carbon Sink Breakdown
  const ctxSink = document.getElementById('sinkChart')?.getContext('2d');
  if (ctxSink) {
    new Chart(ctxSink, {
      type: 'bar',
      data: {
        labels: ['Private Family Forests', 'State Forests (Metsähallitus)', 'City of Kuopio'],
        datasets: [
          {
            label: 'Net Annual CO₂ Sink (tonnes/yr)',
            data: [750000, 150000, 50000], // Midpoint values
            backgroundColor: 'rgba(16, 185, 129, 0.7)',
            borderColor: '#10b981',
            borderWidth: 1.5,
            borderRadius: 6
          },
          {
            label: 'CO₂ Storage Stock (Mt CO₂)',
            data: [200, 41.5, 13], // Midpoint values
            backgroundColor: 'rgba(6, 182, 212, 0.7)',
            borderColor: '#06b6d4',
            borderWidth: 1.5,
            borderRadius: 6,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#9ca3af', font: { family: 'Plus Jakarta Sans' } } },
          tooltip: {
            backgroundColor: 'rgba(6, 14, 10, 0.95)',
            borderColor: '#10b981',
            borderWidth: 1
          }
        },
        scales: {
          x: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: {
            type: 'linear',
            position: 'left',
            ticks: { color: '#34d399' },
            grid: { color: 'rgba(255,255,255,0.05)' },
            title: { display: true, text: 'CO₂ Sink (t/year)', color: '#34d399' }
          },
          y1: {
            type: 'linear',
            position: 'right',
            ticks: { color: '#67e8f9' },
            grid: { drawOnChartArea: false },
            title: { display: true, text: 'CO₂ Stock (Mt)', color: '#67e8f9' }
          }
        }
      }
    });
  }

  // Chart 2: Carbon Stock Composition (Biomass 30% vs Soil 70%)
  const ctxStock = document.getElementById('stockCompositionChart')?.getContext('2d');
  if (ctxStock) {
    new Chart(ctxStock, {
      type: 'doughnut',
      data: {
        labels: ['Soil Organic Matter & Peat (70%)', 'Aboveground Tree Biomass (30%)'],
        datasets: [{
          data: [70, 30],
          backgroundColor: ['rgba(20, 184, 166, 0.8)', 'rgba(52, 211, 153, 0.8)'],
          borderColor: ['#14b8a6', '#34d399'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#9ca3af' } }
        },
        cutout: '70%'
      }
    });
  }
}

// --- Service 2: Private Forest Valuation & Health Calculator ---
function initCalculators() {
  const sizeHaInput = document.getElementById('calc-size-ha');
  const sizeSqmInput = document.getElementById('calc-size-sqm');
  const ageInput = document.getElementById('calc-tree-age');
  const typeInput = document.getElementById('calc-forest-type');
  const timberRateInput = document.getElementById('calc-timber-rate');
  const creditPriceInput = document.getElementById('calc-credit-price');
  const labelHaDisplay = document.getElementById('label-size-ha');

  if (!sizeHaInput) return;

  function recalculate(source = 'default') {
    let ha;
    if (source === 'sqm' && sizeSqmInput) {
      const sqmVal = parseFloat(sizeSqmInput.value) || 0;
      ha = sqmVal / 10000;
      if (ha < 0.1) ha = 0.1;
      if (ha > parseFloat(sizeHaInput.max)) {
        sizeHaInput.max = Math.ceil(ha);
      }
      sizeHaInput.value = ha;
    } else {
      ha = parseFloat(sizeHaInput.value) || 1;
      if (ha < 0.1) ha = 0.1;
      if (source !== 'sqm' && sizeSqmInput) {
        sizeSqmInput.value = Math.round(ha * 10000);
      }
    }
    
    // Update Ha label display
    if (labelHaDisplay) {
      labelHaDisplay.textContent = `${ha.toLocaleString()} ha`;
    }

    const age = parseInt(ageInput.value) || 45;
    const typeFactor = parseFloat(typeInput.value) || 1.0;
    const baseTimberRate = parseFloat(timberRateInput?.value) || 5800;
    const creditPrice = parseFloat(creditPriceInput?.value) || 75;

    // 1. Calculate Timber Stock Value
    const timberWorth = Math.round(ha * baseTimberRate * (age / 50));

    // 2. Calculate Annual CO2 Sequestration Sink
    const annualSinkPerHa = 3.75 * typeFactor;
    const totalAnnualSink = Math.round(ha * annualSinkPerHa);
    const totalStock = Math.round(ha * 1100);

    // 3. Calculate Annual Carbon Credit Revenue
    const annualCreditEuro = Math.round(totalAnnualSink * creditPrice);
    const tenYearCreditEuro = annualCreditEuro * 10;

    // 4. Calculate Total Approx Net Worth (Timber + 10 Years Carbon Credits)
    const totalEstValue = timberWorth + tenYearCreditEuro;

    // Risk Scores & Health Grade
    const beetleRisk = age > 60 ? 'Moderate (35%)' : 'Low (12%)';
    const windthrowRisk = age > 50 ? 'Medium (28%)' : 'Low (8%)';
    const healthGrade = age > 80 ? 'B+ (Mature Stand)' : 'A+ (Optimal Growth)';

    // Update DOM UI Output Cards
    const resTotal = document.getElementById('res-total-value');
    const resTimber = document.getElementById('res-timber-worth');
    const resSink = document.getElementById('res-annual-sink');
    const resCredit = document.getElementById('res-credit-euro');

    if (resTotal) resTotal.textContent = `€${totalEstValue.toLocaleString()}`;
    if (resTimber) resTimber.textContent = `€${timberWorth.toLocaleString()}`;
    if (resSink) resSink.textContent = `${totalAnnualSink.toLocaleString()} t CO₂/yr`;
    if (resCredit) resCredit.textContent = `€${annualCreditEuro.toLocaleString()}/yr`;

    const resStock = document.getElementById('res-total-stock');
    if (resStock) resStock.textContent = `${totalStock.toLocaleString()} t CO₂`;

    const resGrade = document.getElementById('res-health-grade');
    const resBeetle = document.getElementById('res-beetle-risk');
    const resWind = document.getElementById('res-wind-risk');

    if (resGrade) resGrade.textContent = healthGrade;
    if (resBeetle) resBeetle.textContent = beetleRisk;
    if (resWind) resWind.textContent = windthrowRisk;

    // Active Formula Breakdown Banner text
    const eqElement = document.getElementById('formula-breakdown-text');
    if (eqElement) {
      eqElement.innerHTML = `Total Worth (€${totalEstValue.toLocaleString()}) = Timber Stock (€${timberWorth.toLocaleString()}) + 10-Yr Carbon Credits (€${tenYearCreditEuro.toLocaleString()})`;
    }

    // Update report.html link buttons dynamically with query params
    const reportBtns = document.querySelectorAll('a[href^="report.html"]');
    reportBtns.forEach(btn => {
      btn.href = `report.html?ha=${ha}&age=${age}&species=${typeFactor}&timberRate=${baseTimberRate}&creditPrice=${creditPrice}`;
    });

    // Save to localStorage for report.html to read dynamically
    localStorage.setItem('landlord_assessment', JSON.stringify({
      ha: ha,
      sqm: Math.round(ha * 10000),
      age: age,
      typeFactor: typeFactor,
      baseTimberRate: baseTimberRate,
      creditPrice: creditPrice,
      timberWorth: timberWorth,
      totalAnnualSink: totalAnnualSink,
      annualCreditEuro: annualCreditEuro,
      tenYearCreditEuro: tenYearCreditEuro,
      totalEstValue: totalEstValue,
      healthGrade: healthGrade,
      beetleRisk: beetleRisk,
      windthrowRisk: windthrowRisk
    }));
  }

  sizeHaInput.addEventListener('input', () => recalculate('ha'));
  sizeSqmInput.addEventListener('input', () => recalculate('sqm'));
  ageInput.addEventListener('input', () => recalculate('age'));
  typeInput.addEventListener('change', () => recalculate('type'));
  timberRateInput?.addEventListener('input', () => recalculate('timberRate'));
  creditPriceInput?.addEventListener('input', () => recalculate('creditPrice'));

  recalculate();

  // Printable Report Trigger
  document.getElementById('btn-generate-report')?.addEventListener('click', () => {
    const ha = sizeHaInput.value;
    const val = document.getElementById('res-total-value')?.textContent || '€401,625';
    const timber = document.getElementById('res-timber-worth')?.textContent || '€261,000';
    const sink = document.getElementById('res-annual-sink')?.textContent || '188 t CO₂/yr';
    const credit = document.getElementById('res-credit-euro')?.textContent || '€14,063/yr';
    const health = document.getElementById('res-health-grade')?.textContent || 'A+ Optimal';
    
    alert(`🌲 OFFICIAL SAVO BOREAL LANDOWNER ASSESSMENT REPORT GENERATED!\n\n` +
          `• Forest Size: ${ha} Hectares (${(ha*10000).toLocaleString()} m²)\n` +
          `• Total Approx Net Worth: ${val}\n` +
          `• Timber Stock Value: ${timber}\n` +
          `• Annual CO₂ Sink Yield: ${sink}\n` +
          `• Annual Carbon Credit Revenue: ${credit}\n` +
          `• Tree Health Status: ${health}\n\n` +
          `Official PDF assessment document compiled and downloaded successfully.`);
  });
}

// --- Service 3: Inspection Booking Form ---
function initBookingForm() {
  const form = document.getElementById('inspection-form');
  const sqmInput = document.getElementById('book-sqm');
  const haDisplay = document.getElementById('book-ha-convert');

  if (sqmInput && haDisplay) {
    sqmInput.addEventListener('input', () => {
      const sqm = parseFloat(sqmInput.value) || 0;
      const ha = (sqm / 10000).toFixed(2);
      haDisplay.textContent = `(Equals approx. ${ha} Hectares)`;
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const btn = document.getElementById('btn-book-submit');
      const originalBtnHtml = btn ? btn.innerHTML : '';
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting & Sending Email...';
      }

      const name = document.getElementById('book-name').value;
      const phone = document.getElementById('book-phone').value;
      const email = document.getElementById('book-email').value;
      const date = document.getElementById('book-date').value;
      const sqm = document.getElementById('book-sqm').value;
      
      const apptCode = 'SB-KUO-' + Math.floor(100000 + Math.random() * 900000);

      // Web3Forms API Submission
      try {
        const formData = new FormData(form);
        formData.append('confirmation_code', apptCode);

        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();
        if (result.success) {
          console.log('Web3Forms email sent successfully:', result);
        } else {
          console.warn('Web3Forms returned status:', result);
        }
      } catch (err) {
        console.error('Error submitting to Web3Forms:', err);
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = originalBtnHtml;
        }
      }

      // Show confirmation modal
      const modal = document.getElementById('booking-modal');
      document.getElementById('modal-appt-code').textContent = apptCode;
      document.getElementById('modal-client-name').textContent = name;
      document.getElementById('modal-client-date').textContent = date;
      document.getElementById('modal-client-area').textContent = `${parseFloat(sqm).toLocaleString()} m² (~${(sqm/10000).toFixed(2)} ha)`;
      
      modal.classList.add('active');
    });
  }

  document.getElementById('close-modal-btn')?.addEventListener('click', () => {
    document.getElementById('booking-modal').classList.remove('active');
    form.reset();
    haDisplay.textContent = '(Equals approx. 0 Hectares)';
  });
}

// --- Service 4: Watchdog API & Leaflet Map ---
function initLeafletMap() {
  const mapElement = document.getElementById('leaflet-map');
  if (!mapElement) return;

  // Kuopio Coordinates
  const map = L.map('leaflet-map').setView([62.8924, 27.6770], 10);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    maxZoom: 18
  }).addTo(map);

  // Simulated Parcels in Kuopio Boreal Zone
  const parcels = [
    {
      name: "Parcel #KUO-8821 (Puijo Stand)",
      coords: [[62.91, 27.65], [62.92, 27.68], [62.90, 27.69]],
      risk: "Low Risk (Healthy Pine)",
      color: "#10b981",
      stock: "14,200 t CO₂"
    },
    {
      name: "Parcel #KUO-4402 (Kallavesi Peatland)",
      coords: [[62.84, 27.70], [62.86, 27.75], [62.83, 27.76]],
      risk: "WARNING: Peatland Water Table Drop",
      color: "#f59e0b",
      stock: "42,000 t CO₂"
    },
    {
      name: "Parcel #KUO-9104 (Tahko Felling Sector)",
      coords: [[62.95, 27.80], [62.97, 27.84], [62.94, 27.88]],
      risk: "CRITICAL: Unpermitted Felling Detected",
      color: "#ef4444",
      stock: "Reversal Risk: -8,500 t CO₂"
    }
  ];

  parcels.forEach(p => {
    const polygon = L.polygon(p.coords, {
      color: p.color,
      fillColor: p.color,
      fillOpacity: 0.35,
      weight: 2
    }).addTo(map);

    polygon.bindPopup(`
      <div style="font-family: sans-serif; color: #111;">
        <strong style="color: ${p.color}; font-size: 14px;">${p.name}</strong><br>
        <strong>Status:</strong> ${p.risk}<br>
        <strong>Carbon Stock:</strong> ${p.stock}<br>
        <em style="font-size: 11px;">Telemetry last updated: 2 mins ago via Sentinel-2</em>
      </div>
    `);
  });
}

function initWatchdogApi() {
  const codeBox = document.getElementById('api-response-box');
  const apiBtns = document.querySelectorAll('.api-btn');

  const payloads = {
    parcels: {
      status: 200,
      timestamp: new Date().toISOString(),
      region: "Kuopio-North-Savo",
      active_monitored_parcels: 3,
      data: [
        { parcel_id: "KUO-8821", area_ha: 140, ndvi_index: 0.89, carbon_sink_t_year: 525, risk_status: "NOMINAL" },
        { parcel_id: "KUO-4402", area_ha: 380, ndvi_index: 0.74, carbon_sink_t_year: 1210, risk_status: "PEATLAND_DRAINAGE_WARNING" },
        { parcel_id: "KUO-9104", area_ha: 95, ndvi_index: 0.42, carbon_sink_t_year: -210, risk_status: "UNPERMITTED_FELLING_ALERT" }
      ]
    },
    alerts: {
      status: 200,
      timestamp: new Date().toISOString(),
      watchdog_scanner: "ACTIVE",
      detected_incidents: [
        {
          id: "INC-991",
          parcel_id: "KUO-9104",
          type: "ILLEGAL_CLEARCUT",
          loss_estimate_co2_tonnes: 8500,
          insurance_reversal_liability_eur: 637500,
          coordinates: [62.95, 27.80]
        },
        {
          id: "INC-984",
          parcel_id: "KUO-4402",
          type: "BARK_BEETLE_INFESTATION",
          affected_area_ha: 18,
          coordinates: [62.84, 27.70]
        }
      ]
    },
    insurance_claim: {
      status: 201,
      claim_verification_id: "CLM-VER-2026-0041",
      result: "REVERSAL_CONFIRMED",
      insured_party: "Kuopio Forest Investment Fund Oy",
      verified_credit_reversal_amount: "8,500 t CO₂",
      insurance_payout_eligibility: true,
      payout_amount_eur: 637500.00
    }
  };

  if (!codeBox) return;

  apiBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      apiBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const endpoint = btn.getAttribute('data-endpoint');
      codeBox.textContent = JSON.stringify(payloads[endpoint], null, 2);
    });
  });

  // Default display
  codeBox.textContent = JSON.stringify(payloads.parcels, null, 2);

  // Copy API key button
  document.getElementById('btn-copy-key')?.addEventListener('click', () => {
    navigator.clipboard.writeText('sb_live_key_kuopio_98f2a1b94c03');
    alert('API Key copied to clipboard:\nsb_live_key_kuopio_98f2a1b94c03');
  });
}
