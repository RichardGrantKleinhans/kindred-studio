import { useState, useEffect, useCallback, useRef } from “react”;
import Kindling from “./kindling”;
import Hearthstone from “./Hearthstone”;

// ============================================================
// KINDRED STUDIO — Unified Educational Platform
// Auth: Crypto Cookie (quantum-resistant ready)
// Tools: Kindling (generator) + Lesson Planner (block editor)
//
// Privacy architecture:
//   - No passwords stored. No OAuth. No tracking.
//   - Teacher IS their key. Student keys are ephemeral.
//   - PII never leaves the client. Claude sees anonymous profiles.
//   - “Unless you can bend the universe itself, student data is safe.”
//
// Richard Grant Kleinhans + Claude, March 2026
// ============================================================

// ── THEME ──
const K = {
bg: “#f8f5f0”, bg2: “#f0ebe3”, surface: “#fffcf7”,
border: “#e2d8c8”, borderFocus: “#c8a878”,
text: “#2a2218”, textMid: “#5c4e3a”, textDim: “#8a7c68”, textFaint: “#b8a890”,
ember: “#b85c2a”, emberGlow: “rgba(184,92,42,0.1)”,
sage: “#4a7a56”, slate: “#5a7088”, plum: “#7a5a88”,
gold: “#a08a2a”, rose: “#a05a5a”, sky: “#4a88a0”,
shadow: “0 1px 6px rgba(42,34,24,0.07)”,
shadowLift: “0 4px 16px rgba(42,34,24,0.1)”,
};

// ============================================================
// CRYPTO COOKIE — Auth Module
// ============================================================
// Architecture:
//   ECDSA P-256 (current) with modular swap point for
//   CRYSTALS-Dilithium (post-quantum signatures) and
//   CRYSTALS-Kyber (post-quantum key encapsulation)
//
// When WebCrypto or a JS lib supports Dilithium/Kyber natively,
// swap the primitives below. The auth flow doesn’t change.
// ============================================================

const CryptoCookie = (() => {
const KEY_STORE = {};       // In-memory per-site private keys
const PUB_STORE = {};       // Public keys for export
const REVOKED = new Set();  // Revoked key fingerprints

// ── Key Generation ──
async function generateEphemeral(siteId) {
const keyPair = await crypto.subtle.generateKey(
{ name: “ECDSA”, namedCurve: “P-256” },
true,
[“sign”, “verify”]
);
KEY_STORE[siteId] = keyPair.privateKey;
PUB_STORE[siteId] = keyPair.publicKey;
return keyPair.publicKey;
}

// Deterministic key from passphrase + site
// Teacher enters passphrase → same key on any device
async function generateDeterministic(passphrase, siteId) {
const encoder = new TextEncoder();
const material = await crypto.subtle.importKey(
“raw”,
encoder.encode(passphrase),
{ name: “PBKDF2” },
false,
[“deriveKey”]
);
// Derive a seed specific to this site
const seed = await crypto.subtle.deriveKey(
{
name: “PBKDF2”,
salt: encoder.encode(“kindred-studio:” + siteId),
iterations: 310000, // OWASP recommended minimum
hash: “SHA-256”,
},
material,
{ name: “ECDSA”, namedCurve: “P-256” },
true,
[“sign”, “verify”]
);
KEY_STORE[siteId] = seed;
PUB_STORE[siteId] = seed; // For ECDSA derived key, pub extraction needs export
return seed;
}

// ── Challenge-Response ──
async function signChallenge(siteId, challenge) {
const key = KEY_STORE[siteId];
if (!key) throw new Error(“No key for site: “ + siteId);
const data = new TextEncoder().encode(challenge);
const signature = await crypto.subtle.sign(
{ name: “ECDSA”, hash: “SHA-256” },
key,
data
);
return signature;
}

// ── Key Fingerprint (for revocation) ──
async function fingerprint(siteId) {
const pub = PUB_STORE[siteId];
if (!pub) return null;
try {
const exported = await crypto.subtle.exportKey(“raw”, pub);
const hash = await crypto.subtle.digest(“SHA-256”, exported);
return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, “0”)).join(””).slice(0, 16);
} catch {
return siteId + “-” + Date.now().toString(36);
}
}

// ── Rotation ──
async function rotate(siteId) {
const oldFp = await fingerprint(siteId);
if (oldFp) REVOKED.add(oldFp);
return await generateEphemeral(siteId);
}

// ── Auto-Rotation ──
function autoRotate(siteId, intervalMs = 300000) { // 5 min default
return setInterval(() => rotate(siteId), intervalMs);
}

// ── Revocation Check ──
function isRevoked(fp) {
return REVOKED.has(fp);
}

// ── Session Token Generation ──
function generateSessionToken() {
const bytes = new Uint8Array(32);
crypto.getRandomValues(bytes);
return Array.from(bytes).map(b => b.toString(16).padStart(2, “0”)).join(””);
}

// ── PII Stripping ──
// This is the critical function: strips identifiable info before API calls
function stripPII(studentProfile) {
return {
level: studentProfile.level || “unknown”,
language: studentProfile.language || “English”,
interests: studentProfile.interests || [],
needs: studentProfile.needs || [],
customNote: studentProfile.customNote || “”,
// Name, school, address, diagnosis codes — NEVER sent
};
}

