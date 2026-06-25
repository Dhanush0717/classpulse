const { GoogleGenerativeAI } = require("@google/generative-ai");

const isGeminiConfigured = () => {
  return !!process.env.GEMINI_API_KEY;
};

const generateSessionSummary = async (session, feedbackList, doubtsList) => {
  const subject = session.subject;
  const totalFeedback = feedbackList.length;
  
  let totalPace = 0;
  let totalUnderstanding = 0;
  const comments = [];

  feedbackList.forEach(f => {
    totalPace += f.pace;
    totalUnderstanding += f.understanding;
    if (f.comment?.trim()) {
      comments.push(f.comment.trim());
    }
  });

  const avgPace = totalFeedback > 0 ? (totalPace / totalFeedback).toFixed(1) : "N/A";
  const avgUnderstanding = totalFeedback > 0 ? (totalUnderstanding / totalFeedback).toFixed(1) : "N/A";
  const unresolvedDoubts = doubtsList.filter(d => !d.isResolved).map(d => d.text);

  const prompt = `
You are ClassPulse AI, an assistant for teachers. Analyze this session's feedback and doubts:

Lecture Subject: "${subject}"
Total Feedback Responses: ${totalFeedback}
Average Pace Rating (1-5): ${avgPace}
Average Understanding Level (1-5): ${avgUnderstanding}

Student Comments:
${comments.length > 0 ? comments.map(c => `- "${c}"`).join("\n") : "None submitted"}

Unresolved Doubts Asked by Students:
${unresolvedDoubts.length > 0 ? unresolvedDoubts.map(d => `- "${d}"`).join("\n") : "None remaining"}

Provide a markdown summary with:
1. **Rating Summary**: Brief analysis of understanding and pace.
2. **Key Feedback Themes**: Group comments into general concerns or positives.
3. **Top Doubts & Issues**: Highlight critical confusion areas.
4. **Actionable Recommendations**: 3 suggestions for the teacher for the next class.

Keep the summary concise, professional, and formatted in clean markdown.
`;

  if (isGeminiConfigured()) {
    try {
      console.log(`[GEMINI AI] Requesting session summary for "${subject}"...`);
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error("❌ Gemini API summary generation failed:", error.message);
      // Fallback to mock summary on error
    }
  }

  // Mock Summary Fallback
  console.log(`[GEMINI AI] Generating mock summary for "${subject}"...`);
  return `### 📊 AI Lecture Summary (Simulation)

#### 1. Rating Summary
- **Pace (Avg: ${avgPace}/5)**: The majority of students felt the lecture speed was appropriate.
- **Understanding (Avg: ${avgUnderstanding}/5)**: The general concept absorption is moderate. Certain sub-concepts require clarification.

#### 2. Key Feedback Themes
${comments.length > 0 
  ? `- Students commented on topics such as: ${comments.slice(0, 3).map(c => `"${c.substring(0, 40)}..."`).join(", ")}.`
  : `- No text comments were provided to identify specific themes.`}
- The feedback indicates that students appreciated the visual slides but requested more practical code walk-throughs.

#### 3. Top Doubts & Issues
${unresolvedDoubts.length > 0
  ? unresolvedDoubts.slice(0, 3).map(d => `- **Confusion Area**: "${d}"`).join("\n")
  : `- No unresolved doubts were logged. Students appeared to follow the material.`}

#### 4. Actionable Recommendations
1. **Review Difficult Sub-Concepts**: Dedicate the first 5 minutes of the next class to addressing the top student doubts.
2. **Adjust Speed**: Incorporate short checkpoints during the lecture to verify pace dynamically.
3. **Share Notes Early**: Post the reference sheets and notes before class begins so students can follow along.
`;
};

module.exports = { generateSessionSummary };
