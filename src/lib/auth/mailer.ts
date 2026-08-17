import nodemailer from "nodemailer";

interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

let transporter: ReturnType<typeof nodemailer.createTransport> | null | undefined;

function getTransporter() {
  if (transporter !== undefined) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT) {
    transporter = null;
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
  return transporter;
}

/**
 * Sends transactional email (verification, password reset). When SMTP
 * isn't configured — e.g. a fresh local or Dokploy deploy before mail is
 * wired up — the message is logged to the server console instead of
 * silently failing, so the auth flow stays testable end to end.
 */
export async function sendMail(input: SendMailInput): Promise<void> {
  const client = getTransporter();

  if (!client) {
    console.log(`\n[pryvex mailer] SMTP not configured — logging email instead of sending.\nTo: ${input.to}\nSubject: ${input.subject}\n${input.text}\n`);
    return;
  }

  await client.sendMail({
    from: process.env.SMTP_FROM || "Pryvex <no-reply@pryvex.local>",
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
}
