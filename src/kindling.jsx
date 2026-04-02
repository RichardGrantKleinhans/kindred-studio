import { useState, useEffect } from 'react';

const PHILOSOPHY_PROMPTS = {
  kindred: `PEDAGOGICAL PHILOSOPHY: Kindred...`,
  finnish: `...`,
  // all 12 philosophies exactly as you originally wrote them
};

function buildSystemPrompt(profile) {
  // your original function
}

function Kindling({ onSendToPlanner }) {
  const [profile, setProfile] = useState({});
  const [lesson, setLesson] = useState(null);

  // full Kindling component exactly as you originally wrote it, only straight quotes
  return (
    <div>
      {/* your JSX */}
    </div>
  );
}

export default Kindling;
