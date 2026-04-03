# Kindred Studio

**Personalized lessons for every student. No accounts. No tracking. No data leaves the browser.**

🔥 **Live:** [kindred-studio.vercel.app](https://kindred-studio.vercel.app)

---

## The Problem

Most edtech platforms require student emails, Google accounts, or district-managed logins before a child can access a lesson. Student data flows through corporate infrastructure by default. Teachers who care about privacy have no alternative.

## The Answer

Kindred Studio generates personalized lessons adapted to each student's interests, level, language, and learning needs — without collecting any personal data. Authentication is cryptographic and client-side. The AI only ever sees anonymized profiles. Names, schools, and diagnosis codes never leave the browser.

Every student deserves the frontier, not the floor.

---

## Who This Is For

- **Teachers** who don't want to manage student accounts or send PII through Google
- **Special education educators** who need individualized content without compliance nightmares
- **Homeschool families** who want adaptive curriculum without surveillance
- **Language communities** preserving endangered languages through education (38 languages including Cherokee, Övdalsk, Māori, Hawaiian)
- **Privacy-conscious schools** looking for COPPA compliance by architecture, not by policy

---

## What It Does

**Kindling** — AI lesson generator. Enter a student profile (interests, level, language, learning needs, pedagogical philosophy). Get a personalized lesson, assignment, and assessment. Twelve philosophies built in: Kindred, Finnish, Montessori, Reggio Emilia, Waldorf, Forest School, Swedish, Norwegian, Te Whāriki, IB, Competency-Based, and Classical.

**Kindred Planner** — Block-based lesson plan editor. Drag, reorder, lock, and export blocks. Eleven block types from Activity to Compliance to Parent Comms. Teachers build plans their way.

**Classroom Mode** — Roster management, batch generation, and multi-lens assessment across six frameworks (Kindred, Finnish, Montessori, Competency, Waldorf, Forest School).

All three tools share a single authentication layer and data bridge. Kindling generates. The Planner structures. Classroom scales.

---

## Privacy Architecture

**No passwords are stored. Anywhere. Ever.**

- **Teachers**: Passphrase → deterministic cryptographic key → same key on any device
- **Students**: Teacher generates a random access code → ephemeral key → dies when session ends
- **Parents**: View code → read-only ephemeral key → no data collected

The AI never sees student names, schools, addresses, or diagnosis codes. PII is stripped client-side before any API call. The system is COPPA compliant by design, not by policy.

Full technical details: see [Crypto Cookie Architecture](#authentication-crypto-cookie) below.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                 KINDRED STUDIO                   │
│              (App Shell + Auth)                   │
├──────────────────┬──────────────────────────────┤
│                  │                               │
│   ┌──────────┐   │   ┌────────────────────┐     │
│   │ Kindling │───┼──→│   Lesson Planner    │     │
│   │(Generate)│   │   │  (Structure/Edit)   │     │
│   └──────────┘   │   └────────────────────┘     │
│        │         │            │                  │
│        ▼         │            ▼                  │
│   ┌──────────────┴────────────────────────┐     │
│   │        PII Stripping Layer            │     │
│   │   (CryptoCookie.stripPII)             │     │
│   └──────────────┬────────────────────────┘     │
│                  │                               │
│                  ▼                               │
│   ┌──────────────────────────────────────┐      │
│   │         Claude API (Sonnet)          │      │
│   │  Sees: level, language, interests,   │      │
│   │        needs, custom notes           │      │
│   │  Never sees: name, school, address,  │      │
│   │             diagnosis codes          │      │
│   └──────────────────────────────────────┘      │
└─────────────────────────────────────────────────┘
```

---

## Authentication: Crypto Cookie

Crypto Cookie is a lightweight client-side authentication system. It replaces passwords, OAuth, and tracking cookies with public-key cryptography. No server stores credentials. No third-party identity provider touches student data.

### What Problem It Solves

Most educational platforms require email accounts, passwords, and OAuth through Google or Microsoft. This means student identity flows through corporate infrastructure before a child can access a lesson. Crypto Cookie eliminates that dependency. Authentication happens entirely in the browser using cryptographic key pairs.

### How It Works

**No passwords are stored. Anywhere. Ever.**

- **Teachers**: Enter a passphrase → PBKDF2 derives a deterministic ECDSA P-256 key → same passphrase produces same key on any device
- **Students**: Teacher generates a random access code → student enters it → ephemeral key created for the session → key dies when session ends
- **Parents**: Teacher generates a view code → parent enters it → ephemeral read-only key created → no data collected

### Key Properties

| Property | Implementation |
|---|---|
| Per-site isolation | Each site gets its own key pair — cross-site reuse fails by design |
| Key rotation | Auto-rotates every 5 minutes during active sessions |
| Key revocation | Fingerprint-based revocation list checked at verification |
| Session tokens | Cryptographically random, ephemeral, replaceable |
| PII stripping | Student identifiers never leave the client |
| Storage footprint | ~100-250 bytes per site |
| Signing speed | Millisecond-scale |

### Quantum-Resistant Architecture

The current implementation uses ECDSA P-256 (classical). The architecture is designed for modular primitive swap:

- **Signatures**: ECDSA P-256 → CRYSTALS-Dilithium (NIST PQC standard)
- **Key encapsulation**: ECDH → CRYSTALS-Kyber (NIST PQC standard)

The auth flow (challenge-response, rotation, revocation, PII stripping) remains identical. Only the crypto primitives change. When browser-native support for post-quantum algorithms arrives, this is a library swap, not a rewrite.

---

## User Roles

### Teacher (🔑 Passphrase Auth)

- Full access to Kindling (lesson generation)
- Full access to Lesson Planner (block editor)
- Generate student access codes
- Generate parent view codes
- View all student progress
- Export lesson plans (TXT, PDF, DOCX)
- Save and share lesson plan templates

### Student (🎒 Access Code Auth)

- View assigned lessons in their language at their level
- Complete assignments inline
- Self-reflection assessments
- "What do you want to learn next?" feedback loop
- No account creation required
- No email required
- COPPA compliant by architecture

### Parent (🏡 View Code Auth)

- Read-only view of child's progress
- See completed lessons and growth metrics
- Ephemeral session — no persistent tracking
- No data collected about the parent

---

## Kindling — Lesson Generator

### Student Profile

The profile captures everything needed to personalize content without storing PII:

- **Name** (stored client-side only, never sent to API)
- **Level**: Pre-K through Adult Learner
- **Language**: 38 languages including Cherokee (ᏣᎳᎩ), Finnish, Icelandic, Norwegian, Danish, Övdalsk, Farsi, Irish, Scottish Gaelic, Haitian Creole, Hawaiian, Māori, and others
- **Pedagogical Philosophy**: Kindred (default), Finnish (OPH), Montessori, Reggio Emilia, Waldorf/Steiner, Forest School, Swedish (Lgr22), Norwegian (LK20), Te Whāriki (NZ), IB Framework, Competency-Based, Classical (Trivium)
- **Interests**: 24 subjects including Music & Composition, Rhythm & Percussion, Coding & Logic, Geology, Theatre, Linguistics, Mythology, Ecology, Photography
- **Learning Needs**: Visual, Auditory, Kinesthetic, ADHD, Dyslexia, ESL, Gifted, Test Anxiety, Autism Spectrum, Trauma-Informed, Bullying-Informed

### Pedagogical Philosophy System

The teacher selects a pedagogical philosophy during student profile setup. This selection changes the system prompt sent to the AI, adapting how content is generated:

- **Kindred**: frontier-focused, interest-driven, no busywork, no artificial ceiling
- **Finnish**: transversal competences, wellbeing as outcome, no grades before age 11
- **Montessori**: follow the child, concrete before abstract, intrinsic motivation only
- **Reggio Emilia**: hundred languages of children, emergent project-based inquiry
- **Waldorf**: arts integration, developmental stages, oral storytelling before written work
- **Forest School**: outdoor-based, nature connection, risk-taking as healthy development
- **Swedish**: democracy, creativity, student agency, critical thinking
- **Norwegian**: deep learning over surface coverage, sustainability across subjects
- **Te Whāriki**: empowerment, holistic development, bicultural foundation
- **IB**: inquiry-based, international mindedness, learner profile
- **Competency-Based**: mastery demonstration, flexible pacing, evidence portfolios
- **Classical**: trivium (grammar, logic, rhetoric), Socratic dialogue, primary sources

The same student profile generates different content depending on the selected philosophy. A Montessori lesson emphasizes self-directed exploration. A Finnish lesson emphasizes wellbeing and collaborative learning. The teacher chooses. The AI adapts.

### Generation Pipeline

```
Student Profile → System Prompt Builder → Claude API → Lesson
                                                      → Assignment
                                                      → Assessment
```

Each stage feeds the next. The assignment is built from the lesson. The assessment is built from both. Every generation adapts to the student's profile.

### Design Principles

- Never create busywork
- Connect to student interests whenever possible
- Integrate accommodations naturally — never call them out
- Trauma-informed: emotional safety first, predictable structure, always offer choice
- Bullying-informed: collaborative tasks, belonging themes, no competitive ranking
- The ceiling is the frontier of knowledge itself
- Frame assessments as exploration, not testing

### Demo Mode

When the API is unavailable, Kindling generates template content personalized to the student profile. The app is always functional regardless of API status.

---

## Lesson Planner — Block Editor

### Block Types

| Block | Icon | Purpose |
|---|---|---|
| Text / Notes | 📝 | Rich notes, descriptions, talking points |
| List | 📋 | Objectives, materials, questions |
| Activity | 🎯 | Structured activity with objective & procedure |
| Reflection | 🪞 | Student reflection prompts |
| Timer / Pacing | ⏱️ | Duration and pacing notes |
| Resources | 🔗 | Links, references, materials |
| Assessment | 🌱 | Observations and growth criteria |
| Parent Comms | 💌 | Message home and take-home activities |
| Field / Outdoor | 🌿 | Outdoor component and nature connections |
| Compliance | 📁 | Minimal archival documentation |
| Custom | ✨ | Teacher names it, fills it however they want |
| Divider | — | Visual separator with optional heading |

### Features

- **Modular**: Add, remove, reorder any block
- **Collapsible**: Focus on what you're working on
- **Renamable**: Every block title is editable
- **Templates**: Save your arrangement as a reusable template
- **Export**: TXT export matching professional lesson plan format
- **Block Locking**: 🔒/🔓 toggle per block. Locked blocks can't be removed, reordered, or renamed. Content remains editable. Gold border visual indicator. Teachers lock their template structure, then fill content without risk of accidentally breaking the plan.
- **Kindling Integration**: "Import from Kindling" populates matching blocks

### Default Template

Based on a lesson plan format informed by special education and trauma-informed pedagogy:

1. Lesson Overview (text)
2. Learning Objectives (list)
3. Materials Needed (list)
4. --- Activities & Procedures ---
5. Opening Discussion (text)
6. Activity 1 (activity)
7. Wrap-Up Discussion (text)
8. --- Assessment & Documentation ---
9. Assessment (assessment)
10. Field / Outdoor Component (outdoor)
11. Documentation & Reflection (text)
12. Parent Communication (parent)
13. Compliance / Archiving (compliance)

Teachers can delete, add, or rearrange any of these. A Montessori teacher, a homeschool parent, and a Japanese instructor will each have different structures. The tool adapts to the teacher.

---

## Classroom Mode

Classroom Mode lets a teacher manage multiple students and generate content for an entire class from a single interface.

### Roster

Add students with individual profiles (name, level, language, interests, needs). Each student's profile is stored client-side only. The roster persists for the session.

### Batch Generation

Teacher enters a topic (e.g., "Volcanoes," "Fractions," "Poetry"). Kindling generates individualized content for each student based on their profile and the classroom's selected philosophy. Students with similar profiles can share a generation call to reduce API costs.

### Assessment Lenses

The same student data renders differently depending on which assessment lens the teacher selects:

| Lens | Input Type | What It Measures |
|---|---|---|
| Kindred | 1-5 scale | Curiosity, connection-making, creativity, engagement |
| Finnish | Narrative text | Growth narrative, wellbeing, transversal competences |
| Montessori | 1-5 scale | Mastery level, independence, concentration |
| Competency | 1-5 scale | Skill proficiency, evidence, pace |
| Waldorf | Narrative text | Artistic integration, developmental stage, narrative |
| Forest School | 1-5 scale | Resilience, risk-taking, nature connection |

Teachers switch lenses via dropdown. The underlying observations don't change — only the view. A teacher can assess a student through a Finnish lens on Monday and a Montessori lens on Tuesday using the same raw data.

### Design Principle

The assessment system stores philosophy-neutral raw observations. The lens is a rendering choice, not a data transformation. This means a school that changes its pedagogical approach doesn't lose historical student data — it just switches the view.

---

## Privacy Architecture

### FERPA Compliance

- Student education records (names, grades, IEP data) never leave the client
- API calls receive anonymous profiles only
- No central database of student information
- Teacher controls all data through their local session

### COPPA Compliance

- No account creation for children under 13
- No email collection from minors
- No tracking cookies — Crypto Cookie is privacy-preserving by design
- No third-party analytics touching student data
- Parent can view and teacher can delete any student profile

### GDPR Compliance

- Data minimization: only collect what's needed for lesson generation
- Right to erasure: teacher or parent can wipe a student profile completely
- No data export to third parties
- Processing happens client-side wherever possible

### PII Stripping

Before any API call to Claude:

```javascript
CryptoCookie.stripPII(studentProfile)

// INPUT (client-side):
{
  name: "Jake Martinez",
  school: "Riverside Elementary",
  level: "upper",
  language: "English",
  interests: ["dinosaurs", "space"],
  needs: ["adhd", "visual"],
  customNote: "IEP goal: reading fluency"
}

// OUTPUT (sent to API):
{
  level: "upper",
  language: "English",
  interests: ["dinosaurs", "space"],
  needs: ["adhd", "visual"],
  customNote: "IEP goal: reading fluency"
}

// Name and school NEVER leave the client.
```

---

## Deployment

### Development (Local)

```bash
# Clone the repo
git clone https://github.com/polymathsofa/kindred-studio.git
cd kindred-studio

# Install dependencies
npm install

# Set environment variables
echo "ANTHROPIC_API_KEY=your-key-here" > .env.local

# Run development server
npm run dev
```

### Production (Docker)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t kindred-studio .
docker run -p 3000:3000 \
  -e ANTHROPIC_API_KEY=your-key-here \
  kindred-studio
```

### Free Tier Deployment

**Vercel** (recommended for prototype):
```bash
npm i -g vercel
vercel
# Set ANTHROPIC_API_KEY in Vercel dashboard → Settings → Environment Variables
```

**Netlify**:
```bash
npm i -g netlify-cli
netlify deploy --prod
# Set ANTHROPIC_API_KEY in Netlify dashboard → Site settings → Environment variables
```

### API Proxy (Required for Production)

Never expose the Anthropic API key to the browser. Create a server-side proxy:

```javascript
// /api/generate.js (Vercel API Route)
export default async function handler(req, res) {
  const { systemPrompt, userMessage } = req.body;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  const data = await response.json();
  res.status(200).json(data);
}
```

The client calls `/api/generate` instead of the Anthropic API directly. The key never touches the browser.

---

## File Structure

```
kindred-studio/
├── README.md              ← You are here
├── LICENSE                ← AGPL-3.0 (+ separate commercial license)
├── package.json
├── vite.config.js
├── index.html             ← Entry point for Vite build
├── src/
│   ├── main.jsx           ← React mount point
│   ├── kindred-studio.jsx ← App shell + Crypto Cookie + Classroom Mode
│   ├── kindling.jsx       ← Lesson generator (12 philosophies, 38 languages)
│   └── kindred-planner.jsx ← Block editor with locking
├── curriculum/
│   └── sources.md         ← Links to all free curriculum PDFs
├── api/
│   └── generate.js        ← API proxy for Claude calls (Vercel)
└── .env.local             ← ANTHROPIC_API_KEY (never committed)
```

---

## Roadmap

### v0.1 (Current)
- [x] Kindling lesson generator with demo fallback
- [x] Kindred Planner modular block editor
- [x] Crypto Cookie auth (ECDSA P-256)
- [x] Three-role login (teacher, student, parent)
- [x] PII stripping layer
- [x] Access code generation
- [x] TXT export
- [x] 12 pedagogical philosophies with system prompt variants
- [x] 38 languages including Cherokee, Övdalsk, Māori
- [x] 24 subjects including Music & Composition, Coding, Theatre
- [x] Block locking (🔒/🔓) in Planner
- [x] Kindling → Planner data bridge
- [x] Classroom Mode: roster, batch generation, assessment lenses
- [x] 6 assessment lenses (Kindred, Finnish, Montessori, Competency, Waldorf, Forest School)
- [x] Trauma-informed and bullying-informed content parameters
- [x] Curriculum sources reference (Finland, Sweden, Norway, NZ, Japan + 6 philosophies)

### v1 (Next)
- [ ] Deploy to Vercel with working API proxy
- [ ] Persistent storage (SQLite for single instance)
- [ ] PDF / DOCX batch export from Classroom
- [ ] Template saving/sharing between teachers
- [ ] OpenDyslexic font toggle + high contrast mode
- [ ] Musical curriculum module (piano tutor integration)
- [ ] Copy as Markdown per block

### v2 (Future)
- [ ] Google Classroom / Canvas / Schoology LMS export
- [ ] SCORM/LTI compatible packages
- [ ] External API pulls (arXiv, Wikipedia, Khan Academy, OpenStax)
- [ ] IEP compliance logging
- [ ] Teacher i18n (interface in teacher's language)
- [ ] Quantum-resistant crypto swap (Dilithium + Kyber)
- [ ] Student progress tracking across sessions
- [ ] Growth analytics dashboard
- [ ] Federation: each school runs own instance with optional template sync

---

## Transparency

**AI Co-Development Disclosure:** Kindred Studio was developed in collaboration with Claude (Anthropic). Claude contributed to code generation, documentation, architecture discussions, and curriculum research. All design decisions, pedagogical philosophy, and creative direction are by Richard Grant Kleinhans. This disclosure is made voluntarily.

---

## Credits

**Architecture & Design**: Richard Grant Kleinhans (@polymathsofa)  
**ORCID**: 0009-0006-2580-5712  
**Co-development**: Claude (Anthropic)  

Built by an independent researcher with lived experience in special education and trauma-informed learning, who believes every student deserves the frontier, not the floor.

*Built on a sofa in Stuart, Florida.* **Educational Equality for All.** 🔥 🍵

The Crypto Cookie authentication system was designed as a web privacy standard replacement for tracking cookies — repurposed here to protect children's data with the same architecture that could protect the entire web.

---

## License

Kindred Studio is licensed under **AGPL-3.0**. This means:

- Free to use, modify, and deploy for anyone — schools, homeschool families, nonprofits, individuals
- All modifications must remain open source if deployed as a service
- Forks must share their source under the same terms

**Commercial License**: Organizations that want to deploy Kindred Studio as a closed-source product or SaaS without sharing modifications can contact the author for a separate commercial license.

**Model Agnostic**: Kindred Studio currently uses Anthropic's Claude API for generation. The framework is designed to work with any LLM — local models (Llama, Mistral, Gemma), other APIs, or custom fine-tuned models. The pedagogical architecture is the value, not the API underneath.

*Because everyone learns. Because everyone deserves privacy. Because every student deserves a teacher who gives a damn.*

🔥 🍵
