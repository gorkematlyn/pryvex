import { sendMail } from "./mailer";

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const link = `${appUrl()}/auth/verify?token=${token}`;
  await sendMail({
    to: email,
    subject: "Confirm your Pryvex account",
    text: `Confirm your email to finish setting up Pryvex: ${link}\n\nThis link expires in 24 hours.`,
    html: `<p>Confirm your email to finish setting up Pryvex.</p><p><a href="${link}">${link}</a></p><p>This link expires in 24 hours.</p>`,
  });
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const link = `${appUrl()}/reset-password?token=${token}`;
  await sendMail({
    to: email,
    subject: "Reset your Pryvex password",
    text: `Reset your password: ${link}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
    html: `<p>Reset your Pryvex password.</p><p><a href="${link}">${link}</a></p><p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>`,
  });
}
