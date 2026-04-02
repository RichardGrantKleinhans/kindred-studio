import { useState, useEffect, useRef } from “react”;

// ============================================================
// KINDLING — Educational Equality for All
// “The limit of the curriculum is the frontier of knowledge itself.”
//
// Built by: Claude + Richard Grant Kleinhans (@polymathsofa)
// A former dual-licensed elementary/special education teacher
// who believes every student deserves fire, not worksheets.
//
// Architecture: Student Profile → Lesson → Assignment → Assessment
// All generated dynamically. No busywork. No ceiling.
// ============================================================

const WARM = {
bg: “#faf6f0”, bg2: “#f3ede4”, surface: “#fff9f2”,
border: “#e8ddd0”, borderHover: “#d4c4b0”,
text: “#2c2418”, textMid: “#5a4d3e”, textDim: “#8a7d6e”, textFaint: “#b8ad9e”,
ember: “#c85a28”, emberGlow: “rgba(200,90,40,0.12)”, emberLight: “#e8956a”,
forest: “#3a6e4e”, forestGlow: “rgba(58,110,78,0.1)”,
sky: “#4a7a9a”, skyGlow: “rgba(74,122,154,0.1)”,
gold: “#b8942a”, goldGlow: “rgba(184,148,42,0.1)”,
warmShadow: “0 2px 20px rgba(44,36,24,0.06)”,
cardShadow: “0 1px 8px rgba(44,36,24,0.08)”,
};

const SUBJECTS = [
{ id: “dinosaurs”, emoji: “🦕”, label: “Dinosaurs” },
{ id: “space”, emoji: “🚀”, label: “Space & Stars” },
{ id: “ocean”, emoji: “🌊”, label: “Ocean Life” },
{ id: “music”, emoji: “🎵”, label: “Music & Composition” },
{ id: “rhythm”, emoji: “🥁”, label: “Rhythm & Percussion” },
{ id: “robots”, emoji: “🤖”, label: “Robots & AI” },
{ id: “animals”, emoji: “🦊”, label: “Animals” },
{ id: “cooking”, emoji: “🍳”, label: “Cooking” },
{ id: “art”, emoji: “🎨”, label: “Art & Drawing” },
{ id: “bugs”, emoji: “🐛”, label: “Insects & Bugs” },
{ id: “weather”, emoji: “⛈️”, label: “Weather” },
{ id: “volcano”, emoji: “🌋”, label: “Volcanoes” },
{ id: “plants”, emoji: “🌱”, label: “Plants & Gardens” },
{ id: “history”, emoji: “🏛️”, label: “History” },
{ id: “math”, emoji: “🔢”, label: “Math Puzzles” },
{ id: “stories”, emoji: “📖”, label: “Storytelling” },
{ id: “sports”, emoji: “⚽”, label: “Sports Science” },
{ id: “coding”, emoji: “💻”, label: “Coding & Logic” },
{ id: “geology”, emoji: “🪨”, label: “Rocks & Geology” },
{ id: “theatre”, emoji: “🎭”, label: “Theatre & Drama” },
{ id: “language”, emoji: “🗣️”, label: “Languages & Linguistics” },
{ id: “mythology”, emoji: “⚔️”, label: “Mythology & Folklore” },
{ id: “ecology”, emoji: “🌍”, label: “Ecology & Environment” },
{ id: “photography”, emoji: “📷”, label: “Photography & Film” },
];

const LEVELS = [
{ id: “pre-k”, label: “Pre-K (Ages 3-5)”, desc: “Exploration & play-based” },
{ id: “early”, label: “Early Elementary (K-2)”, desc: “Foundational skills” },
{ id: “upper”, label: “Upper Elementary (3-5)”, desc: “Building complexity” },
{ id: “middle”, label: “Middle School (6-8)”, desc: “Abstract thinking” },
{ id: “high”, label: “High School (9-12)”, desc: “Advanced & analytical” },
{ id: “adult”, label: “Adult Learner”, desc: “Self-directed depth” },
];

const NEEDS = [
{ id: “visual”, emoji: “👁️”, label: “Visual learner” },
{ id: “auditory”, emoji: “👂”, label: “Auditory learner” },
{ id: “kinesthetic”, emoji: “✋”, label: “Hands-on learner” },
{ id: “adhd”, emoji: “⚡”, label: “ADHD — short segments” },
{ id: “dyslexia”, emoji: “📝”, label: “Dyslexia support” },
{ id: “esl”, emoji: “🌍”, label: “ESL / Multilingual” },
{ id: “gifted”, emoji: “✨”, label: “Gifted / accelerated” },
{ id: “anxiety”, emoji: “🫂”, label: “Test anxiety” },
{ id: “autism”, emoji: “🧩”, label: “Autism spectrum” },
{ id: “trauma”, emoji: “🛡️”, label: “Trauma-informed care” },
{ id: “bullied”, emoji: “💛”, label: “Bullying-informed support” },
{ id: “none”, emoji: “📚”, label: “No specific needs” },
];

