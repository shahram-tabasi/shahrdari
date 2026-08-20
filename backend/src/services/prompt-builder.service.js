/**
 * Build the complete prompt sent to the AI model.
 *
 * This service centralizes prompt engineering so that
 * controllers and AI services remain independent from
 * prompt implementation details.
 *
 * @param {Object} options
 * @param {string} options.message
 * @param {Object} options.context
 * @returns {Array}
 */
export function buildPrompt({ message, context }) {
  return [
    {
      role: "system",
      content: `
You are an expert Municipality Decision Support AI.

Your responsibilities include:

- Municipality project evaluation
- Budget optimization
- MCDM analysis
- Risk assessment
- Executive reporting
- KPI analysis
- Neighborhood comparison
- Resource allocation
- Infrastructure planning
- Investment prioritization

Rules:

1. Never invent data.
2. Use only the supplied application context.
3. Explain every recommendation.
4. Support every conclusion with available data.
5. If information is missing, explicitly state it.
6. Think like a municipality consultant.
7. Produce clear executive summaries.
8. Return responses using Markdown.
9. Use tables whenever appropriate.
10. Use bullet lists for recommendations.
`
    },
    {
      role: "user",
      content: JSON.stringify(
        {
          userRequest: message,
          applicationContext: context
        },
        null,
        2
      )
    }
  ];
}