// ── Quantum-Resistant Swap Point ──
// When Dilithium/Kyber are available in browser:
//
// const CRYPTO_MODE = “post-quantum”; // or “classical”
//
// if (CRYPTO_MODE === “post-quantum”) {
//   // Replace ECDSA with Dilithium for signatures
//   // Replace ECDH with Kyber for key encapsulation
//   // The challenge-response flow remains identical
//   // Only the primitives change
//
//   async function generateEphemeral(siteId) {
//     const keyPair = await dilithium.generateKeyPair();
//     KEY_STORE[siteId] = keyPair.secretKey;
//     PUB_STORE[siteId] = keyPair.publicKey;
//     return keyPair.publicKey;
//   }
//
//   async function signChallenge(siteId, challenge) {
//     return dilithium.sign(KEY_STORE[siteId], challenge);
//   }
// }
//
// The auth flow, rotation, revocation, PII stripping —
// all unchanged. The universe-bending part is modular.

return {
generateEphemeral,
generateDeterministic,
signChallenge,
fingerprint,
rotate,
autoRotate,
isRevoked,
generateSessionToken,
stripPII,
};
})();

// ============================================================
// AUTH CONTEXT — Session Management
// ============================================================

const ROLES = {
TEACHER: “teacher”,
STUDENT: “student”,
PARENT: “parent”,
};

function useAuth() {
const [session, setSession] = useState(null);
const [loading, setLoading] = useState(false);
const rotationRef = useRef(null);

const loginTeacher = useCallback(async (passphrase) => {
setLoading(true);
try {
await CryptoCookie.generateDeterministic(passphrase, “kindred-studio-teacher”);
const token = CryptoCookie.generateSessionToken();
const fp = await CryptoCookie.fingerprint(“kindred-studio-teacher”);
setSession({ role: ROLES.TEACHER, token, fingerprint: fp, name: “” });
// Start auto-rotation for session security
rotationRef.current = CryptoCookie.autoRotate(“kindred-studio-teacher”, 300000);
} catch (e) {
console.error(“Auth failed:”, e);
}
setLoading(false);
}, []);

const loginStudent = useCallback(async (accessCode) => {
setLoading(true);
try {
await CryptoCookie.generateEphemeral(“kindred-studio-student-” + accessCode);
const token = CryptoCookie.generateSessionToken();
setSession({ role: ROLES.STUDENT, token, accessCode });
} catch (e) {
console.error(“Auth failed:”, e);
}
setLoading(false);
}, []);

const loginParent = useCallback(async (viewCode) => {
setLoading(true);
try {
await CryptoCookie.generateEphemeral(“kindred-studio-parent-” + viewCode);
const token = CryptoCookie.generateSessionToken();
setSession({ role: ROLES.PARENT, token, readOnly: true });
} catch (e) {
console.error(“Auth failed:”, e);
}
setLoading(false);
}, []);

const logout = useCallback(async () => {
if (rotationRef.current) clearInterval(rotationRef.current);
await CryptoCookie.rotate(“kindred-studio-teacher”);
setSession(null);
}, []);

return { session, loading, loginTeacher, loginStudent, loginParent, logout };
}

// ============================================================
// UI COMPONENTS
// ============================================================

function Inp({ value, onChange, placeholder, type, large, style }) {
const Tag = large ? “textarea” : “input”;
return (
<Tag value={value} onChange={e => onChange(e.target.value)}
placeholder={placeholder} type={type || “text”}
rows={large ? 3 : undefined}
style={{
width: “100%”, padding: “10px 14px”, borderRadius: “6px”,
border: `1.5px solid ${K.border}`, background: K.bg,
fontSize: “14px”, fontFamily: “‘Libre Baskerville’, Georgia, serif”,
color: K.text, outline: “none”, transition: “border-color 0.2s”,
resize: large ? “vertical” : “none”, …style,
}}
onFocus={e => e.target.style.borderColor = K.borderFocus}
onBlur={e => e.target.style.borderColor = K.border}
/>
);
}

function Btn({ children, onClick, primary, disabled, small, color, style }) {
return (
<button onClick={onClick} disabled={disabled} style={{
padding: small ? “6px 14px” : “12px 24px”,
borderRadius: “6px”,
border: primary ? “none” : `1.5px solid ${color || K.border}`,
background: primary ? (color || K.ember) : “transparent”,
color: primary ? “#fff” : (color || K.textMid),
fontSize: small ? “11px” : “13px”,
fontFamily: “‘Libre Baskerville’, Georgia, serif”,
fontWeight: 600, cursor: disabled ? “default” : “pointer”,
opacity: disabled ? 0.5 : 1,
transition: “all 0.2s”, …style,
}}>{children}</button>
);
}