const LANGUAGES = [
“English”, “Spanish”, “Japanese”, “French”, “German”, “Mandarin”,
“Arabic”, “Portuguese”, “Korean”, “Swedish”, “Russian”, “Hindi”,
“Vietnamese”, “Tagalog”, “Italian”, “Dutch”, “Övdalsk”,
“Finnish”, “Icelandic”, “Norwegian”, “Danish”,
“Cherokee (ᏣᎳᎩ)”, “Farsi”, “Irish”, “Scottish Gaelic”,
“Haitian Creole”, “Hawaiian”, “Māori”, “Turkish”, “Polish”,
“Greek”, “Czech”, “Romanian”, “Ukrainian”, “Hebrew”,
“Indonesian”, “Thai”, “Swahili”, “Welsh”
];

// ── Pedagogical Philosophy System ──
const PHILOSOPHIES = [
{ id: “kindred”, label: “Kindred”, icon: “🔥”, desc: “Frontier-focused, interest-driven, no busywork” },
{ id: “finnish”, label: “Finnish (OPH)”, icon: “🇫🇮”, desc: “Transversal competence, wellbeing, equity” },
{ id: “montessori”, label: “Montessori”, icon: “🧸”, desc: “Self-directed, sensorial, mastery-based” },
{ id: “reggio”, label: “Reggio Emilia”, icon: “🎨”, desc: “Child-led projects, environment as teacher” },
{ id: “waldorf”, label: “Waldorf / Steiner”, icon: “🌈”, desc: “Arts-integrated, developmental stages” },
{ id: “forest”, label: “Forest School”, icon: “🌲”, desc: “Outdoor-based, nature connection, resilience” },
{ id: “swedish”, label: “Swedish (Lgr22)”, icon: “🇸🇪”, desc: “Democracy, creativity, student agency” },
{ id: “norwegian”, label: “Norwegian (LK20)”, icon: “🇳🇴”, desc: “Democracy, sustainability, deep learning” },
{ id: “nz”, label: “Te Whāriki (NZ)”, icon: “🇳🇿”, desc: “Empowerment, holistic, belonging, bicultural” },
{ id: “ib”, label: “IB Framework”, icon: “🌐”, desc: “Inquiry-based, international mindedness” },
{ id: “competency”, label: “Competency-Based”, icon: “📊”, desc: “Skill mastery, flexible pacing, evidence” },
{ id: “classical”, label: “Classical”, icon: “📜”, desc: “Trivium: grammar, logic, rhetoric” },
];

const PHILOSOPHY_PROMPTS = {
kindred: `PEDAGOGICAL PHILOSOPHY: Kindred (Default)

- The ceiling is the frontier of knowledge itself. Never artificially limit depth.
- Every task must connect to genuine understanding. No busywork.
- Push toward what’s unknown, not just what’s testable.
- The student’s curiosity drives the curriculum.`, finnish: `PEDAGOGICAL PHILOSOPHY: Finnish National Curriculum (OPH)
- Emphasize transversal competences: thinking, communication, multiliteracy, ICT, work life, participation, sustainability.
- Wellbeing is a core educational outcome, not a side effect.
- No numerical grades before age 11 — use descriptive feedback.
- Trust the student’s capacity for self-direction.
- Equity means every student gets what they need, not what’s average.`, montessori: `PEDAGOGICAL PHILOSOPHY: Montessori (AMI)
- Follow the child. Observe interests and readiness before presenting.
- Use concrete, sensorial materials before abstract concepts.
- Mixed-age perspectives: reference what younger and older learners explore.
- Self-correction is built into the work — the material teaches, not the teacher.
- Independence is the goal: “Help me do it myself.”
- No external rewards or grades. Intrinsic motivation only.`, reggio: `PEDAGOGICAL PHILOSOPHY: Reggio Emilia
- The child has a hundred languages — honor all forms of expression.
- Learning emerges from the child’s interests through project-based inquiry.
- The environment is the third teacher — reference physical spaces and materials.
- Documentation of thinking is part of learning, not just assessment.
- Collaboration between children is the primary learning mechanism.
- Provocation over instruction — pose questions that spark investigation.`, waldorf: `PEDAGOGICAL PHILOSOPHY: Waldorf / Steiner
- Integrate arts into every subject — drawing, movement, music, storytelling.
- Respect developmental stages: imagination (early), feeling (middle), thinking (high).
- Main lesson blocks: deep immersion in one subject over weeks.
- Oral storytelling before written work. Living pictures before abstractions.
- Connect all learning to nature, seasons, and human experience.
- No standardized testing. Portfolio and narrative assessment only.`, forest: `PEDAGOGICAL PHILOSOPHY: Forest School / Friluftsliv
- All learning happens outdoors or connects to outdoor experience.
- Risk-taking is healthy — support appropriate challenge.
- Nature is the classroom, the textbook, and the assessment.
- Seasonal awareness frames all content.
- Build resilience, confidence, and independence through direct experience.
- Process over product — the journey of exploration matters more than the answer.`, swedish: `PEDAGOGICAL PHILOSOPHY: Swedish National Curriculum (Lgr22 / Skolverket)
- Democratic values are foundational — every student’s voice matters.
- Creativity and curiosity drive learning alongside academic rigor.
- Student agency: the learner participates in planning their education.
- Equity and inclusion: education adapts to the student, not the reverse.
- Critical thinking and source evaluation are core skills at every level.`, norwegian: `PEDAGOGICAL PHILOSOPHY: Norwegian National Curriculum (LK20)
- Core values: human dignity, identity, cultural diversity, critical thinking, democracy.
- Deep learning over surface coverage — fewer topics, more depth.
- Sustainability and ethical awareness integrated across all subjects.
- The student’s voice and participation in their own learning is a right.
- Interdisciplinary topics: health, democracy, sustainability woven through all subjects.`, nz: `PEDAGOGICAL PHILOSOPHY: Te Whāriki (New Zealand)
- Four principles: Empowerment (Whakamana), Holistic Development (Kotahitanga), Family and Community (Whānau Tangata), Relationships (Ngā Hononga).
- Five strands: Wellbeing, Belonging, Contribution, Communication, Exploration.
- Bicultural foundation: honor both indigenous and settler knowledge systems.
- Learning is woven (whāriki) — all strands interconnect.
- The child’s identity, language, and culture are central to learning.`, ib: `PEDAGOGICAL PHILOSOPHY: International Baccalaureate
- Inquiry-based learning structured around essential questions.
- International mindedness: connect local learning to global perspectives.
- Learner profile: knowledgeable, thinker, communicator, principled, open-minded, caring, risk-taker, balanced, reflective.
- Transdisciplinary themes connect subjects to real-world significance.
- Assessment includes both formative and summative, with student reflection.`, competency: `PEDAGOGICAL PHILOSOPHY: Competency-Based Education
- Define clear competencies students must demonstrate mastery of.
- Flexible pacing — students advance when they demonstrate proficiency.
- Multiple pathways to demonstrate mastery (not just tests).
- Evidence-based assessment: portfolios, projects, performances.
- Formative feedback is continuous. Summative assessment is criterion-referenced.`, classical: `PEDAGOGICAL PHILOSOPHY: Classical Education (Trivium)
- Grammar stage (young): absorb facts, build knowledge base through memorization and song.
- Logic stage (middle): analyze relationships, ask why, build arguments.
- Rhetoric stage (high): synthesize, express, persuade, create original work.
- Great texts and primary sources over textbooks.
- Socratic dialogue as primary teaching method.`,
  };

