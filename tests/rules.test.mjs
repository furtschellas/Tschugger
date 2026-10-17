// Echte Firestore-Regeln (firestore.rules) im Firebase-Emulator: wer darf was lesen und schreiben?
// Läuft in GitHub (tests.yml/pages.yml): firebase emulators:exec --only firestore --project demo-tschugger "node tests/rules.test.mjs"
// Mit TESTS_OUT=<datei> werden die Resultate (nur Namen, ✓/✗) für das Log in der App geschrieben.
import fs from "node:fs";
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection, getDocs, serverTimestamp } from "firebase/firestore";

const RES = [], FAILS = [];
async function check(name, p) {
  let ok = false, info = "";
  try { await p; ok = true } catch (e) { info = String(e && e.message || e).slice(0, 160) }
  RES.push({ n: name, ok }); if (!ok) FAILS.push(name);
  console.log((ok ? "✓ " : "✗ ") + name + (ok ? "" : "  – " + info));
}

const env = await initializeTestEnvironment({
  projectId: "demo-tschugger",
  firestore: { rules: fs.readFileSync(new URL("../firestore.rules", import.meta.url), "utf8"), host: "127.0.0.1", port: 8080 },
});

// people: owner, admin, crew (role crew), power (roles.edit, push.send, events.add), stranger (signed in, not invited)
const U = {
  owner: ["uOwner", "furtschellas@gmail.com"], admin: ["uAdmin", "admin@test.ch"], crew: ["uCrew", "crew@test.ch"],
  power: ["uPower", "power@test.ch"], stranger: ["uStr", "str@test.ch"], other: ["uOther", "other@test.ch"],
};
const as = k => env.authenticatedContext(U[k][0], { email: U[k][1], email_verified: true }).firestore();
const anon = env.unauthenticatedContext().firestore();

await env.withSecurityRulesDisabled(async c => {
  const db = c.firestore();
  await setDoc(doc(db, "secret/key"), { k: "x" });
  await setDoc(doc(db, "admins/admin@test.ch"), { addedAt: 1 });
  await setDoc(doc(db, "roles/crew"), { name: "Crew", perms: ["view.plan", "view.crew"] });
  await setDoc(doc(db, "roles/power"), { name: "Power", perms: ["view.plan", "roles.edit", "push.send", "events.add"] });
  await setDoc(doc(db, "userroles/crew@test.ch"), { role: "crew" });
  await setDoc(doc(db, "userroles/power@test.ch"), { role: "power" });
  await setDoc(doc(db, "userroles/other@test.ch"), { role: "crew" });
  for (const k of ["crew", "power", "other"]) await setDoc(doc(db, "members/" + U[k][0]), { active: true, email: U[k][1], name: k });
  await setDoc(doc(db, "events/evPower"), { c: "x", at: 1, by: "uPower" });
  await setDoc(doc(db, "gcal/feed"), { c: "x" });
  await setDoc(doc(db, "secret/gcal"), { url: "https://calendar.google.com/x.ics" });
  await setDoc(doc(db, "push/uCrew_abcdefghij"), { c: "x", at: 1 });
  await setDoc(doc(db, "audit/a1"), { by: "crew@test.ch", at: 1, op: "x", col: "x", id: "x", sum: "x" });
});

// ---------- data key ----------
await check("Schlüssel: Crew-Mitglied darf lesen", assertSucceeds(getDoc(doc(as("crew"), "secret/key"))));
await check("Schlüssel: nicht eingeladene Person nicht", assertFails(getDoc(doc(as("stranger"), "secret/key"))));
await check("Schlüssel: ohne Anmeldung nicht", assertFails(getDoc(doc(anon, "secret/key"))));
await check("Schlüssel: niemand darf ihn ändern (auch Owner nicht)", assertFails(setDoc(doc(as("owner"), "secret/key"), { k: "y" })));

// ---------- no self-promotion ----------
await check("Rollen: Crew kann sich nicht selbst Admin machen", assertFails(setDoc(doc(as("crew"), "admins/crew@test.ch"), { addedAt: 1 })));
await check("Rollen: Crew kann sich keine andere Rolle geben", assertFails(setDoc(doc(as("crew"), "userroles/crew@test.ch"), { role: "power" })));
await check("Rollen: «Rollen bearbeiten» darf die eigene Rolle nicht ändern", assertFails(setDoc(doc(as("power"), "roles/power"), { name: "Power", perms: ["view.plan", "settings"] })));
await check("Rollen: «Rollen bearbeiten» vergibt nur Rechte, die man selbst hat", assertFails(setDoc(doc(as("power"), "roles/crew"), { name: "Crew", perms: ["settings"] })));
await check("Rollen: «Rollen bearbeiten» darf andere Rolle mit eigenen Rechten ändern", assertSucceeds(setDoc(doc(as("power"), "roles/crew"), { name: "Crew", perms: ["view.plan"] })));
await check("Rollen: Admin-Rolle nur für Admins", assertFails(setDoc(doc(as("power"), "roles/admin"), { name: "Admin", perms: [] })));
await check("Mitglied: Crew kann sich nicht selbst sperren/entsperren (active)", assertFails(updateDoc(doc(as("crew"), "members/uCrew"), { active: false })));
await check("Mitglied: eigenes Profil ändern geht", assertSucceeds(updateDoc(doc(as("crew"), "members/uCrew"), { phone: "+41 79 000 00 00" })));
await check("Mitglied: fremdes Profil nicht", assertFails(updateDoc(doc(as("crew"), "members/uOther"), { phone: "1" })));