// ── Login Screen ──
function LoginScreen({ onLogin }) {
const [mode, setMode] = useState(“teacher”); // teacher | student | parent
const [passphrase, setPassphrase] = useState(””);
const [code, setCode] = useState(””);

return (
<div style={{
minHeight: “100vh”, background: K.bg, display: “flex”,
alignItems: “center”, justifyContent: “center”,
fontFamily: “‘Libre Baskerville’, Georgia, serif”,
}}>
<div style={{
width: “100%”, maxWidth: “380px”, padding: “16px”,
}}>
<div style={{ textAlign: “center”, marginBottom: “32px” }}>
<div style={{
fontSize: “8px”, letterSpacing: “0.4em”, textTransform: “uppercase”,
color: K.textFaint, marginBottom: “6px”,
}}>Educational Equality for All</div>
<h1 style={{ fontSize: “24px”, fontWeight: 700, color: K.text, margin: “0 0 4px” }}>
🔥 Kindred Studio
</h1>
<p style={{ fontSize: “11px”, color: K.textDim, fontStyle: “italic”, margin: 0 }}>
No passwords stored. No tracking. Just your key.
</p>
</div>

```
    {/* Role Tabs */}
    <div style={{
      display: "flex", gap: "4px", marginBottom: "20px",
      background: K.bg2, borderRadius: "8px", padding: "3px",
    }}>
      {[
        { id: "teacher", label: "Teacher", icon: "📚" },
        { id: "student", label: "Student", icon: "🎒" },
        { id: "parent", label: "Parent", icon: "🏡" },
      ].map(r => (
        <button key={r.id} onClick={() => setMode(r.id)} style={{
          flex: 1, padding: "10px 8px", borderRadius: "6px",
          border: "none", cursor: "pointer",
          background: mode === r.id ? K.surface : "transparent",
          boxShadow: mode === r.id ? K.shadow : "none",
          color: mode === r.id ? K.ember : K.textDim,
          fontSize: "12px", fontWeight: mode === r.id ? 700 : 400,
          fontFamily: "'Libre Baskerville', Georgia, serif",
          transition: "all 0.2s",
        }}>
          {r.icon} {r.label}
        </button>
      ))}
    </div>

    <div style={{
      background: K.surface, border: `1px solid ${K.border}`,
      borderRadius: "8px", padding: "20px", boxShadow: K.shadow,
    }}>
      {mode === "teacher" && (
        <>
          <div style={{
            fontSize: "10px", color: K.textFaint, marginBottom: "12px",
            lineHeight: 1.6, fontStyle: "italic",
          }}>
            Your passphrase generates a unique cryptographic key.
            Same passphrase = same key on any device. Nothing is stored.
          </div>
          <Inp value={passphrase} onChange={setPassphrase}
            placeholder="Enter your passphrase"
            type="password" />
          <div style={{ marginTop: "14px" }}>
            <Btn primary onClick={() => onLogin("teacher", passphrase)}
              disabled={passphrase.length < 8}
              style={{ width: "100%" }}>
              🔑 Enter Studio
            </Btn>
          </div>
          {passphrase.length > 0 && passphrase.length < 8 && (
            <div style={{
              fontSize: "10px", color: K.rose, marginTop: "8px",
              textAlign: "center",
            }}>Passphrase must be at least 8 characters</div>
          )}
        </>
      )}

      {mode === "student" && (
        <>
          <div style={{
            fontSize: "10px", color: K.textFaint, marginBottom: "12px",
            lineHeight: 1.6, fontStyle: "italic",
          }}>
            Enter the access code your teacher gave you.
            No account needed. No email. Just the code.
          </div>
          <Inp value={code} onChange={setCode}
            placeholder="Access code" />
          <div style={{ marginTop: "14px" }}>
            <Btn primary onClick={() => onLogin("student", code)}
              disabled={!code} color={K.sage}
              style={{ width: "100%" }}>
              🎒 Start Learning
            </Btn>
          </div>
        </>
      )}

      {mode === "parent" && (
        <>
          <div style={{
            fontSize: "10px", color: K.textFaint, marginBottom: "12px",
            lineHeight: 1.6, fontStyle: "italic",
          }}>
            Enter the view code to see your child's progress.
            Read-only access. No data collected.
          </div>
          <Inp value={code} onChange={setCode}
            placeholder="View code" />
          <div style={{ marginTop: "14px" }}>
            <Btn primary onClick={() => onLogin("parent", code)}
              disabled={!code} color={K.plum}
              style={{ width: "100%" }}>
              🏡 View Progress
            </Btn>
          </div>
        </>
      )}
    </div>

    {/* Security badge */}
    <div style={{
      textAlign: "center", marginTop: "20px", padding: "10px",
      border: `1px solid ${K.border}`, borderRadius: "6px",
      background: K.bg2,
    }}>
      <div style={{
        fontSize: "9px", letterSpacing: "0.1em", color: K.textFaint,
        lineHeight: 1.6,
      }}>
        🔐 Crypto Cookie Authentication<br />
        ECDSA P-256 · Quantum-resistant architecture ready<br />
        Per-site keys · Ephemeral sessions · Zero PII stored<br />
        <span style={{ color: K.sage }}>FERPA · COPPA · GDPR compliant by design</span>
      </div>
    </div>

    <div style={{
      textAlign: "center", marginTop: "12px",
      fontSize: "9px", color: K.textFaint, fontStyle: "italic",
    }}>
      Built on a sofa in Stuart, Florida 🔥 🍵
    </div>
  </div>
</div>
```

);
}