// Demo content generator — works offline, shows the concept
function generateDemoContent(type, profile) {
const name = profile.name || “Student”;
const interests = profile.interests.map((id) => SUBJECTS.find((s) => s.id === id)?.label || id);
const level = LEVELS.find((l) => l.id === profile.level)?.label || profile.level;
const interestStr = interests.join(” and “);

const traumaNote = profile.needs.includes(“trauma”)
? `\n\n🛡️ Safety Note: This lesson uses predictable structure, offers choices at every step, and avoids content that could trigger stress responses. The student always has permission to pause.` : “”;
const bullyNote = profile.needs.includes(“bullied”)
? `\n\n💛 Belonging Note: All activities are collaborative, not competitive. Emphasis on "what makes each person's perspective valuable" throughout.` : “”;

if (type === “lesson”) {
return `🔥 LESSON: “${interestStr} — Secrets at the Frontier”

📋 Level: ${level} | Language: ${profile.language}
🎯 Personalized for: ${name}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 THE BIG QUESTION
What don’t we know yet about ${interestStr.toLowerCase()} — and how could YOU be the one to find out?

📚 KEY CONCEPTS
• The difference between what we know, what we think we know, and what’s still a mystery
• How scientists and researchers ask questions about ${interestStr.toLowerCase()}
• Why the most important discoveries often come from unexpected connections
• How YOUR unique perspective matters in understanding the world

🎣 THE HOOK
${name}, imagine you’re the world’s leading expert on ${interestStr.toLowerCase()}. Someone just called you because they found something nobody has ever seen before. What questions would you ask first? That instinct — that curiosity — is exactly what real researchers feel every day. Today, we’re going to follow that feeling.

🧠 CORE CONTENT
[This section would be dynamically generated by AI based on the absolute frontier of knowledge in ${interestStr.toLowerCase()}, adapted to ${level} comprehension level, in ${profile.language}.]

The AI engine would pull from current research, adapt terminology and complexity, weave in the student’s specific interests, and accommodate their learning needs — all invisibly.

⚡ WONDER MOMENT
Here’s something most people don’t know: the biggest unsolved question in ${interestStr.toLowerCase()} right now is something a student your age could help answer. Real science doesn’t care about your age. It cares about your questions.${traumaNote}${bullyNote}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔥 Generated by Kindling — Educational Equality for All
📝 Note: This is DEMO MODE. With API connected, every lesson is unique and generated at the frontier of current knowledge.`;
}

if (type === “assignment”) {
return `✏️ ASSIGNMENT: “Your ${interestStr} Investigation”

For: ${name} | ${level}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 MISSION
You’ve just learned about the frontier of ${interestStr.toLowerCase()}. Now it’s your turn to investigate.

📋 STEPS

Step 1: Choose Your Path (5 min)
Pick ONE question from today’s lesson that made you go “wait, really?” — or write your own question that came up while learning.
${profile.needs.includes(“adhd”) ? “⏱️ Set a 5-minute timer. When it rings, pick whichever question you’re thinking about — it’s the right one.” : “”}

Step 2: Explore (15 min)  
Investigate your question using any method that works for you:
${profile.needs.includes(“visual”) ? “• Draw it — sketch, diagram, mind map, comic strip” : “• Write it — notes, story, letter to a scientist”}
${profile.needs.includes(“kinesthetic”) ? “• Build it — model, demonstration, experiment” : “• Record it — voice memo, video, presentation”}
${profile.needs.includes(“auditory”) ? “• Talk it through — explain to someone, record yourself thinking aloud” : “• Research it — find one source that adds to what we learned”}

Step 3: The Connection (10 min)
Find ONE way your question connects to something completely different — another subject, something in your life, a problem in the world. The stranger the connection, the better.

Step 4: Share (5 min)
Prepare to share your investigation in whatever format feels right. There’s no wrong way to show what you discovered.${traumaNote}${bullyNote}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔥 Kindling Demo Mode — With API, assignments adapt to each student’s unique profile in real time.`;
}

if (type === “assessment”) {
return `🌱 GROWTH REFLECTION: “What Grew Today?”

For: ${name} | ${level}
${profile.needs.includes(“anxiety”) ? “💚 This is NOT a test. There are no wrong answers. This is a conversation about your learning.” : “”}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🪞 SELF-REFLECTION

1. “The most interesting thing I learned today was…”
   (Say it in one sentence — then explain why it grabbed you)
1. “Something I thought I knew but turned out to be different…”
   (Changing your mind = growth, not failure)
1. “A question I still have is…”
   (The best learners finish with MORE questions, not fewer)
1. “I would rate my curiosity today as: 🔥🔥🔥🔥🔥” (1-5 flames)
   “Because…”

🎯 UNDERSTANDING CHECK

• Can you explain the Big Question from today’s lesson to someone who wasn’t here? Try it in 2-3 sentences.
• What was the “Wonder Moment” and why does it matter?
• How did your investigation connect to something outside this subject?

🌱 GROWTH MAP
Instead of a grade, your teacher will note:
• Depth of thinking: Did you go beyond the surface?
• Connections: Did you link ideas together?  
• Curiosity: Did you ask your own questions?
• Courage: Did you try something unfamiliar?

🔮 NEXT STEPS
Based on what ${name} explored today, tomorrow’s lesson could branch into:
• [Direction A — deeper into the same topic]
• [Direction B — following the student’s own question]
• [Direction C — the unexpected connection they found]

The student chooses. The curriculum follows the learner.${traumaNote}${bullyNote}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔥 Kindling Demo Mode — With API, assessments are fully personalized and track growth across sessions.`;
}

return “Unknown content type.”;
}