// ---------- settings ----------
await check("Einstellungen: Owner darf ändern", assertSucceeds(setDoc(doc(as("owner"), "config/app"), { langs: ["de"] }, { merge: true })));
await check("Einstellungen: Admin ohne «Einstellungen» nicht", assertFails(setDoc(doc(as("admin"), "config/app"), { langs: ["de"] }, { merge: true })));
await check("Einstellungen: Crew nicht", assertFails(setDoc(doc(as("crew"), "config/app"), { langs: ["de"] }, { merge: true })));

// ---------- push ----------
await check("Push: eigenes Gerät lesen", assertSucceeds(getDoc(doc(as("crew"), "push/uCrew_abcdefghij"))));
await check("Push: fremdes Gerät nicht lesen", assertFails(getDoc(doc(as("other"), "push/uCrew_abcdefghij"))));
await check("Push: Geräteliste nur Admins", assertFails(getDocs(collection(as("crew"), "push"))));
await check("Nachricht an alle: ohne «Push senden» nicht", assertFails(addDoc(collection(as("crew"), "broadcasts"), { c: "x", at: serverTimestamp() })));
await check("Nachricht an alle: mit «Push senden» geht", assertSucceeds(addDoc(collection(as("power"), "broadcasts"), { c: "x", at: serverTimestamp() })));
await check("Nachricht an alle: keine Zusatzfelder", assertFails(addDoc(collection(as("power"), "broadcasts"), { c: "x", at: serverTimestamp(), roles: ["owner"] })));
await check("Nachricht an alle: Verlauf nur mit Recht lesbar", assertFails(getDocs(collection(as("crew"), "broadcasts"))));

// ---------- own appointments ----------
await check("Termine: Crew-Mitglied darf lesen", assertSucceeds(getDocs(collection(as("crew"), "events"))));
await check("Termine: nicht eingeladene Person nicht", assertFails(getDocs(collection(as("stranger"), "events"))));
await check("Termine: anlegen ohne Recht nicht", assertFails(addDoc(collection(as("crew"), "events"), { c: "x", at: serverTimestamp(), by: "uCrew" })));
await check("Termine: anlegen mit «Eigene Termine erstellen»", assertSucceeds(addDoc(collection(as("power"), "events"), { c: "x", at: serverTimestamp(), by: "uPower" })));
await check("Termine: nicht im Namen einer anderen Person", assertFails(addDoc(collection(as("power"), "events"), { c: "x", at: serverTimestamp(), by: "uCrew" })));
await check("Termine: fremden Termin nicht ändern", assertFails(updateDoc(doc(as("other"), "events/evPower"), { c: "y" })));
await check("Termine: fremden Termin nicht löschen", assertFails(deleteDoc(doc(as("crew"), "events/evPower"))));
await check("Termine: eigenen Termin ändern", assertSucceeds(updateDoc(doc(as("power"), "events/evPower"), { c: "y" })));
await check("Termine: Ersteller nicht umschreiben", assertFails(updateDoc(doc(as("power"), "events/evPower"), { by: "uCrew" })));
await check("Termine: lange Notiz (bis 20000 Zeichen verschlüsselt) geht", assertSucceeds(updateDoc(doc(as("power"), "events/evPower"), { c: "x".repeat(19000) })));
await check("Termine: zu gross wird abgelehnt", assertFails(updateDoc(doc(as("power"), "events/evPower"), { c: "x".repeat(21000) })));
await check("Termine: Kalender-ID beim Anlegen erlaubt", assertSucceeds(addDoc(collection(as("power"), "events"), { c: "x", at: serverTimestamp(), by: "uPower", gc: "g1" })));
await check("Termine: keine anderen Zusatzfelder", assertFails(addDoc(collection(as("power"), "events"), { c: "x", at: serverTimestamp(), by: "uPower", roles: ["crew"] })));
await check("Termine: Admin darf löschen", assertSucceeds(deleteDoc(doc(as("admin"), "events/evPower"))));

// ---------- Google Calendar ----------
await check("Google Kalender: geheime Adresse nur mit «Einstellungen»", assertFails(getDoc(doc(as("admin"), "secret/gcal"))));
await check("Google Kalender: Owner sieht die Adresse", assertSucceeds(getDoc(doc(as("owner"), "secret/gcal"))));
await check("Google Kalender: Liste für «Termine erstellen» lesbar", assertSucceeds(getDoc(doc(as("power"), "gcal/feed"))));
await check("Google Kalender: Crew ohne Recht nicht", assertFails(getDoc(doc(as("crew"), "gcal/feed"))));
await check("Google Kalender: niemand schreibt die Liste aus der App", assertFails(setDoc(doc(as("owner"), "gcal/feed"), { c: "y" })));

// ---------- prefs, log, everything else ----------
await check("Einstellungen der Person: nur die eigenen", assertFails(getDoc(doc(as("crew"), "prefs/uOther"))));
await check("Einstellungen der Person: höchstens 16 Felder", assertFails(setDoc(doc(as("crew"), "prefs/uCrew"), Object.fromEntries([...Array(17)].map((_, i) => ["k" + i, "v"])))));
await check("Protokoll: Crew kann es nicht lesen", assertFails(getDocs(collection(as("crew"), "audit"))));
await check("Protokoll: Einträge löscht nur der Owner", assertFails(deleteDoc(doc(as("admin"), "audit/a1"))));
await check("Unbekannte Sammlung: alles gesperrt", assertFails(setDoc(doc(as("owner"), "irgendwas/x"), { a: 1 })));

await env.cleanup();
console.log(`\nRegeln: ${FAILS.length ? FAILS.length + " FEHLER" : "ALLES OK"}`);
if (process.env.TESTS_OUT) fs.writeFileSync(process.env.TESTS_OUT, JSON.stringify({ suite: "Firestore-Regeln", at: Date.now(), ok: !FAILS.length, n: RES.length, fail: FAILS.length, checks: RES }));
process.exit(FAILS.length ? 1 : 0);
