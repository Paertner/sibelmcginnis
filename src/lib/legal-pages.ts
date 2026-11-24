// Generated from the owner's Word documents (Terms, Privacy, Disclaimer, Content & Licensing, Code of Conduct).
// Wording is kept as written; **text** marks bold.
export type LegalBlock =
  { type: "h2" | "h3" | "p"; text: string } | { type: "ul"; items: string[] };
export type LegalPage = {
  slug: string;
  label: string;
  title: string;
  blocks: LegalBlock[];
};

export const legalPages: LegalPage[] = [
  {
    slug: "terms",
    label: "Terms of Service",
    title: "Terms of Service (TOS)",
    blocks: [
      {
        type: "p",
        text: "STM Development Services LLC",
      },
      {
        type: "p",
        text: "Last updated: 01/01/2026",
      },
      {
        type: "p",
        text: "Jurisdiction: Maryland",
      },
      {
        type: "h2",
        text: "1) Introduction",
      },
      {
        type: "p",
        text: "**STM Development Services LLC** is a Maryland limited liability company (the “Company,” “we,” “us,” or “our”), provides adult personal development and training services, including but not limited to online courses, live sessions, coaching-style content, podcasts, video content, and related materials (collectively, the “Services”). By accessing or using STM Development Services LLC, you (“User,” “Member,” or “you”) agree to be bound by these Terms of Service and our Privacy Policy.",
      },
      {
        type: "h2",
        text: "2) Acceptance of Terms",
      },
      {
        type: "p",
        text: "By creating an account or using the Services, you acknowledge that you have read, understood, and agree to be bound by these TOS and any other policies referenced herein. If you do not agree, do not use STM Development Services LLC.",
      },
      {
        type: "h2",
        text: "3) Eligibility",
      },
      {
        type: "ul",
        items: [
          "You must be at least 18 years old to use the Services.",
          "You may not use STM Development Services LLC if you are barred by law from receiving or using the Services.",
          "You are responsible for providing accurate information during sign-up and updating it as needed.",
        ],
      },
      {
        type: "h2",
        text: "4) Services and Subscription",
      },
      {
        type: "p",
        text: "**Description:** STM Development Services LLC provides adult personal development and training content, including courses, workshops, coaching sessions, video content, and related resources.",
      },
      {
        type: "p",
        text: "**Access:** Certain content may require a paid membership or a one-time purchase. Access is non-transferable and may be revoked for non-payment or violation of these Terms.",
      },
      {
        type: "p",
        text: "**Modifications:** We may modify, suspend, or discontinue features, content, or pricing at any time with reasonable notice.",
      },
      {
        type: "h2",
        text: "5) User Conduct",
      },
      {
        type: "p",
        text: "You agree to use STM Development Services LLC for lawful purposes and in compliance with these Terms.",
      },
      {
        type: "p",
        text: "Prohibited conduct includes, but is not limited to, harassment, hate speech, threats, doxxing (the act of publicly revealing someone's private or identifying information online without their consent, often with malicious intent), illegal activity, sharing of illegal or pirated content, or any activity that interferes with others’ use of STM Development Services LLC.",
      },
      {
        type: "p",
        text: "Respect privacy and boundaries; no unsolicited contact or spamming within community features.",
      },
      {
        type: "h2",
        text: "6) Content Ownership and Licenses",
      },
      {
        type: "p",
        text: "**User Content:** If you upload or post content (e.g., comments, testimonials, questions), you grant the The company has a non-exclusive, royalty-free, worldwide license to use, display, reproduce, and distribute such content in connection with STM Development Services LLC.",
      },
      {
        type: "p",
        text: "**Company Content:** All materials provided by the Company (courses, templates, videos, webinars, printables) are the Company’s intellectual property unless stated otherwise. You receive a limited, non-transferable, non-sublicensable license to use such content for your personal development by the terms of your subscription or purchase.",
      },
      {
        type: "p",
        text: "**Prohibitions:** Do not copy, modify, distribute, or create derivative works from Company content beyond what is authorized by these Terms.",
      },
      {
        type: "h2",
        text: "7) Privacy",
      },
      {
        type: "p",
        text: "Your use of STM Development Services LLC is also governed by our Privacy Policy. By using STM Development Services LLC, you consent to the collection, use, and disclosure of your information as described in the Privacy Policy.",
      },
      {
        type: "h2",
        text: "8) Payments, Refunds, and Cancellations",
      },
      {
        type: "p",
        text: "**Fees:** You agree to pay all fees specified for the Services you purchase or access.",
      },
      {
        type: "p",
        text: "**Billing:** Payments will be processed via the payment method you select. You authorize recurring charges if you subscribe.",
      },
      {
        type: "p",
        text: "**Refunds:** Refund policies vary by product and plan. See the specific product terms or the pricing page for details. Refunds are not guaranteed unless otherwise stated.",
      },
      {
        type: "p",
        text: "**Cancellations:** You may cancel a subscription at any time, subject to the terms of the plan. Access to content may continue through the end of the current billing period unless otherwise stated.",
      },
      {
        type: "h2",
        text: "9) Term and Termination",
      },
      {
        type: "p",
        text: "**Term:** These Terms apply for as long as you use STM Development Services LLC.",
      },
      {
        type: "p",
        text: "**Termination by You:** You may terminate your account by following the account settings or by contacting support, subject to any refund rules.",
      },
      {
        type: "p",
        text: "**Termination by Company:** We may suspend or terminate your access for violations of these Terms, illegal activity, non-payment, or risk to other users.",
      },
      {
        type: "h2",
        text: "10) Disclaimers",
      },
      {
        type: "p",
        text: "STM Development Services LLC and its Services are provided “as is” and “as available.” We make no representations or warranties of any kind, express or implied, about the operation of STM Development Services LLC or the information, content, materials, or products included.",
      },
      {
        type: "p",
        text: "The content is for educational and personal development purposes only. It is not a substitute for professional medical, mental health, legal, or financial advice.",
      },
      {
        type: "p",
        text: "Do not rely on STM Development Services LLC for diagnosis, treatment, or professional assessment. If you have serious mental health concerns, seek professional help.",
      },
      {
        type: "h2",
        text: "11) Limitation of Liability",
      },
      {
        type: "p",
        text: "To the maximum extent permitted by law, the Company shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or in connection with your use of STM Development Services LLC or its Services. In all events, the Company’s total liability under these Terms shall not exceed the amount paid by you for the Services in the 12 months prior to the claim.",
      },
      {
        type: "h2",
        text: "12) Indemnification",
      },
      {
        type: "p",
        text: "You agree to indemnify, defend, and hold harmless the Company, its officers, directors, employees, and affiliates from and against any claims, damages, obligations, losses, liabilities, costs, or debt, and expenses arising from your use of STM Development Services LLC or your violation of these Terms.",
      },
      {
        type: "h2",
        text: "13) Governing Law and Dispute Resolution",
      },
      {
        type: "p",
        text: "**Governing Law:** These Terms are governed by and construed in accordance with the laws of the State of Maryland, without regard to its conflict of laws principles.",
      },
      {
        type: "p",
        text: "**Binding Arbitration:** Any disputes arising out of or relating to these Terms or the Services shall be resolved by binding arbitration in Maryland, unless the parties opt for court litigation as permitted by applicable law. The arbitration rules shall be those of a mutually agreed-upon provider, or if none is chosen, the American Arbitration Association (AAA) rules.",
      },
      {
        type: "p",
        text: "**Class Actions:** You agree that you may pursue claims only on an individual basis; you shall not participate in class actions or class-wide proceedings.",
      },
      {
        type: "h2",
        text: "14) Disclaimers Regarding Health and Safety (Psychology-informed Content)",
      },
      {
        type: "p",
        text: "The content is informational and educational. It is not a substitute for psychotherapy, psychiatric care, counseling, or other professional services.",
      },
      {
        type: "p",
        text: "If you require mental health treatment or crisis support, seek qualified professionals in your jurisdiction.",
      },
      {
        type: "h2",
        text: "15) Term Changes",
      },
      {
        type: "p",
        text: "We may modify these Terms from time to time. We will provide notice of material changes, and your continued use of STM Development Services LLC after such changes constitutes acceptance of the revised Terms.",
      },
      {
        type: "h2",
        text: "16) Third-Party Services",
      },
      {
        type: "p",
        text: "STM Development Services LLC may integrate with or link to third-party services. We are not responsible for the content or practices of those third parties. Your use of third-party services is governed by their own terms.",
      },
      {
        type: "h2",
        text: "17) Notices",
      },
      {
        type: "p",
        text: "We may provide notices via email, in-app messages, or other reasonable means. It is your responsibility to keep your contact information up to date.",
      },
      {
        type: "h2",
        text: "18) Contact Information",
      },
      {
        type: "p",
        text: "Questions about these Terms should be directed to:",
      },
      {
        type: "p",
        text: "**STM Development Services LLC** \nEmail: **info@sibelmcginnis.com**\nAddress: **Maryland, USA** \nWebsite: **sibelmcginnis.com**",
      },
    ],
  },
  {
    slug: "privacy",
    label: "Privacy Policy",
    title: "General Data Protection Regulation (GDPR) Privacy Policy",
    blocks: [
      {
        type: "p",
        text: "**Last Updated:** January 1, 2026\n**Business Name:** STM Development Services LLC\n**Contact Email: info@sibelmcginnis.com**",
      },
      {
        type: "p",
        text: "STM Development Services LLC (“we,” “us,” or “our”) functions internationally and is committed to protecting your privacy and complying with global data-protection laws, including the **EU General Data Protection Regulation (GDPR)**, the **UK GDPR**, and applicable privacy laws in other regions.",
      },
      {
        type: "p",
        text: "This Privacy Policy explains how we collect, use, share, and safeguard personal data when you interact with our websites, services, coaching programs, memberships, networking events, and digital platforms. By using our services, you acknowledge that you have read and understood this Privacy Policy.",
      },
      {
        type: "h2",
        text: "1. Data Controller Information",
      },
      {
        type: "p",
        text: "Under the GDPR, the **data controller** for your personal information is:",
      },
      {
        type: "p",
        text: "**STM Development Services \nAddress:** Maryland, USA\n**Email: info@sibelmcginnis.com**",
      },
      {
        type: "p",
        text: "If we work with third-party processors (e.g., payment processors, email platforms), they act as **data processors** on our behalf and comply with GDPR requirements.",
      },
      {
        type: "h2",
        text: "2. Types of Personal Data We Collect",
      },
      {
        type: "h3",
        text: "2.1 Personal Identification Data",
      },
      {
        type: "ul",
        items: [
          "Name",
          "Email address",
          "Phone number",
          "Demographic information (e.g., country, city)",
          "Photo, biography, and social links (only when voluntarily provided)",
        ],
      },
      {
        type: "h3",
        text: "2.2 Payment & Transaction Data",
      },
      {
        type: "ul",
        items: [
          "Billing Zip",
          "Transaction record",
          "Last four digits of credit card information (processed securely via third-party processors)",
        ],
      },
      {
        type: "h3",
        text: "2.3 Automatically Collected Data",
      },
      {
        type: "ul",
        items: [
          "IP address",
          "Browser type and device information",
          "Cookies, tracking technologies, usage statistics",
        ],
      },
      {
        type: "h3",
        text: "2.4 Special Category Data (GDPR)",
      },
      {
        type: "p",
        text: "We do **not intentionally** collect sensitive data under Article 9 (e.g., ethnic origin, political opinions, or health data).\nIf such information is voluntarily disclosed during coaching or community interactions, we will treat it confidentially and never use it for automated profiling or marketing.",
      },
      {
        type: "h2",
        text: "3. Legal Bases for Processing Personal Data (GDPR Article 6)",
      },
      {
        type: "p",
        text: "We process personal data only when we have a lawful basis:",
      },
      {
        type: "h3",
        text: "3.1 Consent (Art. 6(1)(a))",
      },
      {
        type: "p",
        text: "For:",
      },
      {
        type: "ul",
        items: [
          "Newsletters and marketing",
          "Community directory listings",
          "Voluntary user-submitted information",
        ],
      },
      {
        type: "p",
        text: "You may withdraw consent at any time.",
      },
      {
        type: "h3",
        text: "3.2 Contractual Necessity (Art. 6(1)(b))",
      },
      {
        type: "p",
        text: "To:",
      },
      {
        type: "ul",
        items: [
          "Provide coaching programs",
          "Manage event registrations",
          "Process payments",
          "Deliver purchased services",
        ],
      },
      {
        type: "h3",
        text: "3.3 Legitimate Interests (Art. 6(1)(f))",
      },
      {
        type: "p",
        text: "For:",
      },
      {
        type: "ul",
        items: [
          "Improving services",
          "Ensuring network security",
          "Preventing fraud",
          "Community engagement (where privacy risks are minimal)",
        ],
      },
      {
        type: "h3",
        text: "3.4 Legal Obligations (Art. 6(1)(c))",
      },
      {
        type: "p",
        text: "For:",
      },
      {
        type: "ul",
        items: ["Tax and accounting compliance", "Recordkeeping requirements"],
      },
      {
        type: "h2",
        text: "4. How We Use Your Information",
      },
      {
        type: "p",
        text: "We may use your information to:",
      },
      {
        type: "ul",
        items: [
          "Provide and manage training programs, coaching, and networking communities",
          "Register yourself for community meetings, events, workshops, and courses",
          "Communicate updates, service announcements, and marketing (with consent)",
          "Improve user experience based on analytics",
          "Manage your account and preferences",
          "Comply with legal requirements",
        ],
      },
      {
        type: "p",
        text: "We do **not** perform automated decision-making or profiling that produces legal or significant effects under GDPR Article 22.",
      },
      {
        type: "h2",
        text: "5. How We Share Your Data",
      },
      {
        type: "p",
        text: "We will **never sell** your personal data.",
      },
      {
        type: "p",
        text: "We may share your data with:",
      },
      {
        type: "h3",
        text: "5.1 Service Providers (Processors)",
      },
      {
        type: "p",
        text: "Including:",
      },
      {
        type: "ul",
        items: [
          "Payment processors",
          "Email and marketing platforms",
          "Customer support tools",
          "Data-storage providers",
        ],
      },
      {
        type: "p",
        text: "All processors are contractually obligated to maintain GDPR-level security.",
      },
      {
        type: "h3",
        text: "5.2 Networking & Community Groups (Optional)",
      },
      {
        type: "p",
        text: "If you voluntarily join member communities, directories, or forums, your information may be visible to other members. This is always **opt-in**.",
      },
      {
        type: "h3",
        text: "5.3 Legal or Safety Requirements",
      },
      {
        type: "p",
        text: "We may disclose information where required by:",
      },
      {
        type: "ul",
        items: [
          "Court orders",
          "Government authorities",
          "Fraud prevention or security investigations",
        ],
      },
      {
        type: "h2",
        text: "6. International Data Transfers (GDPR Chapter V)",
      },
      {
        type: "p",
        text: "Because we operate globally, your data may be transferred outside your home country.",
      },
      {
        type: "p",
        text: "When transferring data outside the EEA/UK, we use approved safeguards:",
      },
      {
        type: "ul",
        items: [
          "**Standard Contractual Clauses (SCCs)**",
          "UK International Data Transfer Addendum (IDTA)",
          "GDPR-compliant processors certified under relevant frameworks",
          "Supplemental security measures (e.g., encryption)",
        ],
      },
      {
        type: "p",
        text: "You may request a copy of applicable safeguards by contacting us.",
      },
      {
        type: "h2",
        text: "7. Data Retention",
      },
      {
        type: "p",
        text: "We retain your information only as long as necessary to:",
      },
      {
        type: "ul",
        items: [
          "Provide our services",
          "Fulfill contractual obligations",
          "Comply with legal, accounting, or reporting requirements",
        ],
      },
      {
        type: "p",
        text: "You may request deletion earlier (see Rights below).",
      },
      {
        type: "h2",
        text: "8. Your GDPR Rights",
      },
      {
        type: "p",
        text: "If you are located in the EU or UK, you have the following rights:",
      },
      {
        type: "h3",
        text: "8.1 Right to Access (Art. 15)",
      },
      {
        type: "p",
        text: "Request a copy of your personal data.",
      },
      {
        type: "h3",
        text: "8.2 Right to Rectification (Art. 16)",
      },
      {
        type: "p",
        text: "Correct inaccurate or incomplete data.",
      },
      {
        type: "h3",
        text: "8.3 Right to Erasure (Art. 17)",
      },
      {
        type: "p",
        text: "Request deletion (“right to be forgotten”).",
      },
      {
        type: "h3",
        text: "8.4 Right to Restrict Processing (Art. 18)",
      },
      {
        type: "p",
        text: "Limit how your data is used.",
      },
      {
        type: "h3",
        text: "8.5 Right to Data Portability (Art. 20)",
      },
      {
        type: "p",
        text: "Receive your data in a structured, machine-readable format.",
      },
      {
        type: "h3",
        text: "8.6 Right to Object (Art. 21)",
      },
      {
        type: "p",
        text: "Object to processing based on legitimate interests or direct marketing.",
      },
      {
        type: "h3",
        text: "8.7 Right to Withdraw Consent",
      },
      {
        type: "p",
        text: "At any time, without affecting prior lawful processing.",
      },
      {
        type: "h3",
        text: "8.8 Right to Lodge a Complaint",
      },
      {
        type: "p",
        text: "With your local supervisory authority (e.g., ICO, CNIL, DPA).",
      },
      {
        type: "p",
        text: "To exercise rights, contact us at: **info@sibelmcginnis.com**",
      },
      {
        type: "h2",
        text: "9. Cookies and Tracking Technologies",
      },
      {
        type: "p",
        text: "We use cookies for:",
      },
      {
        type: "ul",
        items: [
          "Site functionality",
          "User preferences",
          "Analytics",
          "Marketing (only with consent where legally required)",
        ],
      },
      {
        type: "p",
        text: "You may manage cookies using your browser settings. A detailed Cookie Policy can be provided separately.",
      },
      {
        type: "h2",
        text: "10. Data Security",
      },
      {
        type: "p",
        text: "We use a combination of organizational and technical measures:",
      },
      {
        type: "ul",
        items: [
          "Encrypted connections (HTTPS/SSL)",
          "Access controls and authentication",
          "Encrypted payment processing",
          "Regular security reviews",
          "Staff training in data protection",
        ],
      },
      {
        type: "p",
        text: "However, no system is 100% secure, and we advise users to protect their credentials.",
      },
      {
        type: "h2",
        text: "11. Children’s Privacy",
      },
      {
        type: "p",
        text: "Our services are intended for individuals aged **18 and over**.\nWe do not knowingly collect data from children.\nIf you believe a minor has submitted information, please contact us to have it removed.",
      },
      {
        type: "h2",
        text: "12. Changes to This Policy",
      },
      {
        type: "p",
        text: "We may update this Privacy Policy from time to time.\nChanges take effect upon posting the revised version on our website.\nWhere required by law, we will notify users of significant updates.",
      },
      {
        type: "h2",
        text: "13. Contact Information",
      },
      {
        type: "p",
        text: "If you have any questions about our Privacy Policy, please contact us at:",
      },
      {
        type: "p",
        text: "**STM Development Services LLC** \nEmail: **info@sibelmcginnis.com**\nAddress: **Maryland, USA** \nWebsite: **sibelmcginnis.com**",
      },
    ],
  },
  {
    slug: "disclaimer",
    label: "Content Disclaimer",
    title: "Psychology-Informed Content Disclaimer",
    blocks: [
      {
        type: "p",
        text: "**For STM Development Services LLC,\nMaryland, USA\nLast Updated:** January 1, 2026",
      },
      {
        type: "p",
        text: "**Contact Email: info@sibelmcginnis.com**",
      },
      {
        type: "p",
        text: "The information provided by **STM Development Services LLC,** a Maryland-owned business, is intended for educational, personal-development, and informational purposes only. While our content may be psychology-informed and draw on evidence-based principles in mindset, motivation, behavioral science, emotional well-being, communication, and personal growth, **we do not provide clinical, medical, or mental health services**.",
      },
      {
        type: "p",
        text: "By accessing our community meetings, programs, content, coaching, events, or online platforms, you acknowledge and agree to the following:",
      },
      {
        type: "h2",
        text: "1. No Professional Medical or Mental-Health Services",
      },
      {
        type: "ul",
        items: [
          "We are **not** a medical provider, psychotherapist, psychologist, psychiatrist, licensed clinical professional counselor, social worker, or any other regulated mental-health practitioner.",
          "Our services do **not** include diagnosis, treatment, therapy, crisis intervention, or medical advice under Maryland law or the laws of any other jurisdiction.",
          "Nothing shared should be interpreted as clinical recommendations, therapeutic guidance, or a substitute for professional mental-health care.",
        ],
      },
      {
        type: "h2",
        text: "2. No Therapist–Client Relationship",
      },
      {
        type: "p",
        text: "Participation in our community meetings, programs, coaching, community groups, workshops, or online discussions **does not** create a therapist-client, counselor-client, or doctor-patient relationship.",
      },
      {
        type: "p",
        text: "Engagement with our content is voluntary and for personal development only.",
      },
      {
        type: "h2",
        text: "3. Not a Substitute for Mental-Health or Medical Care",
      },
      {
        type: "p",
        text: "If you have questions about your mental health, emotional well-being, medical conditions, or any psychological concerns, you should consult:",
      },
      {
        type: "ul",
        items: [
          "A licensed mental-health professional",
          "A physician",
          "A qualified medical provider in your country or region",
        ],
      },
      {
        type: "p",
        text: "If you are in crisis or in danger, contact local emergency services or a crisis hotline immediately.",
      },
      {
        type: "h2",
        text: "4. International Considerations",
      },
      {
        type: "p",
        text: "Our audience is global. Laws and professional regulations regarding mental-health support vary by country.\nBy using our services, you acknowledge that:",
      },
      {
        type: "ul",
        items: [
          "Our psychology-informed content is for **general personal development**, not for regulated therapy.",
          "We do not operate under the mental-health licensing laws of your country or region.",
          "We cannot ensure compliance with international therapeutic, counseling, or clinical regulations because we **do not** offer those services.",
        ],
      },
      {
        type: "h2",
        text: "5. No Guarantees of Outcomes",
      },
      {
        type: "p",
        text: "Personal development results vary and depend on individual circumstances, effort, and external factors.\nWe make **no guarantees** regarding:",
      },
      {
        type: "ul",
        items: [
          "Emotional outcomes",
          "Behavioral changes",
          "Professional transformation",
          "Relationship improvements",
          "Mental-health results",
        ],
      },
      {
        type: "p",
        text: "All decisions and actions you take based on our content are your full responsibility.",
      },
      {
        type: "h2",
        text: "6. Personal Responsibility",
      },
      {
        type: "p",
        text: "By participating, you agree to:",
      },
      {
        type: "ul",
        items: [
          "Use your own judgment regarding any content, strategies, or exercises",
          "Seek licensed professional support when needed",
          "Assume full responsibility for your choices, behaviors, and results",
          "Acknowledge that any psychological concepts discussed are for educational purposes only",
        ],
      },
      {
        type: "h2",
        text: "7. Not for Use in Crisis Situations",
      },
      {
        type: "p",
        text: "Our business is **not equipped** to respond to emergencies, crises, acute mental-health episodes, or immediate emotional distress.\nIf you are experiencing:",
      },
      {
        type: "ul",
        items: [
          "Thoughts of self-harm",
          "Panic, trauma, or acute distress",
          "Medical or psychological emergencies",
        ],
      },
      {
        type: "p",
        text: "Contact local emergency services or a crisis hotline right away.",
      },
      {
        type: "h2",
        text: "8. Limit of Liability",
      },
      {
        type: "p",
        text: "To the fullest extent permitted by Maryland law, as well as the laws governing your country of residence, STM Development Services LLC and its affiliates are **not liable** for:",
      },
      {
        type: "ul",
        items: [
          "Any damages arising from your reliance on our content",
          "Any decisions made based on psychology-informed information",
          "Any emotional distress, loss, or outcomes related to your use of our services",
        ],
      },
      {
        type: "p",
        text: "Your use of our content is voluntary and at your own risk.",
      },
      {
        type: "h2",
        text: "9. Updates to This Disclaimer",
      },
      {
        type: "p",
        text: "We may amend this disclaimer periodically. Updated versions will be posted on our website or platforms. Continued use constitutes acceptance of any changes.",
      },
      {
        type: "h2",
        text: "10. Contact Information",
      },
      {
        type: "p",
        text: "For questions related to the Psychology-Informed Content Disclaimer, contact:",
      },
      {
        type: "h2",
        text: "11. Contact Information",
      },
      {
        type: "p",
        text: "If you have any questions about our Psychology-Informed Content Disclaimer, please contact us at:",
      },
      {
        type: "p",
        text: "**STM Development Services LLC** \nEmail: **info@sibelmcginnis.com**\nAddress: **Maryland, USA** \nWebsite: **sibelmcginnis.com**",
      },
    ],
  },
  {
    slug: "content-licensing",
    label: "Content & Licensing",
    title: "Content Ownership & Licensing Policy",
    blocks: [
      {
        type: "p",
        text: "**For STM Development Services LLC**",
      },
      {
        type: "p",
        text: "Maryland, USA",
      },
      {
        type: "p",
        text: "**Last Updated:** January 1, 2026",
      },
      {
        type: "p",
        text: "This Content Ownership & Licensing Policy explains how intellectual property (“Content”) shared by **STM** **Development Services LLC** is protected, and how it may be used, and how user-generated content is handled across our global platforms. \nBy accessing our website, community meetings, programs, events, coaching, and digital communities, you agree to the terms below.",
      },
      {
        type: "h2",
        text: "1. Definitions",
      },
      {
        type: "p",
        text: "For clarity:",
      },
      {
        type: "ul",
        items: [
          "**“Content”** refers to all materials created or distributed by **STM Development Services LLC** and its licensors (including owner(s), employees and contractors) including but not limited to: written materials, coaching tools, worksheets, videos, audio recordings, graphics, branding, digital products, slides, training materials, guides, templates, community posts, and any psychology-informed concepts created by us.",
          "**“User-Generated Content (UGC)”** refers to anything created and posted by members, such as comments, photos, messages, feedback, shared stories, or uploads.",
        ],
      },
      {
        type: "h2",
        text: "2. Ownership of Business Content",
      },
      {
        type: "p",
        text: "All Content provided by **STM Development Services, LLC** is the exclusive property of the business or its licensors.",
      },
      {
        type: "p",
        text: "This includes, but is not limited to:",
      },
      {
        type: "ul",
        items: [
          "Course materials",
          "Meeting, Program, and Event Content",
          "Coaching tools, workbooks, and frameworks",
          "Networking or leadership development resources",
          "Videos, recordings, and curriculum",
          "Logos, branding, designs, and website copy",
          "Any psychology-informed or personal-development methods created by us",
        ],
      },
      {
        type: "p",
        text: "All rights are reserved under:",
      },
      {
        type: "ul",
        items: [
          "U.S. Copyright Law",
          "Maryland state law",
          "International intellectual property treaties",
        ],
      },
      {
        type: "p",
        text: "Unless explicitly stated otherwise in writing, no rights are granted to you beyond the limited license described below.",
      },
      {
        type: "h2",
        text: "3. Licensing to Users (What You Can Do)",
      },
      {
        type: "p",
        text: "We grant you a **personal, non-exclusive, non-transferable, revocable license** to use our Content **solely for your own personal learning and development**.",
      },
      {
        type: "p",
        text: "This license allows you to:",
      },
      {
        type: "ul",
        items: [
          "View, download (when permitted), and use content privately",
          "Apply exercises and tools in your own personal growth",
          "Use materials for your own networking and professional development",
        ],
      },
      {
        type: "p",
        text: "This license **does not** permit duplication, resale, or external distribution.",
      },
      {
        type: "h2",
        text: "4. Prohibited Uses of Our Content (What You Cannot Do)",
      },
      {
        type: "p",
        text: "You may **not**:",
      },
      {
        type: "ul",
        items: [
          "Copy, reproduce, or republish our Content",
          "Share or distribute our Content to others (paid or unpaid)",
          "Upload or post our materials to external sites",
          "Sell or commercially exploit our Content",
          "Claim our Content as your own",
          "Create derivative works based on our Content",
          "Use our psychology-informed content to train others, coach others, or teach programs without our written authorization",
          "Use our trademarks, logos, or branding without permission",
        ],
      },
      {
        type: "p",
        text: "Unauthorized use violates U.S. and international intellectual property laws.",
      },
      {
        type: "h2",
        text: "5. Community meetings, Group Programs, Workshops & Coaching Sessions",
      },
      {
        type: "p",
        text: "All recordings, transcripts, chat logs (except private chats between users), workbooks, teaching materials, and psychological frameworks remain the sole property of **STM Development Services LLC**.",
      },
      {
        type: "p",
        text: "Participants may not:",
      },
      {
        type: "ul",
        items: [
          "Record sessions",
          "Share screenshots",
          "Distribute copies of materials",
          "Upload recordings to any platform unless express written permission is granted.",
        ],
      },
      {
        type: "h2",
        text: "6. User-Generated Content (UGC)",
      },
      {
        type: "p",
        text: "You retain intellectual property rights to the content you create (your posts, comments, personal stories, etc.).",
      },
      {
        type: "p",
        text: "However, by posting UGC within our community or platforms, you grant **STM Development Services** **LLC** has a **worldwide, non-exclusive, royalty-free license** to:",
      },
      {
        type: "ul",
        items: [
          "Display, host, and store your content",
          "Share your content with other members within the community",
          "Use your content for community-support purposes",
        ],
      },
      {
        type: "p",
        text: "We will **never** sell your UGC or use it publicly without your explicit consent.",
      },
      {
        type: "p",
        text: "You are responsible for ensuring your UGC:",
      },
      {
        type: "ul",
        items: [
          "Is original to you",
          "Does not violate others’ rights",
          "Does not contain confidential information about third parties",
          "Complies with our Code of Conduct",
        ],
      },
      {
        type: "p",
        text: "We may remove UGC that violates policies, laws, or community standards.",
      },
      {
        type: "h2",
        text: "7. Confidentiality & Private Spaces",
      },
      {
        type: "p",
        text: "Some areas—such as community meetings, coaching cohorts, mastermind groups, or community circles—require confidentiality.",
      },
      {
        type: "p",
        text: "Users may not:",
      },
      {
        type: "ul",
        items: [
          "Share others’ stories or personal information",
          "Copy or distribute content shared by fellow members",
          "Reproduce any materials from confidential spaces",
        ],
      },
      {
        type: "p",
        text: "Violations may result in suspension or permanent removal.",
      },
      {
        type: "h2",
        text: "8. International Use & Enforcement",
      },
      {
        type: "p",
        text: "Because our audience is global:",
      },
      {
        type: "ul",
        items: [
          "Your access to our Content does not grant international usage rights beyond personal use.",
          "Redistribution across countries is prohibited.",
          "U.S., Maryland, and international intellectual property laws apply regardless of your location.",
        ],
      },
      {
        type: "p",
        text: "We reserve the right to pursue legal action internationally for infringement, including DMCA (the Digital Millennium Copyright Act) removal, cease-and-desist orders, and claims for damages.",
      },
      {
        type: "h2",
        text: "9. Content Licensing Requests",
      },
      {
        type: "p",
        text: "If you wish to:",
      },
      {
        type: "ul",
        items: [
          "Use our materials for professional purposes",
          "Teach or deliver workshops using our content",
          "License our psychology-informed frameworks",
          "Reproduce or adapt our tools or resources",
        ],
      },
      {
        type: "p",
        text: "You must obtain **written permission** from **STM Development Services LLC.**",
      },
      {
        type: "p",
        text: "Please email:",
      },
      {
        type: "p",
        text: "**info@sibelmcginnis.com**",
      },
      {
        type: "p",
        text: "Requests are evaluated on a case-by-case basis.",
      },
      {
        type: "h2",
        text: "10. Revocation of License",
      },
      {
        type: "p",
        text: "We may suspend, restrict, or revoke your license to use any of our content if:",
      },
      {
        type: "ul",
        items: [
          "You violate this Content Ownership & Licensing Policy",
          "You violate our Code of Conduct",
          "You misuse or improperly share our intellectual property",
          "Your membership or participation ends",
        ],
      },
      {
        type: "p",
        text: "Upon revocation, you must delete all downloaded or saved materials.",
      },
      {
        type: "h2",
        text: "11. Updates to This Policy",
      },
      {
        type: "p",
        text: "We may update this Content Ownership & Licensing Policy as needed. Updated versions will be posted on our website. Continued use of our services indicates acceptance of any revisions.",
      },
      {
        type: "h2",
        text: "12. Contact Information",
      },
      {
        type: "p",
        text: "If you have any questions regarding our Content Ownership and Licensing policy, please contact us at:",
      },
      {
        type: "p",
        text: "**STM Development Services LLC** \nEmail: **info@sibelmcginnis.com**\nAddress: **Maryland, USA** \nWebsite: **sibelmcginnis.com**",
      },
    ],
  },
  {
    slug: "code-of-conduct",
    label: "Code of Conduct",
    title: "Code of Conduct",
    blocks: [
      {
        type: "p",
        text: "For services and products such as weekly community meetings, online and in-person events, workshops, and courses that are provided by **STM Development Services LLC**.",
      },
      {
        type: "p",
        text: "**Last Updated:** January 1, 2026",
      },
      {
        type: "p",
        text: "**STM Development Services LLC** is committed to creating a safe, respectful, empowering, and inclusive global community for women to connect, learn, and grow. This Code of Conduct outlines the expectations for all members, participants, clients, event attendees, online community users (“members”), and guest speakers when engaging with our platforms and services.",
      },
      {
        type: "p",
        text: "By participating in our community meetings, programs, events, or digital spaces, you agree to follow the guidelines below.",
      },
      {
        type: "h2",
        text: "1. Our Core Values",
      },
      {
        type: "p",
        text: "Our community is built on fostering meaningful conversations, raising awareness, and uplifting one another as we grow both individually and collectively. Our core values are",
      },
      {
        type: "ul",
        items: [
          "**Respect** – We honor individuals’ experiences, perspectives, and identity.",
          "**Integrity** – We communicate honestly and act ethically.",
          "**Empowerment** – We support each other’s growth and success.",
          "**Inclusivity** – We welcome women from all cultures, backgrounds, and professions.",
          "**Confidentiality** – We protect the privacy of shared stories and discussions, as well as personal information.",
        ],
      },
      {
        type: "p",
        text: "We kindly ask all members to contribute to a positive atmosphere by engaging thoughtfully and courteously, helping us create a space where everyone can thrive.",
      },
      {
        type: "h2",
        text: "2. Expected Behavior",
      },
      {
        type: "p",
        text: "Members must:",
      },
      {
        type: "h3",
        text: "Act Respectfully",
      },
      {
        type: "ul",
        items: [
          "Treat all participants with kindness, courtesy, and professionalism.",
          "Value diverse backgrounds, viewpoints, and experiences.",
          "Use constructive, non-judgmental language.",
        ],
      },
      {
        type: "h3",
        text: "Protect Confidentiality",
      },
      {
        type: "ul",
        items: [
          "Keep all private or sensitive information shared within programs strictly confidential.",
          "Do not record or share screenshots of community interactions and meetings without explicit permission.",
        ],
      },
      {
        type: "h3",
        text: "Engage Positively",
      },
      {
        type: "ul",
        items: [
          "Contribute to discussions in a supportive and uplifting manner.",
          "Ask thoughtful questions and offer encouragement.",
          "Give feedback respectfully and only when appropriate.",
        ],
      },
      {
        type: "h3",
        text: "Use the Community Responsibly",
      },
      {
        type: "ul",
        items: [
          "Participate authentically and be honest in your communications.",
          "Ensure your posts, comments, and messages align with the community's mission and goals.",
        ],
      },
      {
        type: "h2",
        text: "3. Prohibited Behavior",
      },
      {
        type: "p",
        text: "The following actions are not allowed:",
      },
      {
        type: "h3",
        text: "Harassment, Bullying, or Abuse",
      },
      {
        type: "p",
        text: "Including but not limited to:",
      },
      {
        type: "ul",
        items: [
          "Verbal, written, or visual intimidation",
          "Demeaning language",
          "Unwanted personal advances",
          "Threatening or hostile behavior",
        ],
      },
      {
        type: "h3",
        text: "Discrimination",
      },
      {
        type: "p",
        text: "No member may engage in discrimination based on nationality, culture, age, ability, religion, or personal background.",
      },
      {
        type: "h3",
        text: "Sharing Another Person’s Information",
      },
      {
        type: "ul",
        items: [
          "No doxxing (publicly revealing private or sensitive information about an individual or organization without their consent and with malicious intent)",
          "No posting private conversations without consent",
          "No unauthorized sharing of photos, videos, or personal details",
        ],
      },
      {
        type: "h3",
        text: "Aggressive Self-Promotion or Spam",
      },
      {
        type: "ul",
        items: [
          "Unsolicited sales communications",
          "Repetitive advertising",
          "Posting promotional content in non-designated spaces",
        ],
      },
      {
        type: "h3",
        text: "Disruptive or Inappropriate Conduct",
      },
      {
        type: "ul",
        items: [
          "Derailing discussions",
          "Posting offensive content",
          "Using the platform for non-community-aligned purposes",
        ],
      },
      {
        type: "h3",
        text: "Illegal or Unethical Activity",
      },
      {
        type: "ul",
        items: [
          "Fraud, impersonation, or misrepresentation",
          "Encouraging harmful or unlawful behavior",
        ],
      },
      {
        type: "h2",
        text: "4. Responsibilities of Coaches, Hosts, and Facilitators",
      },
      {
        type: "p",
        text: "Leaders within the community will:",
      },
      {
        type: "ul",
        items: [
          "Model respectful and inclusive behavior",
          "Set clear expectations during meetings, workshops and events",
          "Enforce the Code of Conduct fairly",
          "Provide support to members who need assistance",
          "Take necessary actions in response to violations",
        ],
      },
      {
        type: "h2",
        text: "5. Reporting Concerns",
      },
      {
        type: "p",
        text: "If you experience or witness a violation of this Code of Conduct, please contact us immediately at: **info@sibelmcginnis.com** **Reports will be handled:**",
      },
      {
        type: "ul",
        items: ["Promptly", "Confidentially", "Respectfully"],
      },
      {
        type: "p",
        text: "We take all concerns seriously and aim to resolve issues fairly and with discretion.",
      },
      {
        type: "h2",
        text: "6. Consequences of Violations",
      },
      {
        type: "p",
        text: "Depending on the severity and frequency of a violation, actions may include:",
      },
      {
        type: "ul",
        items: [
          "Warning or private conversation",
          "Removal of content",
          "Temporary suspension from meetings, groups or programs",
          "Permanent removal from the community",
          "Termination of membership or services",
          "Notification to authorities (in cases involving threats, harassment, or illegal conduct)",
        ],
      },
      {
        type: "p",
        text: "We reserve the right to take any action necessary to maintain a safe and respectful environment.",
      },
      {
        type: "h2",
        text: "7. Digital Etiquette & Online Behavior",
      },
      {
        type: "p",
        text: "To foster a positive online space:",
      },
      {
        type: "ul",
        items: [
          "Be mindful of tone in written messages",
          "Avoid assumptions—ask clarifying questions",
          "Refrain from interrupting during virtual meetings",
          "Mute yourself when not speaking",
          "Be presentable while on camera (e.g., not eating or doing other activities)",
          "Respect time zones and global diversity",
          "Always acknowledge sources and appropriately credit contributions",
        ],
      },
      {
        type: "h2",
        text: "8. Intellectual Property",
      },
      {
        type: "p",
        text: "All content shared by facilitators, coaches, trainers, guest speakers, or other members—including worksheets, presentations, recordings, and written materials—remains the property of its creator. Members may not:",
      },
      {
        type: "ul",
        items: ["Copy", "Reproduce", "Share", "Sell", "Modify"],
      },
      {
        type: "p",
        text: "any content without permission.",
      },
      {
        type: "h2",
        text: "9. Amendments",
      },
      {
        type: "p",
        text: "We may update this Code of Conduct from time to time. Continued participation after changes constitutes acceptance of the updated terms.",
      },
      {
        type: "h2",
        text: "10. Commitment to a Supportive Global Community",
      },
      {
        type: "p",
        text: "Our mission is to create a safe, inspiring, and empowering environment where women from all backgrounds can grow personally and professionally. Your commitment to this Code of Conduct ensures that our global community remains a place of trust, respect, and encouragement.",
      },
      {
        type: "h2",
        text: "11. Contact Information",
      },
      {
        type: "p",
        text: "If you have any questions regarding our Code of Conduct Policy, please contact us at:",
      },
      {
        type: "p",
        text: "**STM Development Services LLC** \nEmail: **info@sibelmcginnis.com**\nAddress: **Maryland, USA** \nWebsite: **sibelmcginnis.com**",
      },
    ],
  },
];
