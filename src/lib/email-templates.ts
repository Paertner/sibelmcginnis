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
const footerText = { color: "#232323", fontSize: "normal" } as const;
/** Ready-made footers the admin can start from in the footer editor. */
export const footerTemplates: {
  id: string;
  name: string;
  description: string;
  blocks: EmailBlock[];
}[] = [
  {
    id: "simple",
    name: "Simple",
    description: "A short line with a link to the member’s account.",
    blocks: defaultEmailFooter,
  },
  {
    id: "newsletter",
    name: "Newsletter",
    description:
      "Social icons, copyright, mailing address and email preference links.",
    blocks: [
      {
        id: "nl-line",
        type: "divider",
        style: { accent: "#171717", thickness: "medium" },
      },
      { id: "nl-social", type: "social" },
      {
        id: "nl-copyright",
        type: "note",
        html: "<em>Copyright © {{year}} {{site_title}}. All rights reserved.</em><br>You are receiving this email because you opted in via our website.",
        style: footerText,
      },
      {
        id: "nl-address",
        type: "note",
        html: "<strong>Our mailing address is:</strong><br>{{site_title}} · {{mailing_address}}",
        style: footerText,
      },
      {
        id: "nl-preferences",
        type: "note",
        html: 'Want to change how you receive these emails?<br>You can <a href="{{preferences_url}}">update your preferences</a> or <a href="{{unsubscribe_url}}">unsubscribe</a>.',
        style: footerText,
      },
    ],
  },
];
/** The footer new sites start with: social icons, address and preference links. */
export const newsletterFooter = footerTemplates[1].blocks;
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
  {
    id: "newsletter",
    name: "Newsletter",
    description:
      "Title, quote, image, bullet list, meeting details, signature and a button.",
    subject: "Join us this Saturday at Morning Coffee",
    footer: true,
    blocks: [
      {
        id: "nl-browser",
        type: "note",
        html: '<a href="{{site_url}}" style="color:#8d7a6d">View this email in your browser</a>',
      },
      {
        id: "nl-title",
        type: "text",
        html: "<strong>[Your newsletter title]</strong>",
        style: { align: "center", fontSize: "large", color: "#171717" },
      },
      {
        id: "nl-quote",
        type: "text",
        html: "<em>“[A short quote or thought for this week.]”</em>",
        style: { align: "center" },
      },
      {
        id: "nl-image",
        type: "image",
        path: "",
        alt: "",
        style: { width: "full" },
      },
      {
        id: "nl-hello",
        type: "text",
        html: "Ladies,<br><br>Hello {{first_name}},",
      },
      {
        id: "nl-intro",
        type: "text",
        html: "[Write a short, warm introduction to this week’s meeting.]",
      },
      {
        id: "nl-explore",
        type: "text",
        html: "<strong>In this meeting, we’ll explore:</strong><ul><li>[First topic]</li><li>[Second topic]</li><li>[Third topic]</li></ul>",
      },
      {
        id: "nl-details",
        type: "text",
        html: "<strong>Meeting Details:</strong><br><strong>Date:</strong> [Saturday, date]<br><strong>Time:</strong> 10:30 AM<br><strong>Location:</strong> [Zoom or place]",
      },
      {
        id: "nl-closing",
        type: "text",
        html: "[Closing words: come as you are, bring your coffee, and we’ll make room for you.]",
      },
      {
        id: "nl-signature",
        type: "text",
        html: "Warm Regards,<br><strong>Sibel McGinnis</strong> 🌻<br>Founder | Morning Coffee Community",
      },
      {
        id: "nl-tags",
        type: "text",
        html: "#MorningCoffeeCommunity #WomenSupportingWomen #SaturdayCircle",
        style: { color: "#9b5e41" },
      },
      {
        id: "nl-button",
        type: "button",
        label: "JOIN US THIS SATURDAY",
        href: "{{account_url}}",
        style: { accent: "#171717", shape: "square", align: "center" },
      },
    ],
  },
];