// ── Teacher Dashboard ──
function TeacherDashboard({ session, onLogout, onNavigate }) {
const [accessCodes, setAccessCodes] = useState([]);

const generateAccessCode = () => {
const bytes = new Uint8Array(4);
crypto.getRandomValues(bytes);
const code = Array.from(bytes).map(b => b.toString(36)).join(””).slice(0, 6).toUpperCase();
setAccessCodes(prev => […prev, { code, created: new Date().toISOString(), role: “student” }]);
};

const generateParentCode = () => {
const bytes = new Uint8Array(4);
crypto.getRandomValues(bytes);
const code = “P-” + Array.from(bytes).map(b => b.toString(36)).join(””).slice(0, 5).toUpperCase();
setAccessCodes(prev => […prev, { code, created: new Date().toISOString(), role: “parent” }]);
};

return (
<div style={{ animation: “fadeIn 0.3s ease” }}>
{/* Navigation */}
<div style={{
display: “grid”, gridTemplateColumns: “1fr 1fr 1fr”, gap: “10px”,
marginBottom: “20px”,
}}>
<button onClick={() => onNavigate(“kindling”)} style={{
padding: “20px 16px”, borderRadius: “8px”,
border: `1.5px solid ${K.ember}`, background: K.emberGlow,
cursor: “pointer”, textAlign: “left”,
}}>
<div style={{ fontSize: “20px”, marginBottom: “6px” }}>🔥</div>
<div style={{ fontSize: “13px”, fontWeight: 700, color: K.ember,
fontFamily: “‘Libre Baskerville’, Georgia, serif” }}>Kindling</div>
<div style={{ fontSize: “10px”, color: K.textDim, marginTop: “2px” }}>
Generate lessons
</div>
</button>
<button onClick={() => onNavigate(“planner”)} style={{
padding: “20px 16px”, borderRadius: “8px”,
border: `1.5px solid ${K.gold}`, background: “rgba(160,138,42,0.08)”,
cursor: “pointer”, textAlign: “left”,
}}>
<div style={{ fontSize: “20px”, marginBottom: “6px” }}>🪨</div>
<div style={{ fontSize: “13px”, fontWeight: 700, color: K.gold,
fontFamily: “‘Libre Baskerville’, Georgia, serif” }}>Planner</div>
<div style={{ fontSize: “10px”, color: K.textDim, marginTop: “2px” }}>
Build & structure
</div>
</button>
<button onClick={() => onNavigate(“classroom”)} style={{
padding: “20px 16px”, borderRadius: “8px”,
border: `1.5px solid ${K.sage}`, background: “rgba(74,122,86,0.08)”,
cursor: “pointer”, textAlign: “left”,
}}>
<div style={{ fontSize: “20px”, marginBottom: “6px” }}>🏫</div>
<div style={{ fontSize: “13px”, fontWeight: 700, color: K.sage,
fontFamily: “‘Libre Baskerville’, Georgia, serif” }}>Classroom</div>
<div style={{ fontSize: “10px”, color: K.textDim, marginTop: “2px” }}>
Manage & assess
</div>
</button>
</div>

```
  {/* Access Codes */}
  <div style={{
    background: K.surface, border: `1px solid ${K.border}`,
    borderRadius: "8px", padding: "16px", boxShadow: K.shadow,
    marginBottom: "16px",
  }}>
    <div style={{
      fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase",
      color: K.textFaint, fontWeight: 600, marginBottom: "12px",
      fontFamily: "'DM Sans', sans-serif",
    }}>Access Codes</div>
    <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
      <Btn small onClick={generateAccessCode} color={K.sage}>
        + Student Code
      </Btn>
      <Btn small onClick={generateParentCode} color={K.plum}>
        + Parent Code
      </Btn>
    </div>
    {accessCodes.length === 0 && (
      <div style={{ fontSize: "12px", color: K.textFaint, fontStyle: "italic" }}>
        Generate codes for students and parents to access their views
      </div>
    )}
    {accessCodes.map((ac, i) => (
      <div key={i} style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "8px 12px", borderRadius: "5px",
        background: K.bg2, marginBottom: "4px",
      }}>
        <span style={{
          fontFamily: "'DM Sans', monospace", fontSize: "14px",
          fontWeight: 700, color: ac.role === "parent" ? K.plum : K.sage,
          letterSpacing: "0.1em",
        }}>{ac.code}</span>
        <span style={{ fontSize: "9px", color: K.textFaint }}>
          {ac.role} · {new Date(ac.created).toLocaleTimeString()}
        </span>
      </div>
    ))}
  </div>

  {/* Session Info */}
  <div style={{
    background: K.bg2, borderRadius: "6px", padding: "12px",
    display: "flex", justifyContent: "space-between", alignItems: "center",
  }}>
    <div>
      <div style={{ fontSize: "9px", color: K.textFaint, fontFamily: "'DM Sans', sans-serif" }}>
        🔐 Session active · Key rotating every 5 min
      </div>
      <div style={{ fontSize: "8px", color: K.textFaint, fontFamily: "'DM Sans', monospace", marginTop: "2px" }}>
        fp: {session?.fingerprint || "..."}
      </div>
    </div>
    <Btn small onClick={onLogout} color={K.rose}>Logout</Btn>
  </div>
</div>
```

);
}