async function callClaude(systemPrompt, userMessage) {
try {
const response = await fetch(“https://api.anthropic.com/v1/messages”, {
method: “POST”,
headers: {
“Content-Type”: “application/json”,
},
body: JSON.stringify({
model: “claude-sonnet-4-20250514”,
max_tokens: 1000,
messages: [
{ role: “user”, content: systemPrompt + “\n\n—\n\n” + userMessage }
],
}),
});

```
const rawText = await response.text();

let data;
try {
  data = JSON.parse(rawText);
} catch (parseErr) {
  console.error("Response not JSON:", rawText.slice(0, 500));
  return null; // signal to use demo fallback
}

if (data.error) {
  console.error("API error:", data.error);
  return null;
}

if (!data.content || !Array.isArray(data.content)) {
  console.error("Unexpected shape:", JSON.stringify(data).slice(0, 500));
  return null;
}

const text = data.content
  .filter((b) => b.type === "text")
  .map((b) => b.text)
  .join("\n");

return text || null;
```

} catch (e) {
console.error(“Fetch failed:”, e);
return null; // fallback to demo
}
}

function buildSystemPrompt(profile) {
const needsStr = profile.needs.length ? profile.needs.join(”, “) : “no specific accommodations”;
const philPrompt = PHILOSOPHY_PROMPTS[profile.philosophy] || PHILOSOPHY_PROMPTS.kindred;
return `You are Kindling, an adaptive education engine built by a former dual-licensed elementary and special education teacher.

STUDENT PROFILE:

- Name: ${profile.name || “Student”}
- Level: ${profile.level}
- Language: ${profile.language}
- Interests: ${profile.interests.join(”, “)}
- Learning needs: ${needsStr}
  ${profile.customNote ? `- Teacher/parent note: ${profile.customNote}` : “”}

${philPrompt}

DESIGN PRINCIPLES:

- Never create busywork. Every task must connect to genuine understanding.
- Adapt complexity to the student’s level but never patronize.
- Connect to the student’s interests whenever possible.
- For students with specific needs, integrate accommodations naturally — don’t call them out.
- For ESL students, use clear language with context clues.
- For ADHD learners, use shorter segments with frequent engagement points.
- For gifted students, push toward the frontier — don’t cap at grade level.
- For students with test anxiety, frame assessments as exploration, not evaluation.
- For trauma-informed care: create emotional safety first. Avoid sudden surprises, loud/aggressive language, or content involving abandonment, violence, or loss without gentle framing. Build predictability into lesson structure. Always offer choice. Never force participation — invite it. Regulate before you educate.
- For bullying-informed support: weave themes of belonging, strength-in-difference, and social courage into content naturally. Build collaborative tasks that create positive peer identity. Never single out or create competitive ranking. Frame challenges as “us vs. the problem” not “student vs. student.”
- Use the student’s language (${profile.language}) for all content.
- Be warm. Be real. Be the teacher every kid deserves.`;
  }

