// Einstellungen der aktuellen Bestellrunde.
// Alles, was mit PLATZHALTER markiert ist, vor dem Teilen anpassen.
const RUNDE = {
  titel: "Winterrunde 2026/27",
  stichtag: "2026-11-30T23:59:00",          // Bestellschluss
  lieferung: "Mitte Januar 2027",           // voraussichtliche Ausgabe der Kisten
  organisator: "PLATZHALTER Name",
  email: "PLATZHALTER@example.com",         // hierhin gehen die Bestellungen
  iban: "DE00 0000 0000 0000 0000 00",      // PLATZHALTER
  kontoinhaber: "PLATZHALTER Name",
  paypalme: "",                             // z. B. "https://paypal.me/deinname" (leer = ausblenden)
  transport: 280,                           // Palette Sizilien → Deutschland, pauschal in € (PLATZHALTER)
  abholpunkte: ["Bei mir zu Hause", "Gemeinsamer Treffpunkt (wird angesagt)"],
};

// Die Produzenten. Texte sind Platzhalter, bitte mit echten Angaben ersetzen.
const PRODUZENTEN = {
  agrumi: {
    name: "PLATZHALTER Zitrushof", ort: "Ebene von Catania, am Fuß des Ätna",
    text: "Familienbetrieb mit Orangen-, Zitronen- und Mandarinenhainen auf Vulkanboden. Geerntet wird erst kurz vor dem Versand.",
  },
  mandorle: {
    name: "PLATZHALTER Mandelhof", ort: "Avola und Noto, Provinz Syrakus",
    text: "Mandeln der Sorten Pizzuta und Romana, von Hand geknackt und geschält. Die Avola-Mandel gilt als eine der besten der Welt.",
  },
  olio: {
    name: "PLATZHALTER Ölmühle", ort: "Monti Iblei, Provinz Ragusa",
    text: "Kaltgepresstes Olivenöl extra vergine aus der Sorte Tonda Iblea, frisch aus der neuen Ernte, abgefüllt im 5-Liter-Kanister.",
  },
};

// Die einzelnen Produkte. Aus ihnen entsteht die Einkaufsliste je Produzent.
// einkauf = dein Einkaufspreis je Einheit in Sizilien (PLATZHALTER).
const PRODUKTE = {
  orangen:    { name: "Orangen Tarocco",            einheit: "kg",       produzent: "agrumi",   einkauf: 1.6,
                text: "Blutorangen mit roten Streifen im Fruchtfleisch, süß-säuerlich, unbehandelt." },
  mandarinen: { name: "Mandarinen",                 einheit: "kg",       produzent: "agrumi",   einkauf: 1.9,
                text: "Späte sizilianische Mandarinen, sehr aromatisch, mit Kernen." },
  zitronen:   { name: "Zitronen",                   einheit: "kg",       produzent: "agrumi",   einkauf: 1.7,
                text: "Femminello-Zitronen mit essbarer Schale, unbehandelt." },
  avocado:    { name: "Avocado (saisonal)",         einheit: "kg",       produzent: "agrumi",   einkauf: 4.5,
                text: "Hass-Avocados aus sizilianischem Anbau, nur wenn gerade Ernte ist." },
  mandeln:    { name: "Mandeln Avola, geschält",    einheit: "kg",       produzent: "mandorle", einkauf: 13,
                text: "Ganze, geschälte Mandeln, ungeröstet." },
  oel:        { name: "Olivenöl extra vergine",     einheit: "Kanister 5 l", produzent: "olio", einkauf: 52,
                text: "Neue Ernte, kaltgepresst, im 5-Liter-Kanister." },
};

// Die drei Kisten zu je etwa 11 kg. inhalt = Menge je Produkt.
const KISTEN = [
  {
    id: "A", name: "Agrumi", untertitel: "Die Zitruskiste",
    text: "Orangen, Mandarinen und Zitronen, frisch vom Baum.",
    inhalt: { orangen: 6, mandarinen: 3, zitronen: 2 },
    preis: 34,
  },
  {
    id: "B", name: "Agrumi e Mandorle", untertitel: "Zitrus mit Mandeln",
    text: "Viel Zitrus und dazu ein Kilo Mandeln aus Avola.",
    inhalt: { orangen: 6, mandarinen: 2, zitronen: 2, mandeln: 1 },
    preis: 46,
  },
  {
    id: "C", name: "Dispensa", untertitel: "Die Vorratskiste",
    text: "Ein Kanister Olivenöl, Mandeln und Zitrus für die Küche.",
    inhalt: { oel: 1, mandeln: 1, orangen: 3, zitronen: 2 },
    preis: 98,
  },
];

// Zusätzlich einzeln bestellbar. verfuegbar: false blendet einen Artikel aus.
const EXTRAS = [
  { produkt: "oel",      menge: 1, preis: 70, verfuegbar: true },
  { produkt: "mandeln",  menge: 1, preis: 19, verfuegbar: true },
  { produkt: "avocado",  menge: 2, preis: 14, verfuegbar: true },
];

const euro = (n) => n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
const zahl = (n) => n.toLocaleString("de-DE", { maximumFractionDigits: 2 });

// Einkaufspreis einer Kiste aus ihrem Inhalt
const kistenEinkauf = (k) => Object.entries(k.inhalt).reduce((s, [p, m]) => s + PRODUKTE[p].einkauf * m, 0);

// Bestellcode: eine Zeile, die der Organisator auf der Rundenseite einfügt.
// RESPIRO|Name|E-Mail|Abholung|A=1;B=0;C=2;X0=1;...|Notiz
function bestellcode(b) {
  const pos = Object.entries(b.mengen).filter(([, n]) => n > 0).map(([k, n]) => `${k}=${n}`).join(";");
  const sauber = (s) => String(s || "").replace(/[|\n\r]/g, " ").trim();
  return ["RESPIRO", sauber(b.name), sauber(b.email), sauber(b.abholung), pos, sauber(b.notiz)].join("|");
}
function liesBestellcodes(text) {
  return text.split(/\r?\n/).map((z) => z.trim()).filter((z) => z.startsWith("RESPIRO|")).map((z) => {
    const [, name, email, abholung, pos, notiz] = z.split("|");
    const mengen = {};
    (pos || "").split(";").filter(Boolean).forEach((p) => { const [k, n] = p.split("="); mengen[k] = Number(n) || 0; });
    return { name, email, abholung, mengen, notiz: notiz || "" };
  });
}

// Alle bestellbaren Positionen: Kisten (A, B, C) und Extras (X0, X1, ...)
function positionen() {
  const liste = KISTEN.map((k) => ({ key: k.id, titel: `Kiste ${k.id} · ${k.name}`, preis: k.preis, inhalt: k.inhalt, einkauf: kistenEinkauf(k) }));
  EXTRAS.forEach((x, i) => {
    if (!x.verfuegbar) return;
    const p = PRODUKTE[x.produkt];
    liste.push({ key: "X" + i, titel: `${p.name} (${zahl(x.menge)} ${p.einheit})`, preis: x.preis,
      inhalt: { [x.produkt]: x.menge }, einkauf: p.einkauf * x.menge });
  });
  return liste;
}