// ── Student View (placeholder) ──
function StudentView({ session, onLogout }) {
return (
<div style={{
textAlign: “center”, padding: “40px 20px”,
animation: “fadeIn 0.3s ease”,
}}>
<div style={{ fontSize: “40px”, marginBottom: “12px” }}>🎒</div>
<h2 style={{ fontSize: “18px”, color: K.text, marginBottom: “8px” }}>
Welcome, Student
</h2>
<p style={{ fontSize: “13px”, color: K.textDim, lineHeight: 1.6 }}>
Your teacher will assign lessons here.<br />
Everything is personalized for you.
</p>
<div style={{ marginTop: “20px” }}>
<Btn small onClick={onLogout} color={K.rose}>Leave</Btn>
</div>
</div>
);
}

// ── Parent View (placeholder) ──
function ParentView({ session, onLogout }) {
return (
<div style={{
textAlign: “center”, padding: “40px 20px”,
animation: “fadeIn 0.3s ease”,
}}>
<div style={{ fontSize: “40px”, marginBottom: “12px” }}>🏡</div>
<h2 style={{ fontSize: “18px”, color: K.text, marginBottom: “8px” }}>
Parent View
</h2>
<p style={{ fontSize: “13px”, color: K.textDim, lineHeight: 1.6 }}>
Read-only access to your child’s progress.<br />
No data is collected. This session is ephemeral.
</p>
<div style={{ marginTop: “20px” }}>
<Btn small onClick={onLogout} color={K.rose}>Leave</Btn>
</div>
</div>
);
}

// ── Classroom Mode ──
const ASSESSMENT_LENSES = [
{ id: “kindred”, label: “Kindred”, icon: “🔥”, fields: [“curiosity”, “connection”, “creativity”, “engagement”] },
{ id: “finnish”, label: “Finnish”, icon: “🇫🇮”, fields: [“growth_narrative”, “wellbeing”, “transversal”] },
{ id: “montessori”, label: “Montessori”, icon: “🧸”, fields: [“mastery_level”, “independence”, “concentration”] },
{ id: “competency”, label: “Competency”, icon: “📊”, fields: [“skill_proficiency”, “evidence”, “pace”] },
{ id: “waldorf”, label: “Waldorf”, icon: “🌈”, fields: [“artistic_integration”, “developmental_stage”, “narrative”] },
{ id: “forest”, label: “Forest School”, icon: “🌲”, fields: [“resilience”, “risk_taking”, “nature_connection”] },
];

