
// Gemini Service - Using mock data to avoid API key issues in browser

export const generateEmailDraft = async (prompt: string, context?: string) => {
  try {
    // Return a mock email draft
    return `Dear Recipient,\n\n${prompt}\n\nBest regards`;
  } catch (error) {
    console.error('Gemini Error:', error);
    return "Failed to generate draft.";
  }
};

export const summarizeThread = async (emails: string[]) => {
  try {
    // Return a mock summary
    return [
      "• Email discussion initiated with key points",
      "• Follow-up response with additional details",
      "• Final resolution agreed upon"
    ];
  } catch (error) {
    console.error('Summarize Error:', error);
    return ["Unable to summarize thread"];
  }
};

