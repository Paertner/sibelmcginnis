import type { EmailBlock } from "./email-blocks";

// Built-in starting points. Each opens as editable blocks; saved templates live in the store.
function layout(
  label: string,
  title: string,
  body: EmailBlock[],
  button = "Open my account",
): EmailBlock[] {
  return [
    {
      id: "header",
      type: "header",
      eyebrow: `MORNING COFFEE COMMUNITY · ${label}`,
      title,
    },
    { id: "hello", type: "text", html: "Hello {{first_name}}," },
    ...body,
    { id: "cta", type: "button", label: button, href: "{{account_url}}" },
    {
      id: "signoff",
      type: "text",
      html: "With care,<br><strong>Sibel</strong>",
    },
  ];
}
const text = (id: string, html: string): EmailBlock => ({
  id,
  type: "text",
  html,
});
export const defaultEmailFooter: EmailBlock[] = [
  { id: "footer-line", type: "divider" },
  {
    id: "footer-note",
    type: "note",
    html: 'A little space to connect, reflect, and grow.<br>Morning Coffee Community · <a href="{{account_url}}" style="color:#9b5e41">Your account</a>',
  },
];
export const emailTemplates: {
  id: string;
  name: string;
  description: string;
  subject: string;
  footer: boolean;
  blocks: EmailBlock[];
}[] = [
  {
    id: "saturday",
    name: "Saturday circle",
    description: "Invite members to this week’s conversation.",
    subject: "This Saturday: a little space for you",
    footer: true,
    blocks: layout(
      "SATURDAY CIRCLE",
      "Let’s make room for a meaningful conversation.",
      [
        text(
          "b1",
          "This Saturday, we’ll explore <strong>[session topic]</strong> together.",
        ),
        text(
          "b2",
          "<strong>When:</strong> [date] at 10:30 AM<br><strong>Duration:</strong> 90 minutes",
        ),
        text(
          "b3",
          "Bring your coffee, your questions, and yourself just as you are. Open your account to access the session when it is time.",
        ),
      ],
    ),
  },
  {
    id: "consultation",
    name: "Your consultation",
    description: "A personal note before one-on-one time.",
    subject: "Your one-on-one time with Sibel",
    footer: true,
    blocks: layout("ONE-ON-ONE", "Time set aside, just for you.", [
      text(
        "b1",
        "I’m looking forward to our conversation about <strong>[coaching topic]</strong>.",
      ),
      text(
        "b2",
        "<strong>Your appointment:</strong> [date and time]<br><strong>Duration:</strong> 45 minutes",
      ),
      text(
        "b3",
        "Before we meet, consider one thing you would love to leave our conversation feeling clearer about. You can find your appointment in your account.",
      ),
    ]),
  },
  {
    id: "welcome",
    name: "A warm welcome",
    description: "Help a new member feel at home.",
    subject: "Welcome to Morning Coffee Community",
    footer: true,
    blocks: layout("WELCOME", "There’s a place for you here.", [
      text(
        "b1",
        "I’m so glad you’ve joined Morning Coffee Community. This is a space to slow down, reflect honestly, and grow alongside other women.",
      ),
      text(
        "b2",
        "Start by exploring the member library. If you have Premium membership, your Saturday circles, podcast, and personal consultation are waiting in your account.",
      ),
      text(
        "b3",
        "There is no perfect way to begin. One small, honest step is enough.",
      ),
    ]),
  },
  {
    id: "reflection",
    name: "Weekly reflection",
    description: "Share a gentle practice or follow-up.",
    subject: "A reflection to carry into your week",
    footer: true,
    blocks: layout("REFLECTION", "One small practice. A little more clarity.", [
      text("b1", "This week, give yourself five quiet minutes to explore:"),
      {
        id: "b2",
        type: "quote",
        html: "What did I feel? What did I need? What is one kind action I can take?",
      },
      text("b3", "[Add your personal reflection, recap, or follow-up here.]"),
      text(
        "b4",
        "You can return to the conversation and resources in your member account whenever you need them.",
      ),
    ]),
  },
  {
    id: "personal",
    name: "A personal note",
    description: "Write directly to one member or a small group.",
    subject: "A personal note from Sibel",
    footer: true,
    blocks: layout(
      "A PERSONAL NOTE",
      "A little encouragement for your next chapter.",
      [
        text("b1", "[Write your personal message here.]"),
        text(
          "b2",
          "[Add a helpful next step, coaching resource, or invitation.]",
        ),
        text(
          "b3",
          "You don’t have to work it all out at once. Let’s take the next step together.",
        ),
      ],
    ),
  },
];
