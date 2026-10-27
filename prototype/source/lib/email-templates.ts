function layout(
  label: string,
  title: string,
  body: string,
  button = "Open my account",
  href = "{{account_url}}",
) {
  return `<table role="presentation" width="100%" style="background-color:#f5f5f5;padding:28px;font-family:Arial,sans-serif;color:#232323"><tbody><tr><td align="center"><table role="presentation" width="600" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:20px"><tbody><tr><td style="padding:30px;background-color:#171717;color:#ededed;border-radius:20px"><p style="font-size:13px;color:#c0a385">MORNING COFFEE COMMUNITY · ${label}</p><h1 style="font-size:30px;font-weight:400;line-height:1.2;color:#ededed">${title}</h1></td></tr><tr><td style="padding:30px"><p>Hello {{first_name}},</p>${body}<p style="margin-top:28px"><a href="${href}" style="display:inline-block;background-color:#c0a385;color:#171717;padding:14px 22px;border-radius:10px;text-decoration:none">${button}</a></p><p style="margin-top:28px">With care,<br><strong>Sibel</strong></p></td></tr><tr><td style="padding:20px 30px;color:#666666;font-size:12px">A little space to connect, reflect, and grow.<br>Morning Coffee Community</td></tr></tbody></table></td></tr></tbody></table>`;
}
export const emailTemplates = [
  {
    id: "saturday",
    name: "Saturday circle",
    description: "Invite members to this week’s conversation.",
    subject: "This Saturday: a little space for you",
    html: layout(
      "SATURDAY CIRCLE",
      "Let’s make room for a meaningful conversation.",
      "<p>This Saturday, we’ll explore <strong>[session topic]</strong> together.</p><p><strong>When:</strong> [date] at 10:30 AM<br><strong>Duration:</strong> 90 minutes</p><p>Bring your coffee, your questions, and yourself just as you are. Open your account to access the session when it is time.</p>",
    ),
  },
  {
    id: "consultation",
    name: "Your consultation",
    description: "A personal note before one-on-one time.",
    subject: "Your one-on-one time with Sibel",
    html: layout(
      "ONE-ON-ONE",
      "Time set aside, just for you.",
      "<p>I’m looking forward to our conversation about <strong>[coaching topic]</strong>.</p><p><strong>Your appointment:</strong> [date and time]<br><strong>Duration:</strong> 45 minutes</p><p>Before we meet, consider one thing you would love to leave our conversation feeling clearer about. You can find your appointment in your account.</p>",
    ),
  },
  {
    id: "welcome",
    name: "A warm welcome",
    description: "Help a new member feel at home.",
    subject: "Welcome to Morning Coffee Community",
    html: layout(
      "WELCOME",
      "There’s a place for you here.",
      "<p>I’m so glad you’ve joined Morning Coffee Community. This is a space to slow down, reflect honestly, and grow alongside other women.</p><p>Start by exploring the member library. If you have Premium membership, your Saturday circles, podcast, and personal consultation are waiting in your account.</p><p>There is no perfect way to begin. One small, honest step is enough.</p>",
    ),
  },
  {
    id: "reflection",
    name: "Weekly reflection",
    description: "Share a gentle practice or follow-up.",
    subject: "A reflection to carry into your week",
    html: layout(
      "REFLECTION",
      "One small practice. A little more clarity.",
      '<p>This week, give yourself five quiet minutes to explore:</p><blockquote style="border-left:3px solid #c0a385;padding-left:18px;color:#555555">What did I feel? What did I need? What is one kind action I can take?</blockquote><p>[Add your personal reflection, recap, or follow-up here.]</p><p>You can return to the conversation and resources in your member account whenever you need them.</p>',
    ),
  },
  {
    id: "personal",
    name: "A personal note",
    description: "Write directly to one member or a small group.",
    subject: "A personal note from Sibel",
    html: layout(
      "A PERSONAL NOTE",
      "A little encouragement for your next chapter.",
      "<p>[Write your personal message here.]</p><p>[Add a helpful next step, coaching resource, or invitation.]</p><p>You don’t have to work it all out at once. Let’s take the next step together.</p>",
    ),
  },
] as const;
