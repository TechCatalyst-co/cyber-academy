// The 12 monthly core modules. Each module: short lessons, a realistic small-business
// scenario, one practical action, and a 5-question quiz. Scenarios use invented businesses.

export const CORE_MODULES = [
  {
    code: 'CORE-01',
    month: 1,
    title: 'Why security matters to a small business',
    summary: 'Why attackers target small businesses, what a breach really costs, and the part every employee plays.',
    duration_min: 12,
    lessons: [
      {
        title: 'Small businesses are not too small to target',
        body: `Most cyberattacks are not aimed at a named company. Criminals send millions of emails and scan the internet for weak spots, then take whatever works. Small and medium businesses are attractive because they hold valuable data and money but often have fewer defences.

Common reasons attackers pick small businesses:
- They handle payments, payroll and customer data worth stealing
- They are suppliers to larger companies and can be a way in
- They often lack a full-time security team
- They are more likely to pay to get running again quickly`,
      },
      {
        title: 'What a breach really costs',
        body: `The ransom or stolen payment is only the start. A serious incident can mean:
- **Downtime:** days or weeks unable to invoice, ship, book patients or serve customers
- **Recovery costs:** specialists, new equipment, legal advice and notification letters
- **Lost trust:** clients who leave and prospects who never sign
- **Fines and claims:** under privacy, health and payment-card rules
- **Insurance impact:** higher premiums, or claims refused if required controls were missing

Many small firms that suffer a major incident struggle for months afterwards.`,
      },
      {
        title: 'You are part of the defence',
        body: `Technology blocks most attacks, but the ones that get through usually need a person to click, reply, approve or pay. That makes every employee a security sensor.

You do not need to be technical. You need to:
- Slow down when a message creates urgency or pressure
- Verify requests for money, passwords or data using a known contact method
- Report anything odd straight away, even if you already clicked

Reporting fast is never a mistake. A report that turns out to be harmless costs a minute. An unreported attack can cost the business.`,
      },
    ],
    scenario: {
      title: 'Scenario: the 9-person design studio',
      body: `A staff member at a small design studio opened an attachment called "Invoice_overdue.zip" late on a Friday. Nobody reported it. By Monday, ransomware had encrypted the shared drive and client files. Backups were three weeks old. The studio lost two weeks of work and one of its largest clients.

What would have changed the outcome? A report on Friday would have let IT isolate the laptop within minutes.`,
    },
    action: 'Find out how to report a suspicious email in your company (the Report button or the person to contact) and save that contact in your phone.',
    takeaways: ['Attackers target small businesses because they are easier and still profitable', 'Breach costs go far beyond the ransom', 'Report anything suspicious quickly, even if you clicked'],
    quiz: [
      { id: 'q1', q: 'Why do criminals often target small and medium businesses?', options: ['Small businesses are legally required to pay ransoms', 'They hold valuable data and money but often have fewer defences', 'Large companies are impossible to attack', 'Small businesses do not use email'], answer: 1, explain: 'SMBs hold payments, customer data and supplier access, and usually have fewer security resources.' },
      { id: 'q2', q: 'Which of these is usually the largest hidden cost of a breach?', options: ['The cost of a new mouse', 'Downtime and lost customer trust', 'Printing notification letters', 'Changing the Wi-Fi name'], answer: 1, explain: 'Being unable to operate, plus clients leaving, often costs more than the ransom itself.' },
      { id: 'q3', q: 'You clicked a link in an email and now think it was a scam. What should you do?', options: ['Delete the email and say nothing', 'Wait to see if anything happens', 'Report it immediately to IT or your security contact', 'Forward it to colleagues to warn them'], answer: 2, explain: 'Fast reporting lets IT contain the problem. Forwarding spreads the risk.' },
      { id: 'q4', q: 'What is the most useful habit for an employee who is not technical?', options: ['Slow down, verify unusual requests, and report', 'Install extra antivirus programs at home', 'Turn off the computer every hour', 'Avoid using email'], answer: 0, explain: 'Pausing, verifying through a known contact and reporting stops most people-targeted attacks.' },
      { id: 'q5', q: 'A report you make turns out to be a harmless email. How should you feel about it?', options: ['Embarrassed, it wasted time', 'It was the right call; false alarms are cheap', 'You should stop reporting', 'You should be disciplined'], answer: 1, explain: 'Security teams would rather check ten harmless reports than miss one real attack.' },
    ],
  },
  {
    code: 'CORE-02',
    month: 2,
    title: 'Phishing and email scams',
    summary: 'Spot the red flags in malicious email, including QR codes and AI-written messages, and report them.',
    duration_min: 14,
    lessons: [
      {
        title: 'What phishing is',
        body: `Phishing is a message designed to trick you into clicking a link, opening a file, sharing a password or sending money. It is the most common way attacks start. Messages often copy brands you trust: delivery companies, banks, Microsoft, Google, DocuSign or your own IT team.`,
      },
      {
        title: 'The red flags',
        body: `Look for these signs before you act:
- **Urgency or fear:** "Your account will be closed in 24 hours"
- **Unexpected requests:** a file share, invoice or password reset you did not ask for
- **Sender mismatch:** the display name says "Microsoft" but the address is something else
- **Link mismatch:** hover over a link (or long-press on mobile) and the real address is unfamiliar
- **Odd attachments:** .zip, .html, .iso or macro-enabled Office files you did not expect
- **Requests to bypass process:** "Don't tell anyone", "Just this once"

Modern phishing is often written with AI tools, so perfect spelling and grammar no longer mean a message is safe.`,
      },
      {
        title: 'QR codes and links you cannot hover over',
        body: `Scammers now hide links in QR codes inside emails, PDFs and even posters, because a phone camera skips the checks your work computer does. Treat a QR code in an unexpected email the same as a link: do not scan it. Go to the service directly by typing the address you know or using the official app.`,
      },
      {
        title: 'What to do with a suspicious email',
        body: `- Do not click links, scan codes, open attachments or reply
- Use the **Report phishing** button, or forward it as your company instructs
- If you already clicked or entered a password, report it and change that password straight away
- If it claims to be from someone you know, check with them using a phone number or chat you already have`,
      },
    ],
    scenario: {
      title: 'Scenario: the shared document',
      body: `An office manager at a dental practice received "Dr. Patel shared 'Q3 Payroll Adjustments' with you". The logo looked right. The link opened a page asking her to sign in to Microsoft 365. The address bar showed "micros0ft-docs-share.com". She closed the page and pressed Report. IT blocked the site for the whole practice within ten minutes.`,
    },
    action: 'Open three emails in your inbox and practise hovering over links to see the real address before clicking.',
    takeaways: ['Urgency, surprise and mismatched senders or links are the classic signs', 'Good grammar does not mean an email is safe', 'Report suspicious emails; do not just delete them'],
    quiz: [
      { id: 'q1', q: 'Which is the strongest sign an email may be phishing?', options: ['It uses your first name', 'It urges you to act within hours or lose access', 'It was sent on a weekday', 'It has a company logo'], answer: 1, explain: 'Artificial urgency is designed to stop you thinking carefully.' },
      { id: 'q2', q: 'How can you check where a link really goes on a computer?', options: ['Click it quickly and close the page', 'Hover the mouse over it and read the address shown', 'Reply and ask the sender', 'Check the font of the email'], answer: 1, explain: 'Hovering shows the real destination without visiting it.' },
      { id: 'q3', q: 'An email is written in perfect English with no spelling mistakes. What does that tell you?', options: ['It is definitely safe', 'Nothing on its own; AI tools make scams well written', 'It must be from a large company', 'It is definitely phishing'], answer: 1, explain: 'Attackers now use AI to write convincing messages, so check other red flags.' },
      { id: 'q4', q: 'An unexpected email asks you to scan a QR code to keep your benefits. What should you do?', options: ['Scan it with your personal phone', 'Scan it with your work phone', 'Do not scan it; go to the benefits site directly or ask HR', 'Forward it to your team'], answer: 2, explain: 'QR codes hide the destination. Use a known route instead.' },
      { id: 'q5', q: 'What is the best way to handle a phishing email at work?', options: ['Delete it', 'Report it using the company process', 'Reply asking them to stop', 'Unsubscribe'], answer: 1, explain: 'Reporting lets IT warn others and block the sender. Replying or unsubscribing confirms your address is live.' },
    ],
  },
  {
    code: 'CORE-03',
    month: 3,
    title: 'Passwords, passphrases and multi-factor authentication',
    summary: 'Protect your accounts with passphrases, a password manager and MFA, and recognise MFA fatigue attacks.',
    duration_min: 12,
    lessons: [
      {
        title: 'Why passwords get stolen',
        body: `Passwords leak through data breaches at other websites, phishing pages and malware. Attackers then try those leaked passwords on email, banking and business systems. This is called credential stuffing, and it works because people reuse passwords.`,
      },
      {
        title: 'Passphrases and a password manager',
        body: `- Use a **passphrase**: four or more random words, such as "lantern-oyster-quietly-copper". Length beats complexity.
- Use a **different password for every account**. One breach should never unlock everything.
- Use the **company password manager** to create and store them. You only remember one strong master passphrase.
- Never share passwords by email or chat, and never write them on sticky notes.`,
      },
      {
        title: 'Multi-factor authentication (MFA)',
        body: `MFA adds a second proof that it is really you: an app prompt, a code, a security key or a passkey. Even if a password is stolen, MFA blocks most account takeovers.

Turn it on for email first, then banking, payroll, cloud storage and any admin account. Authenticator apps, passkeys and security keys are stronger than text-message codes.`,
      },
      {
        title: 'MFA fatigue: never approve a prompt you did not start',
        body: `Attackers who have your password may send push prompt after push prompt, hoping you tap Approve to make them stop. Some call pretending to be IT and ask you to read out a code.

- Only approve a sign-in you just started yourself
- Never read an MFA code to anyone, including "IT support"
- An unexpected prompt means someone has your password: deny it, change your password and report it`,
      },
    ],
    scenario: {
      title: 'Scenario: 2 a.m. approvals',
      body: `A project manager at a construction firm woke to a dozen "Approve sign-in?" prompts on her phone. Half-asleep, she tapped Approve to silence them. The attacker was now inside her mailbox and began sending fake invoices to clients. If she had tapped Deny and reported it, the attack would have stopped there.`,
    },
    action: 'Set up the company password manager and turn on MFA for your work email if it is not already on.',
    takeaways: ['Use long, unique passphrases stored in a password manager', 'Turn on MFA everywhere, starting with email', 'Deny and report any MFA prompt you did not start'],
    quiz: [
      { id: 'q1', q: 'Which password is strongest?', options: ['Summer2026!', 'P@ssw0rd', 'lantern-oyster-quietly-copper', 'CompanyName123'], answer: 2, explain: 'A long passphrase of random words is harder to crack and easier to remember.' },
      { id: 'q2', q: 'Why is reusing a password across sites risky?', options: ['It makes typing slower', 'One breach can unlock every account that shares it', 'Websites will block you', 'It uses more storage'], answer: 1, explain: 'Attackers try leaked passwords on other services (credential stuffing).' },
      { id: 'q3', q: 'You get an MFA prompt on your phone but you are not signing in. What should you do?', options: ['Approve it to make it stop', 'Ignore it', 'Deny it, change your password and report it', 'Turn off MFA'], answer: 2, explain: 'An unexpected prompt means someone likely has your password.' },
      { id: 'q4', q: 'Someone calls saying they are from IT and asks you to read them your MFA code. What do you do?', options: ['Read it out; IT needs it', 'Refuse, hang up and report the call', 'Send it by text instead', 'Give them half the code'], answer: 1, explain: 'Legitimate IT staff never need your MFA code.' },
      { id: 'q5', q: 'Which account should you protect with MFA first?', options: ['Your email account', 'A news website', 'A recipe blog', 'A game account'], answer: 0, explain: 'Email resets every other password, so it is the most important account to protect.' },
    ],
  },
  {
    code: 'CORE-04',
    month: 4,
    title: 'Social engineering: phone, text and in person',
    summary: 'Resist manipulation over the phone, by text message and face to face, including AI voice cloning.',
    duration_min: 12,
    lessons: [
      {
        title: 'How social engineering works',
        body: `Social engineering is manipulating people instead of hacking computers. Attackers play on helpfulness, authority, fear and time pressure. They often research you first using LinkedIn and the company website so the story sounds right.`,
      },
      {
        title: 'Vishing and smishing',
        body: `- **Vishing** (voice phishing): calls from "IT support", "the bank" or "a supplier" asking you to install software, read a code or confirm details
- **Smishing** (SMS phishing): texts about deliveries, unpaid tolls, account locks or a "new number" from your boss

Caller ID and sender names can be faked. If a call or text asks for access, codes, payment or personal data, end it and contact the organisation using a number you already know.`,
      },
      {
        title: 'AI voice cloning and deepfakes',
        body: `A few seconds of someone's voice from a video or voicemail is enough to clone it. Criminals have used cloned voices of owners and executives to request urgent payments.

Agree a verification step for sensitive requests: call back on a known number, or use a code word. A familiar voice on its own is no longer proof.`,
      },
      {
        title: 'In person: tailgating and pretexting',
        body: `Someone carrying boxes, wearing a hi-vis vest or claiming to be "here to fix the printer" may be trying to walk in behind you. It is polite and correct to:
- Ask who they are visiting and check with that person or reception
- Not hold secure doors open for people you do not know
- Escort visitors and never leave them alone with computers or files`,
      },
    ],
    scenario: {
      title: 'Scenario: the helpful helpdesk',
      body: `A receptionist at a logistics company got a call: "Hi, this is Jordan from IT. We're seeing errors on your PC. I'll send a link to a remote support tool so I can fix it." The name matched a real IT contractor from LinkedIn. She said she would call IT back on the internal number. The real IT team had never called. The attacker hung up.`,
    },
    action: 'Save your IT team\'s real phone number and agree a call-back rule for any caller asking for access or codes.',
    takeaways: ['Caller ID, sender names and even voices can be faked', 'Verify using a contact method you already know', 'It is fine to challenge strangers politely in the office'],
    quiz: [
      { id: 'q1', q: 'A caller says he is from IT and needs you to install a remote-support tool. What should you do?', options: ['Install it; IT asked', 'End the call and contact IT on a number you already know', 'Ask him to email the link instead', 'Give him your password so he can do it himself'], answer: 1, explain: 'Call back on a trusted number to confirm any request for access.' },
      { id: 'q2', q: 'Your manager texts from a new number asking you to buy gift cards urgently. What is the right response?', options: ['Buy them quickly', 'Reply asking for the amount', 'Verify with your manager using their known number or in person', 'Forward the text to finance'], answer: 2, explain: 'Gift-card requests from a "new number" are a classic scam.' },
      { id: 'q3', q: 'Why is a familiar voice on the phone no longer enough proof of identity?', options: ['Phone lines are unreliable', 'AI can clone a voice from a short recording', 'People change their voice often', 'It is against company policy to recognise voices'], answer: 1, explain: 'Voice cloning makes call-backs and code words essential for sensitive requests.' },
      { id: 'q4', q: 'A stranger in a delivery uniform asks you to hold the secure door open. What do you do?', options: ['Hold it; they look busy', 'Politely ask who they are visiting and direct them to reception', 'Ignore them', 'Give them your access card'], answer: 1, explain: 'Tailgating is a common way into offices. Reception can verify visitors.' },
      { id: 'q5', q: 'Which emotion do social engineers most often use to rush you?', options: ['Boredom', 'Urgency or fear', 'Curiosity about the weather', 'Calm'], answer: 1, explain: 'Pressure stops people from checking. Slowing down is the defence.' },
    ],
  },
  {
    code: 'CORE-05',
    month: 5,
    title: 'Business email compromise and payment fraud',
    summary: 'Stop fake invoices, changed bank details, CEO fraud and gift-card scams with call-back verification.',
    duration_min: 14,
    lessons: [
      {
        title: 'What business email compromise is',
        body: `Business email compromise (BEC) is when criminals pose as a boss, supplier or client to get money sent to them. They may use a lookalike address (acme-supp1y.com), a hacked real mailbox, or simply a display name. BEC causes some of the largest financial losses of any cybercrime because there is no malware to detect: just a convincing request.`,
      },
      {
        title: 'The common patterns',
        body: `- **Changed bank details:** "We've moved banks, please pay future invoices to this account"
- **Fake or inflated invoices:** a real supplier's name with the attacker's bank account
- **CEO fraud:** "I'm in a meeting, I need you to send a payment now, keep this confidential"
- **Gift cards:** "Buy eight $200 cards for a client thank-you and send me the codes"
- **Payroll diversion:** an "employee" asks HR to change where their salary is paid`,
      },
      {
        title: 'The verification rule',
        body: `Every request to pay someone new, change bank details or make an urgent or secret payment must be verified:
1. Call the person or company on a number from your records, **never** the one in the email
2. Confirm the details verbally
3. Get a second approval for new payees or changed details
4. Record that you verified it

No legitimate boss or supplier will be upset that you followed the process.`,
      },
    ],
    scenario: {
      title: 'Scenario: the supplier who "changed banks"',
      body: `An accounts clerk at a manufacturer received an email from a long-time supplier: new bank details, attached on letterhead, with the next invoice. The thread was real because the supplier's mailbox had been hacked. The clerk called the supplier's number from the vendor file. The supplier knew nothing about it. The $48,000 payment was stopped.`,
    },
    action: 'Ask your manager or finance lead to show you your company\'s payment verification procedure, and find where verified vendor phone numbers are kept.',
    takeaways: ['BEC relies on trust, not malware', 'Always call back on a known number to verify payment changes', 'Secrecy and urgency around payments are warning signs'],
    quiz: [
      { id: 'q1', q: 'A supplier emails new bank details for future payments. What should you do first?', options: ['Update the details in the system', 'Reply to the email asking if it is genuine', 'Call the supplier on the number already in your records', 'Pay the next invoice to both accounts'], answer: 2, explain: 'Replying goes to the attacker if the mailbox is compromised. Use a known number.' },
      { id: 'q2', q: 'Your CEO emails asking for an urgent, confidential payment while they are travelling. What is the safest action?', options: ['Pay it; the CEO outranks the process', 'Verify directly with the CEO by phone and follow the approval process', 'Ask a colleague to pay it instead', 'Wait until tomorrow then pay'], answer: 1, explain: 'Urgency plus secrecy is the classic CEO-fraud pattern.' },
      { id: 'q3', q: 'Why is business email compromise hard for security software to catch?', options: ['It uses advanced viruses', 'It often contains no malware, just a convincing request', 'It only happens at night', 'It is sent by fax'], answer: 1, explain: 'The attack relies on people trusting the message.' },
      { id: 'q4', q: 'Which phone number should you use to verify a payment request?', options: ['The one in the email signature', 'One from your existing records or the official website', 'The one the caller gives you', 'Any number that answers'], answer: 1, explain: 'Contact details in the suspicious message may belong to the attacker.' },
      { id: 'q5', q: 'An employee emails HR to change their salary bank account. What should HR do?', options: ['Change it immediately', 'Verify in person or by a known phone number before changing', 'Ask them to reply with their password', 'Ignore it'], answer: 1, explain: 'Payroll diversion scams impersonate employees. Always verify changes.' },
    ],
  },
  {
    code: 'CORE-06',
    month: 6,
    title: 'Safe web browsing, downloads and software',
    summary: 'Avoid fake websites, malicious ads, fake updates and unapproved apps, and keep devices updated.',
    duration_min: 11,
    lessons: [
      {
        title: 'Fake websites and search ads',
        body: `Criminals buy search ads and build lookalike sites for banks, software downloads and login pages. The top search result is not always the real one.
- Type important addresses yourself or use bookmarks
- Check the address carefully: paypa1.com, rnicrosoft.com
- The padlock only means the connection is encrypted, not that the site is honest`,
      },
      {
        title: 'Downloads, extensions and fake updates',
        body: `- Download software only from the vendor's official site or your company portal
- A pop-up saying "Your browser is out of date, click to update" is almost always fake. Real updates come from the browser or system itself.
- Browser extensions can read everything you do on web pages. Install only ones your company approves.`,
      },
      {
        title: 'Shadow IT and why updates matter',
        body: `Using unapproved apps or file-sharing services ("shadow IT") puts company data where IT cannot protect or recover it. Ask before adding a new tool.

Updates fix security holes that attackers actively exploit. Restart when prompted, and do not postpone updates for weeks.`,
      },
    ],
    scenario: {
      title: 'Scenario: the free PDF converter',
      body: `A bookkeeper searched "free PDF to Excel converter" and clicked the first result, an ad. The installer included a browser extension that captured passwords typed into web pages. Two weeks later the firm's accounting software login was used from overseas. The software was never on the company's approved list.`,
    },
    action: 'Check your computer and browser for pending updates and install them today. Remove any browser extensions you do not use.',
    takeaways: ['Use bookmarks or type addresses for important sites', 'Update pop-ups on websites are fake', 'Ask IT before installing software or extensions'],
    quiz: [
      { id: 'q1', q: 'What does the padlock icon in the browser address bar tell you?', options: ['The site is owned by a trusted company', 'The connection is encrypted, not that the site is legitimate', 'The site has no viruses', 'The site is government approved'], answer: 1, explain: 'Scam sites can have padlocks too.' },
      { id: 'q2', q: 'A website pop-up says your browser is out of date and offers an update. What should you do?', options: ['Click update', 'Close the page and update through the browser settings if needed', 'Download it to a USB stick', 'Share it with colleagues'], answer: 1, explain: 'Real updates come from the browser or operating system, not website pop-ups.' },
      { id: 'q3', q: 'Where should you download work software from?', options: ['The first search result', 'The vendor\'s official site or the company software portal', 'A file-sharing forum', 'A link in an email'], answer: 1, explain: 'Search ads and third-party sites often bundle malware.' },
      { id: 'q4', q: 'Why are unapproved browser extensions risky?', options: ['They slow down printing', 'They can read and change what you do on web pages', 'They use too much paper', 'They are always illegal'], answer: 1, explain: 'Malicious extensions can steal passwords and session data.' },
      { id: 'q5', q: 'Why should you install updates promptly?', options: ['They change the colour scheme', 'They fix security holes attackers are exploiting', 'They are required to use email', 'They delete old files'], answer: 1, explain: 'Unpatched software is one of the most common ways in.' },
    ],
  },
  {
    code: 'CORE-07',
    month: 7,
    title: 'Ransomware and malware',
    summary: 'How ransomware gets in, the warning signs, and the three-step response: disconnect, don\'t touch, call.',
    duration_min: 12,
    lessons: [
      {
        title: 'How ransomware works',
        body: `Ransomware encrypts files so they cannot be opened, then demands payment. Modern gangs also steal data first and threaten to publish it. It usually gets in through a phishing email, a stolen password for remote access, or unpatched software.`,
      },
      {
        title: 'Warning signs',
        body: `- Files suddenly renamed with strange extensions or will not open
- A ransom note on screen or in folders
- The computer becomes very slow, or the fan runs hard for no reason
- Antivirus alerts or security tools switched off
- Colleagues report the same issues on shared drives`,
      },
      {
        title: 'Disconnect, don\'t touch, call',
        body: `If you suspect malware or ransomware:
1. **Disconnect:** unplug the network cable and turn off Wi-Fi. Do not shut down unless IT says so, as evidence in memory can help.
2. **Don't touch:** do not open more files, delete anything, or try to fix it yourself.
3. **Call:** contact IT or your security provider immediately by phone.

Never pay or contact the attackers yourself. Decisions about ransoms involve leadership, insurers and legal advisers.`,
      },
      {
        title: 'Why backups matter',
        body: `Tested, offline or immutable backups are what let a business recover without paying. Save work to approved company storage that is backed up, not to your desktop or personal drives.`,
      },
    ],
    scenario: {
      title: 'Scenario: the slow Monday',
      body: `A field technician at an HVAC company noticed his laptop was crawling and some job files had turned into "report.pdf.locked". He pulled the Wi-Fi, left the laptop alone and called the office. IT isolated the machine before the ransomware reached the file server. The company restored his files from the previous night's backup.`,
    },
    action: 'Memorise the three steps: disconnect, don\'t touch, call. Check that your work files are saved to company storage.',
    takeaways: ['Ransomware usually starts with phishing, stolen passwords or unpatched software', 'Disconnect, don\'t touch, call', 'Save work to backed-up company storage'],
    quiz: [
      { id: 'q1', q: 'Your files suddenly have strange extensions and will not open. What should you do first?', options: ['Restart the computer', 'Disconnect from the network', 'Try to rename the files back', 'Email everyone'], answer: 1, explain: 'Disconnecting stops the spread to shared drives and other devices.' },
      { id: 'q2', q: 'Why should you usually avoid shutting the computer down unless IT says to?', options: ['It might break the screen', 'Evidence in memory can help investigators', 'It uses too much power', 'Shutting down pays the ransom'], answer: 1, explain: 'IT may need memory evidence; follow their instructions.' },
      { id: 'q3', q: 'A ransom note appears asking you to contact the attackers. What should you do?', options: ['Contact them to negotiate', 'Report it immediately and do not contact them', 'Pay with your own money', 'Ignore it'], answer: 1, explain: 'Ransom decisions involve leadership, insurers and legal advice.' },
      { id: 'q4', q: 'What most helps a business recover from ransomware without paying?', options: ['A faster internet connection', 'Tested, protected backups', 'A new printer', 'Longer passwords only'], answer: 1, explain: 'Good backups let the business restore its data.' },
      { id: 'q5', q: 'Where should you save work files?', options: ['On the desktop only', 'On a personal USB stick', 'In approved company storage that is backed up', 'In personal cloud accounts'], answer: 2, explain: 'Approved storage is protected and backed up.' },
    ],
  },
  {
    code: 'CORE-08',
    month: 8,
    title: 'Protecting data and privacy',
    summary: 'Handle customer, employee, health and card data correctly: classify it, share it securely, dispose of it safely.',
    duration_min: 13,
    lessons: [
      {
        title: 'Know what is sensitive',
        body: `Some information needs extra care because losing it harms people and the business:
- **Personal data:** names with addresses, dates of birth, ID numbers
- **Financial data:** bank details, payment card numbers
- **Health data:** medical records, insurance and benefits information
- **Employee records:** salaries, reviews, disciplinary files
- **Confidential business data:** contracts, pricing, client lists, passwords`,
      },
      {
        title: 'Classify, then handle accordingly',
        body: `A simple scheme works for most small businesses:
- **Public:** already published, safe to share
- **Internal:** for staff only
- **Confidential:** limited to people who need it, shared only through approved secure methods

Only access the data you need for your job. Do not copy confidential data to personal email, personal cloud storage or USB sticks.`,
      },
      {
        title: 'Sharing and sending securely',
        body: `- Use approved secure file sharing with access limited to named people and an expiry date
- Use encrypted email for confidential data if your company provides it
- Double-check recipients before sending; autocomplete causes many data leaks
- Never send full card numbers by email or chat`,
      },
      {
        title: 'Clean desk and secure disposal',
        body: `Lock your screen when you step away (Windows + L, or Ctrl + Cmd + Q on Mac). Put confidential papers away at the end of the day. Shred paper records and give old devices to IT for secure wiping; never put them in the bin.`,
      },
    ],
    scenario: {
      title: 'Scenario: the autocomplete slip',
      body: `An HR coordinator meant to email a salary spreadsheet to "Sam Ortiz, Payroll" but autocomplete picked "Sam Ortega", a client. The file was not password protected. The company had to notify affected staff and report it. A secure share link restricted to the named person would have blocked access.`,
    },
    action: 'Pick ten files you work with and decide whether each is Public, Internal or Confidential.',
    takeaways: ['Know which data is sensitive and treat it that way', 'Share confidential files only through approved secure methods', 'Lock your screen and shred paper'],
    quiz: [
      { id: 'q1', q: 'Which of these is confidential data?', options: ['Your company\'s public website address', 'An employee salary spreadsheet', 'The office opening hours', 'A published press release'], answer: 1, explain: 'Salary data is sensitive employee information.' },
      { id: 'q2', q: 'What is the safest way to share a confidential file with a colleague?', options: ['Attach it to personal email', 'Upload it to a public link anyone can open', 'Use approved secure sharing limited to that person', 'Copy it to a USB stick'], answer: 2, explain: 'Restricted, approved sharing keeps control of the data.' },
      { id: 'q3', q: 'What should you do when you step away from your computer?', options: ['Leave it; you will be back soon', 'Lock the screen', 'Turn the monitor off only', 'Close the browser'], answer: 1, explain: 'A locked screen prevents anyone using your session.' },
      { id: 'q4', q: 'How should you dispose of an old work laptop?', options: ['Put it in the recycling bin', 'Sell it online', 'Give it to IT for secure wiping', 'Take it home'], answer: 2, explain: 'Devices hold data even after deleting files. IT must wipe them.' },
      { id: 'q5', q: 'Which common mistake causes many accidental data leaks?', options: ['Using a large monitor', 'Email autocomplete picking the wrong recipient', 'Typing too fast', 'Using dark mode'], answer: 1, explain: 'Always double-check recipients before sending sensitive files.' },
    ],
  },
  {
    code: 'CORE-09',
    month: 9,
    title: 'Remote work, travel and mobile devices',
    summary: 'Stay secure at home, on public Wi-Fi and on the road, and protect phones and laptops from loss and theft.',
    duration_min: 11,
    lessons: [
      {
        title: 'The home office',
        body: `- Change the default admin password on your home router and keep its firmware updated
- Use WPA2 or WPA3 Wi-Fi encryption with a strong passphrase
- Keep work devices for work; do not let family members use them
- Take video calls with nothing confidential visible behind you`,
      },
      {
        title: 'Public Wi-Fi and travel',
        body: `Cafe, hotel and airport Wi-Fi can be monitored or faked ("Free_Airport_WiFi"). Use the company VPN, or your phone's hotspot. Be aware of people reading your screen on trains and planes; a privacy screen filter helps. Never leave devices unattended, even for a moment.`,
      },
      {
        title: 'Phones and lost devices',
        body: `- Use a PIN or biometric lock on every device that holds work email or files
- Keep phones updated and install apps only from official stores
- If a work device, or a personal phone with work email, is lost or stolen, **report it immediately** so IT can lock or wipe it
- Follow your company's rules for personal devices (BYOD)`,
      },
    ],
    scenario: {
      title: 'Scenario: the airport lounge',
      body: `A sales rep connected to "Airport-Free-WiFi" while waiting for a flight and signed in to the CRM. The network was a hotspot run by someone in the lounge. The login page he saw was fake. Using his phone's hotspot and the company VPN would have avoided it.`,
    },
    action: 'Complete the five-point home-office checklist: router password changed, firmware updated, WPA2/WPA3 on, device screen lock on, VPN installed.',
    takeaways: ['Secure your home router and Wi-Fi', 'Use VPN or your phone hotspot on public Wi-Fi', 'Report lost or stolen devices immediately'],
    quiz: [
      { id: 'q1', q: 'What is the safest way to connect to the internet at an airport?', options: ['The free airport Wi-Fi with no VPN', 'Your phone hotspot or the company VPN', 'Any network with "Free" in the name', 'A stranger\'s hotspot'], answer: 1, explain: 'Public networks can be monitored or faked.' },
      { id: 'q2', q: 'Which home router setting matters most?', options: ['Changing the default admin password', 'The colour of the lights', 'The network name being funny', 'Placing it near a window'], answer: 0, explain: 'Default passwords are widely known and let attackers change your router settings.' },
      { id: 'q3', q: 'You lose your personal phone that has work email on it. What should you do?', options: ['Wait a few days to see if it turns up', 'Report it to IT immediately', 'Buy a new phone and say nothing', 'Only tell your family'], answer: 1, explain: 'IT can remotely lock or wipe work data.' },
      { id: 'q4', q: 'A family member wants to use your work laptop for homework. What should you say?', options: ['Yes, but only for an hour', 'No, work devices are for work only', 'Yes, if they use incognito mode', 'Yes, if they do not install anything'], answer: 1, explain: 'Shared use risks malware and accidental data exposure.' },
      { id: 'q5', q: 'What helps stop people reading your screen on a train?', options: ['A brighter screen', 'A privacy screen filter and awareness of who is nearby', 'Larger fonts', 'Dark mode'], answer: 1, explain: 'Shoulder surfing is simple and effective; a filter helps.' },
    ],
  },
  {
    code: 'CORE-10',
    month: 10,
    title: 'Using AI tools safely',
    summary: 'Get value from AI assistants without leaking data, and spot AI-powered scams and deepfakes.',
    duration_min: 11,
    lessons: [
      {
        title: 'What not to paste into AI tools',
        body: `AI assistants are useful for drafting and summarising, but anything you paste may be stored or used by the provider unless your company has an approved business account with the right settings. Do not paste:
- Customer, patient or employee personal data
- Passwords, API keys or access codes
- Confidential contracts, pricing or financial results
- Source code or internal documents unless your company approves it`,
      },
      {
        title: 'Approved tools and checking the output',
        body: `Use only AI tools your company has approved, signed in with your work account. AI can be confidently wrong, so check facts, figures, legal wording and code before you rely on them. You are responsible for anything you send, whoever drafted it.`,
      },
      {
        title: 'AI-powered scams',
        body: `Criminals use AI to write flawless phishing emails, clone voices and create fake video of real people. Apply the same rules as always: verify unusual requests through a known channel, and be suspicious of urgency and secrecy, however convincing the message looks or sounds.`,
      },
    ],
    scenario: {
      title: 'Scenario: the helpful summary',
      body: `A practice administrator pasted a spreadsheet of patient appointment notes into a free AI chatbot to create a summary for the doctors. The chatbot's free tier kept conversations for training. Under health privacy rules, this counted as an unauthorised disclosure. The practice's approved AI tool would have kept the data protected.`,
    },
    action: 'Read your company\'s AI acceptable-use policy and note which AI tools are approved.',
    takeaways: ['Never paste sensitive data into unapproved AI tools', 'Check AI output before relying on it', 'AI makes scams more convincing, so verification matters more'],
    quiz: [
      { id: 'q1', q: 'Which of these is safe to paste into an unapproved public AI chatbot?', options: ['A client list with phone numbers', 'A generic request to improve the wording of a public job advert', 'Your password to check its strength', 'Patient appointment notes'], answer: 1, explain: 'Only non-sensitive, public information belongs in unapproved tools.' },
      { id: 'q2', q: 'Who is responsible for a report you send that was drafted with AI?', options: ['The AI provider', 'You', 'Nobody', 'IT'], answer: 1, explain: 'Always review and take ownership of AI-assisted work.' },
      { id: 'q3', q: 'You receive a video message from your CEO asking for an urgent transfer. What should you do?', options: ['Send the money; the video proves it is real', 'Verify through a known channel before acting', 'Ask the AI tool if it is real', 'Forward it to all staff'], answer: 1, explain: 'Deepfake video and voice are now used in payment fraud.' },
      { id: 'q4', q: 'Why use your company\'s approved AI tool instead of a free one?', options: ['It has nicer colours', 'It is set up to protect company data', 'Free tools do not work', 'It writes longer answers'], answer: 1, explain: 'Business accounts can prevent your data being stored or used for training.' },
      { id: 'q5', q: 'An AI tool gives you a legal clause to use in a contract. What should you do?', options: ['Use it as is', 'Have it checked by someone qualified before using it', 'Ask the AI if it is sure', 'Shorten it'], answer: 1, explain: 'AI can be confidently wrong, especially on legal and financial details.' },
    ],
  },
  {
    code: 'CORE-11',
    month: 11,
    title: 'Social media and your online footprint',
    summary: 'Limit what attackers learn about you and the business, and spot fake profiles and job scams.',
    duration_min: 10,
    lessons: [
      {
        title: 'Oversharing helps attackers',
        body: `Attackers research targets before they strike. Posts about your role, your boss's travel, new suppliers, office photos showing badges or screens, and answers to "fun" quizzes (first pet, first car) all help them write convincing scams or guess security questions.`,
      },
      {
        title: 'LinkedIn and fake profiles',
        body: `Professional networks are a favourite tool for reconnaissance and scams:
- Fake recruiters offer jobs that lead to malware "assessments" or requests for ID documents
- Fake colleagues or suppliers connect first, then message with links or requests
- Your org chart can be pieced together from profiles to target finance and HR

Check before accepting connections, and be wary of messages that move quickly to links, files or money.`,
      },
      {
        title: 'Tighten your settings',
        body: `- Review privacy settings on each account; limit who sees your posts and contacts
- Do not post photos showing badges, screens, whiteboards or documents
- Do not announce travel plans in real time
- Follow your company's rules on posting about work`,
      },
    ],
    scenario: {
      title: 'Scenario: the conference post',
      body: `The owner of an accounting firm posted a photo from a conference abroad: "Two days in Lisbon!" The next morning, the office manager received an email "from" the owner asking for an urgent wire to a new client's escrow account. The attacker knew the owner would be hard to reach. The office manager called the owner's mobile and the fraud was stopped.`,
    },
    action: 'Review the privacy settings on one personal social media account and remove anything that reveals security-question answers.',
    takeaways: ['What you post helps attackers tailor scams', 'Be cautious with new connections and recruiters', 'Keep badges, screens and travel plans off social media'],
    quiz: [
      { id: 'q1', q: 'Why are social media quizzes like "your first pet\'s name" risky?', options: ['They take too long', 'They reveal common security-question answers', 'They are always illegal', 'They slow your phone'], answer: 1, explain: 'These answers are used to reset accounts.' },
      { id: 'q2', q: 'A recruiter you do not know asks you to download a coding test file. What should you do?', options: ['Open it on your work laptop', 'Be cautious; verify the company and do not run files on work devices', 'Send them your ID documents first', 'Share it with colleagues'], answer: 1, explain: 'Fake job offers are used to deliver malware and steal identities.' },
      { id: 'q3', q: 'Which photo is safe to post?', options: ['Your desk with your screen showing email', 'Your ID badge on your first day', 'A team lunch with no screens, badges or documents visible', 'The whiteboard from the strategy meeting'], answer: 2, explain: 'Avoid anything showing access credentials or internal information.' },
      { id: 'q4', q: 'How can posting live travel updates help attackers?', options: ['It does not matter', 'They know you are hard to reach and can impersonate you', 'It improves their spelling', 'It changes your password'], answer: 1, explain: 'Scammers time impersonation requests for when the real person is away.' },
      { id: 'q5', q: 'What should you check before accepting a new connection request?', options: ['Only their profile photo', 'That they are a real person you know or can verify', 'Their number of connections only', 'Nothing; accept everyone'], answer: 1, explain: 'Fake profiles are built to look credible at a glance.' },
    ],
  },
  {
    code: 'CORE-12',
    month: 12,
    title: 'Incident reporting and response',
    summary: 'What counts as an incident, how to report it, what to write down, and why a no-blame culture works.',
    duration_min: 12,
    lessons: [
      {
        title: 'What counts as an incident',
        body: `Report anything that might put company systems, data or money at risk, including:
- Clicking a suspicious link, opening an attachment or entering a password on a strange page
- A lost or stolen device, badge or paper file
- Data sent to the wrong person
- Unexpected MFA prompts, password reset emails or account lockouts
- Unusual computer behaviour, pop-ups or ransom notes
- A suspicious call, visitor or payment request`,
      },
      {
        title: 'How to report and what to note',
        body: `Report straight away using your company's process: the Report button, the security email, or a phone call to IT for anything urgent. Note down:
- What happened and when
- What you clicked, opened, entered or sent
- Who or what was involved (sender, website, device)
- What you have done since

Keep the evidence. Do not delete emails or files unless IT asks you to.`,
      },
      {
        title: 'No blame, just speed',
        body: `People who fear blame hide mistakes, and hidden incidents grow. This program treats reports as the most valuable security behaviour there is. You will never be in trouble for reporting honestly and quickly, even if you made the mistake.`,
      },
      {
        title: 'Your year in review',
        body: `Over the program your company has run phishing simulations, monthly lessons and refreshers. Your administrator can share how click and report rates changed. The goal for next year: fewer clicks, faster reports, and security habits that happen without thinking.`,
      },
    ],
    scenario: {
      title: 'Scenario: the ten-minute report',
      body: `A marketing coordinator at a nonprofit entered her password on a fake donation-platform login and realised a minute later. She called IT and said exactly what happened. IT reset her password, revoked her sessions and checked mailbox rules within ten minutes. The attacker never got in. The director thanked her in the next all-staff meeting.`,
    },
    action: 'Talk through two "what would you do?" situations with a colleague: a lost phone, and a password entered on a fake page.',
    takeaways: ['Report anything that might be an incident', 'Write down what happened and keep evidence', 'Speed matters more than blame'],
    quiz: [
      { id: 'q1', q: 'Which of these should be reported as a security incident?', options: ['A colleague\'s birthday email', 'Accidentally emailing a customer file to the wrong person', 'A slow printer', 'A calendar invite from your manager'], answer: 1, explain: 'Misdirected data is an incident, even when accidental.' },
      { id: 'q2', q: 'What should you do with the suspicious email after reporting it?', options: ['Delete it immediately', 'Keep it unless IT tells you otherwise', 'Forward it to friends', 'Reply to the sender'], answer: 1, explain: 'IT may need it as evidence.' },
      { id: 'q3', q: 'Why does a no-blame culture improve security?', options: ['People report problems faster instead of hiding them', 'It means nobody needs training', 'It stops all attacks', 'It removes the need for IT'], answer: 0, explain: 'Early reporting limits damage.' },
      { id: 'q4', q: 'Which detail is most useful to include when reporting?', options: ['Your favourite colour', 'What you clicked or entered, and when', 'The weather', 'How long you have worked there'], answer: 1, explain: 'Specific actions and times help IT respond quickly.' },
      { id: 'q5', q: 'You entered your password on a fake page one minute ago. What now?', options: ['Wait until your next day at work', 'Report it right away and change the password as IT directs', 'Change it next month', 'Tell nobody'], answer: 1, explain: 'Quick action can stop the attacker before they use the password.' },
    ],
  },
];
