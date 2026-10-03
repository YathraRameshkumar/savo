/* ---------- Pricing (edit freely: these are proposed demo prices, not market prices) ---------- */
const BASE_FEE = 99;        // € fixed fee per report
const PER_HECTARE = 3;      // € per hectare
const MAX_STANDARD = 499;   // above this the price becomes a custom quote
const HA_PER_ACRE = 0.404686;

const $ = (id) => document.getElementById(id);
const eur = (n) => "€" + Math.round(n).toLocaleString("en-US");

function sizeInHa() {
  const v = parseFloat($("size").value);
  if (!(v > 0)) return null;
  return $("unit").value === "acres" ? v * HA_PER_ACRE : v;
}

function estimate() {
  const ha = sizeInHa();
  if (ha === null) return null;
  const areaFee = Math.round(ha * PER_HECTARE);
  const total = BASE_FEE + areaFee;
  return { ha, areaFee, total, custom: total > MAX_STANDARD };
}

function row(label, value, cls) {
  const d = document.createElement("div");
  d.className = "row" + (cls ? " " + cls : "");
  const a = document.createElement("span"); a.textContent = label;
  const b = document.createElement("span"); b.className = "v"; b.textContent = value;
  d.append(a, b);
  return d;
}

function renderEstimate() {
  const box = $("estimate"), e = estimate();
  if (!box) return;
  box.replaceChildren();
  if (!e) {
    const p = document.createElement("span");
    p.className = "hint"; p.textContent = "Enter the property size to see the estimated cost.";
    box.append(p);
    return;
  }
  box.append(row("Base fee", eur(BASE_FEE)));
  box.append(row("Area fee (" + e.ha.toFixed(1) + " ha × " + eur(PER_HECTARE) + ")", eur(e.areaFee)));
  box.append(row("Estimated cost", e.custom ? "Custom quote" : eur(e.total), "total"));
  const note = document.createElement("span");
  note.className = "hint";
  note.textContent = e.custom
    ? "Large properties get a custom quote. We will contact you."
    : "This is an estimate. The final price is confirmed once the area is checked.";
  box.append(note);
}

document.addEventListener('DOMContentLoaded', () => {
  if (!$("orderForm")) return;

  ["size", "unit"].forEach((id) => $(id)?.addEventListener("input", renderEstimate));
  renderEstimate();

  /* ---------- Private owner or company ---------- */
  const isCompany = () => document.querySelector('input[name="kind"]:checked')?.value === "company";

  function applyMode() {
    const c = isCompany();
    if ($("companyFields")) $("companyFields").hidden = !c;
    ["company", "bizid"].forEach((id) => { if ($(id)) $(id).disabled = !c; });
    if ($("nameLabel")) $("nameLabel").textContent = c ? "Contact person" : "Full name";
    if ($("homeLabel")) $("homeLabel").textContent = c ? "Billing address" : "Home address";
  }
  document.querySelectorAll('input[name="kind"]').forEach((r) => r.addEventListener("change", applyMode));
  applyMode();

  // example data for demos (all fictional)
  $("fill")?.addEventListener("click", () => {
    const c = isCompany();
    const v = {
      company: "Northwood Forestry Ltd", bizid: "1234567-8",
      name: c ? "Anna Example" : "Matti Example",
      email: "demo@example.com", phone: "+358 40 000 0000",
      home: c ? "Example Street 1, 70100 Kuopio" : "Sample Road 5, 70200 Kuopio",
      forest: "Near Sample Road, Kuopio", size: "24.7", unit: "hectares"
    };
    Object.keys(v).forEach((k) => { if ($(k) && !$(k).disabled) $(k).value = v[k]; });
    renderEstimate();
  });

  $("orderForm")?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const e = estimate();
    const unitLabel = $("unit").value;
    const c = isCompany();
    const items = [
      ...(c ? [["Company", $("company").value.trim()], ["Business ID", $("bizid").value.trim()]] : []),
      [c ? "Contact person" : "Name", $("name").value.trim()],
      ["Email", $("email").value.trim()],
      ["Phone", $("phone").value.trim()],
      [c ? "Billing address" : "Home address", $("home").value.trim()],
      ["Forest location", $("forest").value.trim()],
      ["Property size", $("size").value + " " + unitLabel + " (about " + (e ? e.ha.toFixed(1) : 0) + " ha)"]
    ];
    const sum = $("summary");
    sum.replaceChildren(...items.map(([l, v]) => row(l, v)), row("Estimated cost", (e && e.custom) ? "Custom quote" : eur(e ? e.total : 0), "total"));
    $("formPanel").hidden = true;
    $("donePanel").hidden = false;
    window.scrollTo(0, 0);
  });

  $("again")?.addEventListener("click", () => {
    $("orderForm").reset();
    applyMode();
    renderEstimate();
    $("donePanel").hidden = true;
    $("formPanel").hidden = false;
  });
});