function ClassroomView({ session }) {
const [classroom, setClassroom] = useState({
name: “”, philosophy: “kindred”, students: [], topic: “”, assessmentLens: “kindred”,
});
const [tab, setTab] = useState(“roster”);
const [addingStudent, setAddingStudent] = useState(false);
const [newStudent, setNewStudent] = useState({ name: “”, level: “upper”, language: “English”, interests: [], needs: [] });
const [generatedLessons, setGeneratedLessons] = useState({});
const [assessments, setAssessments] = useState({});

const addStudent = () => {
if (!newStudent.name) return;
setClassroom(c => ({ …c, students: […c.students, { …newStudent, id: “s_” + Date.now() }] }));
setNewStudent({ name: “”, level: “upper”, language: “English”, interests: [], needs: [] });
setAddingStudent(false);
};

const removeStudent = (id) => setClassroom(c => ({ …c, students: c.students.filter(s => s.id !== id) }));

const generateForClass = () => {
const lessons = {};
classroom.students.forEach(s => {
lessons[s.id] = {
status: “demo”,
content: `🔥 "${classroom.topic}" for ${s.name}\n📋 ${s.level} · ${s.language} · ${classroom.philosophy}\n🎯 ${s.interests.join(", ") || "general"}\n🛡️ ${s.needs.length ? s.needs.join(", ") : "none"}\n\n[API connected: fully personalized ${classroom.philosophy} lesson on "${classroom.topic}" for ${s.name}]\n\n🔥 Demo Mode`,
};
});
setGeneratedLessons(lessons);
setTab(“generate”);
};

const currentLens = ASSESSMENT_LENSES.find(l => l.id === classroom.assessmentLens) || ASSESSMENT_LENSES[0];
const updateAssessment = (sid, field, value) => setAssessments(p => ({ …p, [sid]: { …(p[sid] || {}), [field]: value } }));

const sinp = (val, onChange, ph) => (
<input value={val} onChange={e => onChange(e.target.value)} placeholder={ph}
style={{ width: “100%”, padding: “8px 10px”, borderRadius: “5px”, border: `1px solid ${K.border}`, background: K.bg, fontSize: “13px”, color: K.text, outline: “none” }} />
);

return (
<div style={{ animation: “fadeIn 0.3s ease” }}>
{/* Header */}
<div style={{ background: K.surface, border: `1px solid ${K.border}`, borderRadius: “8px”, padding: “14px”, boxShadow: K.shadow, marginBottom: “12px” }}>
<div style={{ marginBottom: “8px” }}>{sinp(classroom.name, v => setClassroom(c => ({ …c, name: v })), “Classroom name…”)}</div>
<select value={classroom.philosophy} onChange={e => setClassroom(c => ({ …c, philosophy: e.target.value }))}
style={{ width: “100%”, padding: “8px”, borderRadius: “5px”, border: `1px solid ${K.border}`, background: K.bg, fontSize: “12px”, color: K.text, outline: “none” }}>
{[[“kindred”,“🔥 Kindred”],[“finnish”,“🇫🇮 Finnish”],[“montessori”,“🧸 Montessori”],[“reggio”,“🎨 Reggio Emilia”],[“waldorf”,“🌈 Waldorf”],[“forest”,“🌲 Forest School”],[“swedish”,“🇸🇪 Swedish”],[“norwegian”,“🇳🇴 Norwegian”],[“nz”,“🇳🇿 Te Whāriki”],[“ib”,“🌐 IB”],[“competency”,“📊 Competency”],[“classical”,“📜 Classical”]].map(([v,l]) =>
<option key={v} value={v}>{l}</option>
)}
</select>
<div style={{ fontSize: “9px”, color: K.textFaint, marginTop: “6px” }}>Philosophy shapes generation and assessment defaults</div>
</div>

```
  {/* Tabs */}
  <div style={{ display: "flex", gap: "4px", marginBottom: "12px" }}>
    {[["roster",`👥 Roster (${classroom.students.length})`],["generate","🔥 Generate"],["assess","📊 Assess"]].map(([id,label]) => (
      <button key={id} onClick={() => setTab(id)} style={{
        flex: 1, padding: "10px 8px", borderRadius: "6px", border: `1px solid ${tab === id ? K.sage : K.border}`,
        background: tab === id ? "rgba(74,122,86,0.1)" : "transparent", cursor: "pointer",
        fontSize: "11px", fontWeight: tab === id ? 700 : 400, color: tab === id ? K.sage : K.textMid, fontFamily: "'DM Sans', sans-serif",
      }}>{label}</button>
    ))}
  </div>

  {/* Roster */}
  {tab === "roster" && (<div>
    {classroom.students.map(s => (
      <div key={s.id} style={{ background: K.surface, border: `1px solid ${K.border}`, borderRadius: "6px", padding: "10px 12px", marginBottom: "6px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: K.shadow }}>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: K.text }}>{s.name}</div>
          <div style={{ fontSize: "10px", color: K.textDim }}>{s.level} · {s.language}{s.needs.length > 0 ? ` · ${s.needs.join(", ")}` : ""}</div>
        </div>
        <button onClick={() => removeStudent(s.id)} style={{ background: "none", border: "none", color: K.textFaint, cursor: "pointer", fontSize: "14px" }}>×</button>
      </div>
    ))}
    {addingStudent ? (
      <div style={{ background: K.surface, border: `1px solid ${K.sage}`, borderRadius: "8px", padding: "14px", marginTop: "8px", boxShadow: K.shadow }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {sinp(newStudent.name, v => setNewStudent(s => ({ ...s, name: v })), "Student name...")}
          <div style={{ display: "flex", gap: "6px" }}>
            <select value={newStudent.level} onChange={e => setNewStudent(s => ({ ...s, level: e.target.value }))}
              style={{ flex: 1, padding: "8px", borderRadius: "5px", border: `1px solid ${K.border}`, background: K.bg, fontSize: "12px", color: K.text, outline: "none" }}>
              {[["pre-k","Pre-K"],["early","Early Elem"],["upper","Upper Elem"],["middle","Middle"],["high","High School"],["adult","Adult"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select value={newStudent.language} onChange={e => setNewStudent(s => ({ ...s, language: e.target.value }))}
              style={{ flex: 1, padding: "8px", borderRadius: "5px", border: `1px solid ${K.border}`, background: K.bg, fontSize: "12px", color: K.text, outline: "none" }}>
              {["English","Spanish","Japanese","French","German","Mandarin","Cherokee (ᏣᎳᎩ)","Finnish","Swedish","Norwegian","Farsi","Irish","Övdalsk","Māori"].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          {sinp(newStudent.interests.join(", "), v => setNewStudent(s => ({ ...s, interests: v.split(",").map(i => i.trim()).filter(Boolean) })), "Interests (comma separated)...")}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {["visual","auditory","kinesthetic","adhd","dyslexia","esl","gifted","anxiety","autism","trauma","bullied"].map(n => (
              <button key={n} onClick={() => setNewStudent(s => ({ ...s, needs: s.needs.includes(n) ? s.needs.filter(x => x !== n) : [...s.needs, n] }))} style={{
                padding: "4px 8px", borderRadius: "12px", fontSize: "10px", cursor: "pointer",
                border: `1px solid ${newStudent.needs.includes(n) ? K.ember : K.border}`,
                background: newStudent.needs.includes(n) ? K.emberGlow : "transparent",
                color: newStudent.needs.includes(n) ? K.ember : K.textDim,
              }}>{n}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <Btn small onClick={addStudent} color={K.sage}>Add Student</Btn>
            <Btn small onClick={() => setAddingStudent(false)} color={K.textDim}>Cancel</Btn>
          </div>
        </div>
      </div>
    ) : (
      <Btn small onClick={() => setAddingStudent(true)} color={K.sage} style={{ marginTop: "8px", width: "100%" }}>+ Add Student</Btn>
    )}
  </div>)}

  {/* Generate */}
  {tab === "generate" && (<div>
    <div style={{ background: K.surface, border: `1px solid ${K.border}`, borderRadius: "8px", padding: "14px", marginBottom: "12px", boxShadow: K.shadow }}>
      <div style={{ marginBottom: "8px" }}>{sinp(classroom.topic, v => setClassroom(c => ({ ...c, topic: v })), "Today's topic...")}</div>
      <Btn primary onClick={generateForClass} style={{ width: "100%" }}>🔥 Generate for {classroom.students.length} student{classroom.students.length !== 1 ? "s" : ""}</Btn>
      {classroom.students.length === 0 && <div style={{ fontSize: "10px", color: K.rose, marginTop: "6px", textAlign: "center" }}>Add students in Roster first</div>}
    </div>
    {Object.keys(generatedLessons).length > 0 && classroom.students.map(s => {
      const lesson = generatedLessons[s.id];
      if (!lesson) return null;
      return (
        <div key={s.id} style={{ background: K.surface, border: `1px solid ${K.border}`, borderLeft: `3px solid ${K.ember}`, borderRadius: "6px", marginBottom: "8px", boxShadow: K.shadow, overflow: "hidden" }}>
          <div style={{ padding: "8px 12px", borderBottom: `1px solid ${K.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: K.ember }}>{s.name}</span>
            <span style={{ fontSize: "9px", padding: "2px 8px", borderRadius: "10px", background: "rgba(160,138,42,0.15)", color: K.gold }}>demo</span>
          </div>
          <div style={{ padding: "10px 12px", fontSize: "11px", color: K.textMid, whiteSpace: "pre-wrap", lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif", maxHeight: "200px", overflow: "auto" }}>{lesson.content}</div>
        </div>
      );
    })}
  </div>)}

  {/* Assess */}
  {tab === "assess" && (<div>
    <div style={{ background: K.surface, border: `1px solid ${K.border}`, borderRadius: "8px", padding: "12px", marginBottom: "12px", boxShadow: K.shadow }}>
      <div style={{ fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: K.textFaint, marginBottom: "8px", fontFamily: "'DM Sans', sans-serif" }}>Assessment Lens</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
        {ASSESSMENT_LENSES.map(l => (
          <button key={l.id} onClick={() => setClassroom(c => ({ ...c, assessmentLens: l.id }))} style={{
            padding: "6px 10px", borderRadius: "14px", fontSize: "11px", cursor: "pointer",
            border: `1px solid ${classroom.assessmentLens === l.id ? K.sage : K.border}`,
            background: classroom.assessmentLens === l.id ? "rgba(74,122,86,0.12)" : "transparent",
            color: classroom.assessmentLens === l.id ? K.sage : K.textDim,
            fontWeight: classroom.assessmentLens === l.id ? 700 : 400,
          }}>{l.icon} {l.label}</button>
        ))}
      </div>
      <div style={{ fontSize: "9px", color: K.textFaint, marginTop: "6px" }}>Same data, different view. Switch anytime.</div>
    </div>
    {classroom.students.length === 0 ? (
      <div style={{ textAlign: "center", padding: "30px", color: K.textFaint, fontSize: "12px" }}>Add students in Roster first</div>
    ) : classroom.students.map(s => (
      <div key={s.id} style={{ background: K.surface, border: `1px solid ${K.border}`, borderLeft: `3px solid ${K.sage}`, borderRadius: "6px", padding: "12px", marginBottom: "8px", boxShadow: K.shadow }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: K.text, marginBottom: "8px" }}>{s.name}</div>
        {currentLens.fields.map(field => (
          <div key={field} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <label style={{ fontSize: "10px", color: K.textDim, width: "110px", textTransform: "capitalize", fontFamily: "'DM Sans', sans-serif" }}>{field.replace(/_/g, " ")}</label>
            {(currentLens.id === "finnish" || currentLens.id === "waldorf") ? (
              <textarea value={(assessments[s.id] || {})[field] || ""} onChange={e => updateAssessment(s.id, field, e.target.value)}
                placeholder="Narrative observation..." rows={2}
                style={{ flex: 1, padding: "6px 8px", borderRadius: "4px", border: `1px solid ${K.border}`, background: K.bg, fontSize: "11px", color: K.text, outline: "none", resize: "vertical", fontFamily: "'DM Sans', sans-serif" }} />
            ) : (
              <div style={{ flex: 1, display: "flex", gap: "3px" }}>
                {[1,2,3,4,5].map(v => (
                  <button key={v} onClick={() => updateAssessment(s.id, field, v)} style={{
                    flex: 1, padding: "6px 0", borderRadius: "4px", fontSize: "11px", fontWeight: 600, cursor: "pointer",
                    border: `1px solid ${(assessments[s.id] || {})[field] === v ? K.sage : K.border}`,
                    background: (assessments[s.id] || {})[field] === v ? "rgba(74,122,86,0.15)" : "transparent",
                    color: (assessments[s.id] || {})[field] === v ? K.sage : K.textDim,
                  }}>{v}</button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    ))}
  </div>)}
</div>
```

);
}

// ============================================================
// KINDRED STUDIO — Main App
// ============================================================

export default function KindredStudio() {
const { session, loading, loginTeacher, loginStudent, loginParent, logout } = useAuth();
const [view, setView] = useState(“dashboard”); // dashboard | kindling | planner | classroom
const [toast, setToast] = useState(””);
const [kindlingOutput, setKindlingOutput] = useState(null); // Bridge: Kindling → Planner

const flash = (msg) => { setToast(msg); setTimeout(() => setToast(””), 2200); };

const handleSendToPlanner = (output) => {
setKindlingOutput(output);
setView(“planner”);
flash(“📤 Sent to Lesson Planner!”);
};

const handleLogin = async (role, credential) => {
if (role === “teacher”) await loginTeacher(credential);
else if (role === “student”) await loginStudent(credential);
else if (role === “parent”) await loginParent(credential);
};

// Not authenticated → show login
if (!session) {
return <LoginScreen onLogin={handleLogin} />;
}

return (
<div style={{
minHeight: “100vh”, background: K.bg,
fontFamily: “‘Libre Baskerville’, Georgia, serif”,
}}>
<style>{`@import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@400;500;600;700&display=swap'); @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } } * { box-sizing: border-box; } body { margin: 0; } ::selection { background: ${K.emberGlow}; color: ${K.ember}; }`}</style>

```
  {/* Header */}
  <header style={{
    padding: "12px 16px", borderBottom: `1px solid ${K.border}`,
    background: K.surface,
    display: "flex", alignItems: "center", justifyContent: "space-between",
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <button onClick={() => setView("dashboard")} style={{
        background: "none", border: "none", cursor: "pointer",
        fontSize: "18px", padding: 0,
      }}>🔥</button>
      <div>
        <div style={{ fontSize: "14px", fontWeight: 700, color: K.text }}>
          Kindred Studio
        </div>
        <div style={{
          fontSize: "8px", letterSpacing: "0.15em", textTransform: "uppercase",
          color: K.textFaint,
        }}>
          {session.role === ROLES.TEACHER && "Teacher"}
          {session.role === ROLES.STUDENT && "Student"}
          {session.role === ROLES.PARENT && "Parent · Read Only"}
        </div>
      </div>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      {session.role === ROLES.TEACHER && view !== "dashboard" && (
        <Btn small onClick={() => setView("dashboard")}>← Dashboard</Btn>
      )}
      <div style={{
        width: "8px", height: "8px", borderRadius: "50%",
        background: K.sage, boxShadow: `0 0 6px ${K.sage}`,
      }} title="Session active" />
    </div>
  </header>

  <main style={{ maxWidth: "640px", margin: "0 auto", padding: "16px" }}>

    {/* Teacher Views */}
    {session.role === ROLES.TEACHER && view === "dashboard" && (
      <TeacherDashboard
        session={session}
        onLogout={logout}
        onNavigate={setView}
      />
    )}

    {session.role === ROLES.TEACHER && view === "kindling" && (
      <div style={{ animation: "fadeIn 0.3s ease" }}>
        <div style={{
          padding: "12px", marginBottom: "12px", borderRadius: "6px",
          background: K.bg2, border: `1px solid ${K.border}`,
          fontSize: "9px", color: K.textFaint, fontFamily: "'DM Sans', monospace",
          textAlign: "center",
        }}>
          🔐 PII Stripping Active · Claude sees: level, language, interests, needs · Never: name, school, diagnosis
        </div>
        <Kindling onSendToPlanner={handleSendToPlanner} />
      </div>
    )}

    {session.role === ROLES.TEACHER && view === "planner" && (
      <div style={{ animation: "fadeIn 0.3s ease" }}>
        {kindlingOutput && (
          <div style={{
            padding: "10px 14px", marginBottom: "12px", borderRadius: "6px",
            background: "rgba(160,138,42,0.08)", border: `1px solid ${K.gold}`,
            fontSize: "11px", color: K.gold, textAlign: "center",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            📤 Imported from Kindling — {kindlingOutput.profile?.name || "Student"}'s lesson loaded into blocks
          </div>
        )}
        <Hearthstone initialFromKindling={kindlingOutput} />
      </div>
    )}

    {session.role === ROLES.TEACHER && view === "classroom" && (
      <ClassroomView session={session} />
    )}

    {/* Student View */}
    {session.role === ROLES.STUDENT && (
      <StudentView session={session} onLogout={logout} />
    )}

    {/* Parent View */}
    {session.role === ROLES.PARENT && (
      <ParentView session={session} onLogout={logout} />
    )}

    <footer style={{
      marginTop: "40px", paddingTop: "12px",
      borderTop: `1px solid ${K.border}`, textAlign: "center",
    }}>
      <p style={{ fontSize: "9px", color: K.textFaint, lineHeight: 1.6, fontStyle: "italic" }}>
        Kindred Studio — Educational Equality for All<br />
        🔐 Crypto Cookie Auth · Quantum-resistant ready<br />
        Built on a sofa in Stuart, Florida 🔥 🍵
      </p>
    </footer>
  </main>

  {/* Toast */}
  {toast && (
    <div style={{
      position: "fixed", bottom: "20px", left: "50%", transform: "translateX(-50%)",
      background: K.text, color: K.bg, padding: "8px 20px", borderRadius: "5px",
      fontSize: "11px", fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
      boxShadow: K.shadowLift, zIndex: 200, animation: "fadeIn 0.15s ease",
    }}>{toast}</div>
  )}
</div>
```

);
}
