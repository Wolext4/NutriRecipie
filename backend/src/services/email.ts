export async function sendMealPlanEmail(to: string, name: string, plan: Array<{ date: string; recipeName: string }>) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return false;
  const rows = plan.map((item) => `<li>${item.date}: ${item.recipeName}</li>`).join("");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject: "Your NutriRecipie meal plan", html: `<p>Hi ${name},</p><p>Here is your upcoming meal plan:</p><ul>${rows}</ul>` })
  });
  if (!response.ok) throw new Error(`Email provider request failed (${response.status}).`);
  return true;
}