// ── COMPONENTS ──

function StepIndicator({ current, total, labels }) {
return (
<div style={{ display: “flex”, gap: “4px”, alignItems: “center”, padding: “0 4px”, marginBottom: “20px” }}>
{labels.map((label, i) => (
<div key={i} style={{ flex: 1, display: “flex”, flexDirection: “column”, alignItems: “center”, gap: “6px” }}>
<div style={{
height: “3px”, width: “100%”, borderRadius: “2px”,
background: i <= current ? WARM.ember : WARM.border,
transition: “background 0.4s ease”,
}} />
<span style={{
fontSize: “9px”, letterSpacing: “0.12em”, textTransform: “uppercase”,
color: i <= current ? WARM.ember : WARM.textFaint,
fontWeight: i === current ? 700 : 400,
transition: “color 0.3s”,
}}>{label}</span>
</div>
))}
</div>
);
}

function InterestPill({ item, selected, onClick }) {
const active = selected.includes(item.id);
return (
<button onClick={() => onClick(item.id)} style={{
display: “inline-flex”, alignItems: “center”, gap: “6px”,
padding: “8px 14px”, borderRadius: “20px”,
border: `1.5px solid ${active ? WARM.ember : WARM.border}`,
background: active ? WARM.emberGlow : “transparent”,
color: active ? WARM.ember : WARM.textMid,
fontSize: “13px”, fontFamily: “‘Libre Baskerville’, Georgia, serif”,
cursor: “pointer”, transition: “all 0.2s”,
fontWeight: active ? 600 : 400,
}}>
<span style={{ fontSize: “16px” }}>{item.emoji}</span>
{item.label}
</button>
);
}

function Card({ children, style }) {
return (
<div style={{
background: WARM.surface, border: `1px solid ${WARM.border}`,
borderRadius: “10px”, padding: “20px”,
boxShadow: WARM.cardShadow,
…style,
}}>{children}</div>
);
}

function Button({ children, onClick, primary, disabled, style }) {
return (
<button onClick={onClick} disabled={disabled} style={{
padding: “12px 28px”, borderRadius: “8px”,
border: primary ? “none” : `1.5px solid ${WARM.border}`,
background: primary ? (disabled ? WARM.textFaint : WARM.ember) : “transparent”,
color: primary ? “#fff” : WARM.textMid,
fontSize: “13px”, fontFamily: “‘Libre Baskerville’, Georgia, serif”,
fontWeight: 600, letterSpacing: “0.04em”,
cursor: disabled ? “default” : “pointer”,
opacity: disabled ? 0.6 : 1,
transition: “all 0.2s”,
…style,
}}>{children}</button>
);
}

function SectionLabel({ children }) {
return (
<div style={{
fontSize: “10px”, letterSpacing: “0.18em”, textTransform: “uppercase”,
color: WARM.textFaint, marginBottom: “10px”, fontWeight: 600,
}}>{children}</div>
);
}

function ContentBlock({ title, icon, content, color, loading }) {
return (
<Card style={{ marginBottom: “16px”, borderLeft: `3px solid ${color || WARM.ember}` }}>
<div style={{ display: “flex”, alignItems: “center”, gap: “8px”, marginBottom: “12px” }}>
<span style={{ fontSize: “20px” }}>{icon}</span>
<h3 style={{ fontSize: “15px”, fontWeight: 700, color: WARM.text, margin: 0,
fontFamily: “‘Libre Baskerville’, Georgia, serif” }}>{title}</h3>
</div>
{loading ? (
<div style={{ display: “flex”, alignItems: “center”, gap: “8px”, color: WARM.textDim }}>
<span style={{ animation: “pulse 1.5s infinite”, fontSize: “18px” }}>🔥</span>
<span style={{ fontSize: “13px”, fontStyle: “italic” }}>Kindling is preparing something special…</span>
</div>
) : (
<div style={{
fontSize: “14px”, lineHeight: 1.75, color: WARM.textMid,
fontFamily: “‘Libre Baskerville’, Georgia, serif”,
whiteSpace: “pre-wrap”,
}}>{content}</div>
)}
</Card>
);
}

// ── MAIN APP ──

