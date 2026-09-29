// Role-based tracks for higher-risk staff. Assigned in program months 3 and 9
// to people tagged with the track. Available on Professional and Premium plans.

export const ROLE_TRACKS = [
  {
    code: 'ROLE-LEAD',
    track: 'leadership',
    title: 'Leadership: cyber risk is business risk',
    summary: 'For owners and managers: insurance requirements, incident decisions, executive impersonation and setting the tone.',
    duration_min: 20,
    lessons: [
      { title: 'Cyber risk on the risk register', body: `A serious incident can stop operations, trigger legal duties and damage client relationships. Treat it like any other business risk: know your most critical systems and data, who owns them, and how long you could operate without them.

Questions leaders should be able to answer:
- Which three systems would stop the business if they went down?
- When were backups last restored in a test?
- Who do we call first in an incident, and is their number written down offline?` },
      { title: 'Cyber insurance and required controls', body: `Insurers increasingly require MFA, tested backups, endpoint protection and security awareness training, and they ask about them on applications. Answering "yes" when a control is not really in place can put a claim at risk. Keep this program's reports as evidence of training and phishing testing.` },
      { title: 'Incident decisions', body: `In a ransomware or data breach, leaders decide quickly on: isolating systems, engaging the insurer's response team, legal counsel, law enforcement, notifying clients or regulators, and whether any ransom is even considered. Decide the process now, not during the crisis. An annual tabletop exercise is the best practice run.` },
      { title: 'You are the most impersonated person in the company', body: `Attackers impersonate owners and executives to request payments and data, including with cloned voices and deepfake video. Protect your team: tell them you will never ask for gift cards or secret urgent payments, and thank people publicly when they verify a request from you.` },
    ],
    quiz: [
      { id: 'q1', q: 'An insurance application asks if MFA is enforced on all email accounts, but three accounts are exempt. What should you do?', options: ['Answer yes; it is mostly true', 'Answer accurately and fix the gap', 'Skip the question', 'Ask the broker to answer'], answer: 1, explain: 'Inaccurate answers can put a claim at risk.' },
      { id: 'q2', q: 'When should the incident response process be decided?', options: ['During the incident', 'After the insurer calls', 'In advance, and practised in a tabletop exercise', 'Only after a first breach'], answer: 2, explain: 'Pre-agreed decisions save critical hours.' },
      { id: 'q3', q: 'What simple message from leaders most reduces CEO-fraud risk?', options: ['"Always do what I say quickly"', '"I will never ask for gift cards or secret urgent payments, and I want you to verify"', '"Only email me for payments"', '"Use your judgement"'], answer: 1, explain: 'Permission to verify removes the pressure attackers rely on.' },
      { id: 'q4', q: 'Which question shows backups are really working?', options: ['Do we pay for backup software?', 'When did we last restore data from backup in a test?', 'Are backups stored on the same server?', 'How big is the backup drive?'], answer: 1, explain: 'Only a test restore proves recovery works.' },
      { id: 'q5', q: 'Why keep the incident contact list offline as well?', options: ['It looks more official', 'Systems and email may be unavailable during an attack', 'It is required by law everywhere', 'It saves ink'], answer: 1, explain: 'Ransomware can take down email and file servers.' },
    ],
  },
  {
    code: 'ROLE-IT',
    track: 'it',
    title: 'IT and system administrators',
    summary: 'Privileged account hygiene, MFA and access reviews, patching, backup testing and handling user reports.',
    duration_min: 25,
    lessons: [
      { title: 'Privileged accounts', body: `- Use a separate admin account for admin tasks, never for email or browsing
- Enforce phishing-resistant MFA (security keys or passkeys) on all admin and remote access
- Remove shared admin passwords; store break-glass credentials in a vault
- Review who has admin rights every quarter and remove what is not needed` },
      { title: 'Patching, configuration and remote access', body: `Prioritise internet-facing systems (VPNs, firewalls, remote desktop, email) and known exploited vulnerabilities. Disable remote desktop exposed to the internet. Apply secure baselines, disable legacy authentication, and turn on logging that you actually review.` },
      { title: 'Backups you can trust', body: `Follow 3-2-1: three copies, two media types, one offline or immutable. Protect backup consoles with separate credentials and MFA, because attackers target backups first. Test a restore every quarter and record the result.` },
      { title: 'Handling user reports', body: `Every report deserves a fast, friendly response. Thank the reporter, triage quickly, pull matching emails from other mailboxes, block senders and URLs, and reset credentials plus revoke sessions if a password was entered. Close the loop so staff see that reporting works.` },
    ],
    quiz: [
      { id: 'q1', q: 'Which practice best protects admin accounts?', options: ['One shared admin password for the team', 'Separate admin accounts with phishing-resistant MFA', 'Admin rights for all staff to reduce tickets', 'Using the admin account for email'], answer: 1, explain: 'Separation and strong MFA limit the damage from phishing.' },
      { id: 'q2', q: 'Which systems should be patched first?', options: ['Internet-facing systems and known exploited vulnerabilities', 'Printers in storage', 'Screensavers', 'Test machines'], answer: 0, explain: 'Exposed systems with known exploits are attacked first.' },
      { id: 'q3', q: 'Why protect the backup console with separate credentials?', options: ['Backups are slow', 'Attackers try to delete backups before deploying ransomware', 'It is cheaper', 'Users need access to it'], answer: 1, explain: 'Destroying backups forces victims to pay.' },
      { id: 'q4', q: 'A user entered their password on a phishing page. Besides resetting the password, what should you do?', options: ['Nothing else', 'Revoke active sessions and check for new mailbox rules', 'Disable their monitor', 'Delete the user'], answer: 1, explain: 'Attackers keep access through sessions and forwarding rules.' },
      { id: 'q5', q: 'How often should backup restores be tested?', options: ['Never; backups always work', 'At least quarterly, with results recorded', 'Only after an incident', 'Every five years'], answer: 1, explain: 'Regular tests catch silent backup failures.' },
    ],
  },
  {
    code: 'ROLE-FIN',
    track: 'finance',
    title: 'Finance and accounting: stopping payment fraud',
    summary: 'Invoice and bank-change fraud, dual approval and call-back verification, payroll diversion and tax scams.',
    duration_min: 20,
    lessons: [
      { title: 'Why finance is targeted', body: `Finance staff can move money, so they receive the most convincing scams: supplier invoices with changed bank details, executive payment requests, payroll changes and tax-season requests for W-2 or employee data.` },
      { title: 'The controls that work', body: `- **Call-back verification** on a number from the vendor master file for every new payee or bank change
- **Dual approval** for new payees, changed details and payments over a set threshold
- **Hold period:** no payment to changed details for 48 hours after verification
- **Record keeping:** log who verified, how and when` },
      { title: 'If money has already gone', body: `Speed matters. Call your bank's fraud line immediately to request a recall, report to leadership and IT, and file a report with the relevant authority (in the US, the FBI's IC3). Banks can sometimes freeze funds if contacted within hours.` },
    ],
    quiz: [
      { id: 'q1', q: 'Which control most reliably stops bank-detail change fraud?', options: ['Replying to the email to confirm', 'Calling the vendor on a number from your own records', 'Checking the email has a logo', 'Asking the sender for a letterhead'], answer: 1, explain: 'An independent call-back defeats compromised mailboxes.' },
      { id: 'q2', q: 'Why use dual approval for new payees?', options: ['It doubles the paperwork', 'A second person catches pressure-driven mistakes', 'It is faster', 'Banks require it'], answer: 1, explain: 'Two people make fraud much harder.' },
      { id: 'q3', q: 'You realise a payment went to a fraudulent account an hour ago. What first?', options: ['Wait for month-end reconciliation', 'Call the bank fraud line to request a recall', 'Email the fraudster', 'Delete the invoice'], answer: 1, explain: 'Fast bank contact gives the best chance of recovery.' },
      { id: 'q4', q: 'During tax season an executive emails asking for all employee W-2s as a PDF. What do you do?', options: ['Send them', 'Verify directly with the executive using a known channel', 'Send half of them', 'Post them to a shared folder'], answer: 1, explain: 'W-2 phishing is a well-known seasonal scam.' },
      { id: 'q5', q: 'What should be recorded after verifying a bank change?', options: ['Nothing', 'Who verified, how and when', 'The weather that day', 'Only the amount'], answer: 1, explain: 'A record proves the control ran and helps audits.' },
    ],
  },
  {
    code: 'ROLE-HR',
    track: 'hr',
    title: 'HR and recruiting: protecting people data',
    summary: 'Employee records, malicious résumés, payroll and W-2 phishing, fake applicants and secure on/offboarding.',
    duration_min: 20,
    lessons: [
      { title: 'The data you hold', body: `HR holds some of the most sensitive data in the business: ID numbers, bank details, health information, salaries and disciplinary records. Keep it in approved systems with access limited to people who need it, and never in personal email or unmanaged spreadsheets.` },
      { title: 'Recruiting risks', body: `- Résumés and "portfolios" can carry malware; open them only in your approved system or preview
- Fake applicants, sometimes using deepfake video, try to get hired to gain access
- Verify identity during hiring and check references using contact details you find yourself` },
      { title: 'Onboarding and offboarding', body: `Security starts on day one: accounts created with MFA, the new-hire Security Essentials course assigned, and only needed access granted. On the last day, disable accounts, collect devices and badges, and transfer data ownership. Late offboarding is a common source of breaches.` },
    ],
    quiz: [
      { id: 'q1', q: 'An "employee" emails asking to change their direct-deposit account. What should you do?', options: ['Change it right away', 'Verify in person or by a known phone number', 'Ask them to reply with their password', 'Forward it to payroll without checking'], answer: 1, explain: 'Payroll diversion scams impersonate staff.' },
      { id: 'q2', q: 'When should a leaver\'s accounts be disabled?', options: ['A month after they leave', 'On their last day, as part of offboarding', 'When they ask', 'Never; they might come back'], answer: 1, explain: 'Open accounts after departure are a common way in.' },
      { id: 'q3', q: 'Where should employee records be stored?', options: ['In personal email for easy access', 'In the approved HR system with limited access', 'On a USB stick', 'On the shared drive for everyone'], answer: 1, explain: 'Restrict sensitive records to approved, access-controlled systems.' },
      { id: 'q4', q: 'An applicant sends a résumé as a password-protected .zip file. What is the concern?', options: ['None', 'It may hide malware from security scanning', 'It is too small', 'It is unprofessional'], answer: 1, explain: 'Password-protected archives bypass email scanning.' },
      { id: 'q5', q: 'What should every new hire receive in their first week?', options: ['Admin rights', 'The Security Essentials course and MFA-protected accounts', 'All company passwords', 'Nothing security related'], answer: 1, explain: 'Security habits start on day one.' },
    ],
  },
  {
    code: 'ROLE-REM',
    track: 'remote',
    title: 'Remote and field staff',
    summary: 'Working securely from home, client sites and the road: VPN, device theft, public Wi-Fi and video calls.',
    duration_min: 15,
    lessons: [
      { title: 'Working from anywhere', body: `Remote and field staff face all the office risks without the office protections. Use the company VPN for company systems, keep devices locked and with you, and store files in company storage rather than on the device.` },
      { title: 'Client sites and shared spaces', body: `- Do not plug company devices into client networks or USB ports without permission
- Do not use client computers to sign in to your company accounts
- Keep conversations about client and company matters out of public earshot` },
      { title: 'Secure video calls', body: `Use meeting passcodes or lobbies for external calls, check who has joined before discussing confidential matters, blur or tidy your background, and never share your whole screen when a single window will do.` },
    ],
    quiz: [
      { id: 'q1', q: 'At a client site you need to print a document. What is safest?', options: ['Plug your laptop into their network without asking', 'Sign in to your email on their PC', 'Ask their IT contact for an approved method, or print later', 'Email it to a personal account'], answer: 2, explain: 'Unknown networks and computers can capture data.' },
      { id: 'q2', q: 'Your laptop bag is on the passenger seat while you pop into a shop. What is the risk?', options: ['None', 'Theft of the device and its data', 'The battery will drain', 'It will get too cold'], answer: 1, explain: 'Vehicles are a common place for device theft. Keep devices out of sight or with you.' },
      { id: 'q3', q: 'What should you check before discussing confidential matters on a video call?', options: ['Your hair', 'Who has joined the call', 'Your internet speed', 'The time zone'], answer: 1, explain: 'Uninvited attendees can join calls without passcodes or lobbies.' },
      { id: 'q4', q: 'Which is safer when presenting on a call?', options: ['Share your entire screen', 'Share only the window you need', 'Share your email inbox', 'Share your desktop with files visible'], answer: 1, explain: 'Sharing one window avoids exposing notifications and other data.' },
      { id: 'q5', q: 'Where should field staff save job files?', options: ['Only on the laptop desktop', 'In approved company storage', 'On a personal phone', 'In a notes app'], answer: 1, explain: 'Company storage is backed up and protected if the device is lost.' },
    ],
  },
  {
    code: 'ROLE-CUST',
    track: 'customer',
    title: 'Customer-facing staff',
    summary: 'Verifying callers, handling account-change requests, protecting card and personal data, and phone pretexting.',
    duration_min: 15,
    lessons: [
      { title: 'Verify before you change', body: `Attackers call front desks and support lines pretending to be customers so they can change email addresses, phone numbers or payment details, then take over the account. Always complete the verification steps before making changes, even for friendly or upset callers.` },
      { title: 'Protecting card and personal data', body: `- Never write down or email full card numbers; use the approved payment system
- Do not read personal details aloud in public areas
- Share only what the verified customer needs; never confirm details the caller has not provided` },
      { title: 'Handling pressure', body: `Pretexters use urgency, anger or charm: "I'm about to miss my flight", "Your manager said it was fine". It is always acceptable to say "I need to complete our verification steps first" or to escalate to a supervisor.` },
    ],
    quiz: [
      { id: 'q1', q: 'An upset caller wants to change the email on an account but fails verification. What do you do?', options: ['Change it to calm them down', 'Politely decline and explain the verification steps, or escalate', 'Ask them to guess again until right', 'Give them the current email to confirm'], answer: 1, explain: 'Account-takeover attempts often use pressure.' },
      { id: 'q2', q: 'How should card payments taken by phone be handled?', options: ['Write the number on a sticky note', 'Enter them only in the approved payment system', 'Email the number to finance', 'Read it back loudly to confirm'], answer: 1, explain: 'Card data must stay in approved, secure systems.' },
      { id: 'q3', q: 'A caller asks "Can you confirm the address you have for me?" What is safest?', options: ['Read it out', 'Ask them to state the address and check it matches', 'Email it to them', 'Text it to the number they give'], answer: 1, explain: 'Never disclose details the caller has not provided.' },
      { id: 'q4', q: 'A caller says your manager already approved an exception. What should you do?', options: ['Trust them', 'Confirm with your manager directly before acting', 'Make the change and tell the manager later', 'Hang up without comment'], answer: 1, explain: 'Name-dropping is a classic pretexting tactic.' },
      { id: 'q5', q: 'Why do attackers target front desk and support staff?', options: ['They have the fewest computers', 'They are trained to be helpful and can change account details', 'They work shorter hours', 'They have no email'], answer: 1, explain: 'Helpfulness is exploited to take over customer accounts.' },
    ],
  },
];