export default function Kindling({ onSendToPlanner }) {
const [phase, setPhase] = useState(“profile”); // profile | generating | lesson | assignment | assessment | review
const [profile, setProfile] = useState({
name: “”, level: “”, language: “English”, philosophy: “kindred”,
interests: [], needs: [], customNote: “”,
});
const [lesson, setLesson] = useState(””);
const [assignment, setAssignment] = useState(””);
const [assessment, setAssessment] = useState(””);
const [loading, setLoading] = useState({ lesson: false, assignment: false, assessment: false });
const [profileStep, setProfileStep] = useState(0); // 0=name/level, 1=interests, 2=needs, 3=review
const [history, setHistory] = useState([]);
const topRef = useRef(null);

const scrollTop = () => topRef.current?.scrollIntoView({ behavior: “smooth” });

const toggleInterest = (id) => {
setProfile((p) => ({
…p,
interests: p.interests.includes(id)
? p.interests.filter((i) => i !== id)
: p.interests.length < 5 ? […p.interests, id] : p.interests,
}));
};

const toggleNeed = (id) => {
setProfile((p) => ({
…p,
needs: id === “none” ? [“none”]
: p.needs.includes(id)
? p.needs.filter((n) => n !== id)
: […p.needs.filter((n) => n !== “none”), id],
}));
};

const generateLesson = async () => {
setPhase(“lesson”);
setLoading((l) => ({ …l, lesson: true }));
scrollTop();
const sys = buildSystemPrompt(profile);
const interestLabels = profile.interests.map((id) => SUBJECTS.find((s) => s.id === id)?.label || id);
const text = await callClaude(sys,
`Generate a single focused lesson plan that connects to the student’s interests: ${interestLabels.join(”, “)}.

Include:

1. A compelling title that would make this student excited
1. A “Big Question” — the driving inquiry
1. Key concepts (3-5, appropriate for level)
1. A brief engaging introduction that hooks the student through their interests
1. Core content — teach something real, at the frontier of what’s known
1. A “Wonder Moment” — one mind-blowing fact or connection

Format cleanly with clear sections. Be warm but substantive. No fluff. No busywork setup.`
);
setLesson(text || generateDemoContent(“lesson”, profile));
setLoading((l) => ({ …l, lesson: false }));
};

const generateAssignment = async () => {
setLoading((l) => ({ …l, assignment: true }));
scrollTop();
const sys = buildSystemPrompt(profile);
const text = await callClaude(sys,
`Based on this lesson:\n\n${lesson}\n\nCreate a meaningful assignment that:

1. Connects directly to the lesson content
1. Lets the student explore through their interests
1. Has multiple entry points (not one right answer)
1. Includes a creative/expressive component
1. Can be completed in 20-40 minutes
1. For students with specific needs, naturally accommodates without labeling

Include clear instructions and any resources needed. No busywork. Every step should build understanding.`
);
setAssignment(text || generateDemoContent(“assignment”, profile));
setLoading((l) => ({ …l, assignment: false }));
};

const generateAssessment = async () => {
setLoading((l) => ({ …l, assessment: true }));
scrollTop();
const sys = buildSystemPrompt(profile);
const text = await callClaude(sys,
`Based on this lesson and assignment:\n\nLESSON:\n${lesson}\n\nASSIGNMENT:\n${assignment}\n\nCreate a growth-focused assessment that:

1. Measures actual understanding, not memorization
1. Uses multiple modalities (not just written answers)
1. Includes self-reflection prompts (“What surprised you?”, “What do you want to explore next?”)
1. Frames everything as exploration, not testing
1. Provides clear rubric categories focused on depth of thinking
1. Identifies natural “next steps” for continued learning
   ${profile.needs.includes(“anxiety”) ? “7. Frame as a ‘learning reflection’ not a ‘test’ — this student has test anxiety” : “”}

This should feel like a conversation about what they learned, not an exam.`
);
setAssessment(text || generateDemoContent(“assessment”, profile));
setLoading((l) => ({ …l, assessment: false }));
};

const saveAndReset = () => {
setHistory((h) => […h, {
timestamp: new Date().toISOString(),
profile: { …profile },
lesson, assignment, assessment,
}]);
setLesson(””); setAssignment(””); setAssessment(””);
setPhase(“profile”); setProfileStep(1);
scrollTop();
};

const canProceedProfile = () => {
if (profileStep === 0) return profile.name && profile.level && profile.language;
if (profileStep === 1) return profile.interests.length > 0;
if (profileStep === 2) return profile.needs.length > 0;
return true;
};

return (
<div style={{
minHeight: “100vh”, background: WARM.bg,
fontFamily: “‘Libre Baskerville’, Georgia, serif”,
}}>
<style>{`@import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@400;500;600;700&display=swap'); @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } } @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } } input, select, textarea { font-family: 'DM Sans', sans-serif; } * { box-sizing: border-box; } body { margin: 0; } ::selection { background: ${WARM.emberGlow}; color: ${WARM.ember}; }`}</style>
<div ref={topRef} />

```
  {/* Header */}
  <header style={{
    padding: "20px 16px 16px", borderBottom: `1px solid ${WARM.border}`,
    background: WARM.surface, textAlign: "center",
  }}>
    <div style={{
      fontSize: "9px", letterSpacing: "0.4em", textTransform: "uppercase",
      color: WARM.textFaint, marginBottom: "6px",
    }}>Educational Equality for All</div>
    <h1 style={{
      fontSize: "22px", fontWeight: 700, color: WARM.text, margin: "0 0 4px",
      fontFamily: "'Libre Baskerville', Georgia, serif",
    }}>🔥 Kindling</h1>
    <p style={{
      fontSize: "11px", color: WARM.textDim, fontStyle: "italic", margin: 0,
    }}>The limit of the curriculum is the frontier of knowledge itself.</p>
  </header>

  <main style={{ maxWidth: "600px", margin: "0 auto", padding: "16px" }}>

    {/* ── PROFILE BUILDER ── */}
    {phase === "profile" && (
      <div style={{ animation: "fadeIn 0.4s ease" }}>
        <StepIndicator current={profileStep} total={4}
          labels={["Student", "Interests", "Needs", "Ready"]} />

        {profileStep === 0 && (
          <Card>
            <SectionLabel>Who is this student?</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", color: WARM.textMid, display: "block", marginBottom: "4px" }}>
                  Name or nickname
                </label>
                <input value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                  placeholder="What should Kindling call them?"
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: "6px",
                    border: `1.5px solid ${WARM.border}`, background: WARM.bg,
                    fontSize: "14px", color: WARM.text, outline: "none",
                  }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: WARM.textMid, display: "block", marginBottom: "4px" }}>
                  Learning level
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {LEVELS.map((lv) => (
                    <button key={lv.id} onClick={() => setProfile((p) => ({ ...p, level: lv.id }))}
                      style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "10px 14px", borderRadius: "6px",
                        border: `1.5px solid ${profile.level === lv.id ? WARM.ember : WARM.border}`,
                        background: profile.level === lv.id ? WARM.emberGlow : "transparent",
                        cursor: "pointer", transition: "all 0.2s",
                      }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: profile.level === lv.id ? WARM.ember : WARM.text,
                        fontFamily: "'Libre Baskerville', Georgia, serif" }}>{lv.label}</span>
                      <span style={{ fontSize: "11px", color: WARM.textDim }}>{lv.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: "12px", color: WARM.textMid, display: "block", marginBottom: "4px" }}>
                  Primary language
                </label>
                <select value={profile.language}
                  onChange={(e) => setProfile((p) => ({ ...p, language: e.target.value }))}
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: "6px",
                    border: `1.5px solid ${WARM.border}`, background: WARM.bg,
                    fontSize: "14px", color: WARM.text, outline: "none",
                  }}>
                  {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "12px", color: WARM.textMid, display: "block", marginBottom: "4px" }}>
                  Teaching philosophy
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {PHILOSOPHIES.map((ph) => (
                    <button key={ph.id} onClick={() => setProfile((p) => ({ ...p, philosophy: ph.id }))}
                      style={{
                        display: "flex", alignItems: "center", gap: "10px",
                        padding: "8px 12px", borderRadius: "6px",
                        border: `1.5px solid ${profile.philosophy === ph.id ? WARM.forest : WARM.border}`,
                        background: profile.philosophy === ph.id ? WARM.forestGlow : "transparent",
                        cursor: "pointer", transition: "all 0.2s", textAlign: "left",
                      }}>
                      <span style={{ fontSize: "16px" }}>{ph.icon}</span>
                      <div>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: profile.philosophy === ph.id ? WARM.forest : WARM.text,
                          fontFamily: "'Libre Baskerville', Georgia, serif" }}>{ph.label}</span>
                        <span style={{ fontSize: "10px", color: WARM.textDim, marginLeft: "8px" }}>{ph.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {profileStep === 1 && (
          <Card>
            <SectionLabel>What lights {profile.name || "them"} up? (pick up to 5)</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {SUBJECTS.map((s) => (
                <InterestPill key={s.id} item={s} selected={profile.interests} onClick={toggleInterest} />
              ))}
            </div>
            <p style={{ fontSize: "11px", color: WARM.textFaint, marginTop: "12px", fontStyle: "italic" }}>
              {profile.interests.length}/5 selected — lessons will weave these into every subject
            </p>
          </Card>
        )}

        {profileStep === 2 && (
          <Card>
            <SectionLabel>Any learning needs? (select all that apply)</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {NEEDS.map((n) => (
                <InterestPill key={n.id} item={n} selected={profile.needs} onClick={toggleNeed} />
              ))}
            </div>
            <div style={{ marginTop: "14px" }}>
              <label style={{ fontSize: "12px", color: WARM.textMid, display: "block", marginBottom: "4px" }}>
                Anything else Kindling should know? (optional)
              </label>
              <textarea value={profile.customNote}
                onChange={(e) => setProfile((p) => ({ ...p, customNote: e.target.value }))}
                placeholder="IEP goals, favorite topics to avoid, sensory preferences..."
                rows={3}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: "6px",
                  border: `1.5px solid ${WARM.border}`, background: WARM.bg,
                  fontSize: "13px", color: WARM.text, outline: "none", resize: "vertical",
                }} />
            </div>
          </Card>
        )}

        {profileStep === 3 && (
          <Card>
            <SectionLabel>Ready to kindle 🔥</SectionLabel>
            <div style={{ fontSize: "14px", lineHeight: 1.8, color: WARM.textMid }}>
              <p><strong>{profile.name}</strong> · {LEVELS.find((l) => l.id === profile.level)?.label} · {profile.language}</p>
              <p>Interests: {profile.interests.map((id) => SUBJECTS.find((s) => s.id === id)?.emoji + " " + SUBJECTS.find((s) => s.id === id)?.label).join(", ")}</p>
              <p>Needs: {profile.needs.map((id) => NEEDS.find((n) => n.id === id)?.label).join(", ")}</p>
              {profile.customNote && <p style={{ fontStyle: "italic" }}>Note: {profile.customNote}</p>}
            </div>
          </Card>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px", gap: "12px" }}>
          {profileStep > 0 && (
            <Button onClick={() => setProfileStep((s) => s - 1)}>← Back</Button>
          )}
          <div style={{ flex: 1 }} />
          {profileStep < 3 ? (
            <Button primary disabled={!canProceedProfile()}
              onClick={() => setProfileStep((s) => s + 1)}>
              Continue →
            </Button>
          ) : (
            <Button primary onClick={generateLesson}>
              🔥 Generate Lesson
            </Button>
          )}
        </div>

        {history.length > 0 && profileStep === 0 && (
          <div style={{ marginTop: "24px" }}>
            <SectionLabel>Previous Sessions ({history.length})</SectionLabel>
            {history.map((h, i) => (
              <div key={i} style={{
                padding: "10px 14px", borderRadius: "6px",
                border: `1px solid ${WARM.border}`, marginBottom: "6px",
                fontSize: "12px", color: WARM.textMid,
              }}>
                {new Date(h.timestamp).toLocaleDateString()} — {h.profile.interests.map((id) => SUBJECTS.find((s) => s.id === id)?.emoji).join(" ")}
              </div>
            ))}
          </div>
        )}
      </div>
    )}

    {/* ── LESSON ── */}
    {phase === "lesson" && (
      <div style={{ animation: "fadeIn 0.4s ease" }}>
        <StepIndicator current={0} total={3} labels={["Lesson", "Assignment", "Assessment"]} />
        <ContentBlock title="Today's Lesson" icon="📖" content={lesson}
          color={WARM.ember} loading={loading.lesson} />
        {lesson && !loading.lesson && (
          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <Button onClick={() => { setPhase("profile"); setProfileStep(3); }}>← Profile</Button>
            <Button primary onClick={() => { setPhase("assignment"); generateAssignment(); }}>
              Create Assignment →
            </Button>
          </div>
        )}
      </div>
    )}

    {/* ── ASSIGNMENT ── */}
    {phase === "assignment" && (
      <div style={{ animation: "fadeIn 0.4s ease" }}>
        <StepIndicator current={1} total={3} labels={["Lesson", "Assignment", "Assessment"]} />
        <ContentBlock title="Today's Lesson" icon="📖" content={lesson} color={WARM.ember} />
        <ContentBlock title="Assignment" icon="✏️" content={assignment}
          color={WARM.forest} loading={loading.assignment} />
        {assignment && !loading.assignment && (
          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <Button onClick={() => setPhase("lesson")}>← Lesson</Button>
            <Button primary onClick={() => { setPhase("assessment"); generateAssessment(); }}>
              Create Assessment →
            </Button>
          </div>
        )}
      </div>
    )}

    {/* ── ASSESSMENT ── */}
    {phase === "assessment" && (
      <div style={{ animation: "fadeIn 0.4s ease" }}>
        <StepIndicator current={2} total={3} labels={["Lesson", "Assignment", "Assessment"]} />
        <ContentBlock title="Today's Lesson" icon="📖" content={lesson} color={WARM.ember} />
        <ContentBlock title="Assignment" icon="✏️" content={assignment} color={WARM.forest} />
        <ContentBlock title="Growth Assessment" icon="🌱" content={assessment}
          color={WARM.sky} loading={loading.assessment} />
        {assessment && !loading.assessment && (
          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", flexWrap: "wrap" }}>
            <Button onClick={() => setPhase("assignment")}>← Assignment</Button>
            <Button onClick={generateLesson} style={{ borderColor: WARM.ember, color: WARM.ember }}>
              🔥 New Lesson (same student)
            </Button>
            {onSendToPlanner && (
              <Button onClick={() => onSendToPlanner({ profile: { ...profile }, lesson, assignment, assessment })}
                style={{ borderColor: WARM.gold, color: WARM.gold }}>
                📤 Send to Planner
              </Button>
            )}
            <Button primary onClick={saveAndReset}>
              Save & New Student →
            </Button>
          </div>
        )}
      </div>
    )}

    {/* Footer */}
    <footer style={{
      marginTop: "40px", paddingTop: "16px",
      borderTop: `1px solid ${WARM.border}`, textAlign: "center",
    }}>
      <p style={{ fontSize: "10px", color: WARM.textFaint, lineHeight: 1.6, fontStyle: "italic" }}>
        Kindling — Educational Equality for All<br />
        Built on a sofa in Stuart, Florida<br />
        Because every student deserves the frontier, not the floor.<br />
        🔥 🍵
      </p>
    </footer>
  </main>
</div>
```

);
}
