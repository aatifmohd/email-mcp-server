import "dotenv/config";
import imaps from "imap-simple";
import { simpleParser } from "mailparser";

const config = {
  imap: {
    user: process.env.EMAIL_USER!,
    password: process.env.EMAIL_PASSWORD!,
    host: "imap.gmail.com",
    port: 993,
    tls: true,
    tlsOptions: {
      rejectUnauthorized: false,
    },
    authTimeout: 10000,
  },
};

export async function listRecentEmails(limit: number = 10) {
  const connection = await imaps.connect(config);

  try {
    await connection.openBox("INBOX");

    const messages = await connection.search(["ALL"], {
      bodies: ["HEADER.FIELDS (FROM TO SUBJECT DATE)"],
      markSeen: false,
    });

    const recentMessages = messages
      .sort(
        (a, b) =>
          new Date(b.attributes.date).getTime() -
          new Date(a.attributes.date).getTime()
      )
      .slice(0, limit);

    return recentMessages.map((message) => {
      const header = message.parts.find(
        (part) => part.which.startsWith("HEADER")
      );

      return {
        uid: message.attributes.uid,
        from: header?.body.from?.[0] ?? "",
        to: header?.body.to?.[0] ?? "",
        subject: header?.body.subject?.[0] ?? "",
        date: message.attributes.date,
      };
    });
  } finally {
    connection.end();
  }
}

export async function readEmail(uid: number) {
  const connection = await imaps.connect(config);

  try {
    await connection.openBox("INBOX");

    const messages = await connection.search([["UID", uid]], {
      bodies: [""],
      markSeen: false,
    });

    if (messages.length === 0) {
      throw new Error(`Email with UID ${uid} not found`);
    }

    const message = messages[0];

    const rawEmail = message.parts.find(
      (part) => part.which === ""
    )?.body;

    if (!rawEmail) {
      throw new Error("Could not retrieve email content");
    }

    const parsedEmail = await simpleParser(rawEmail);

    const from = Array.isArray(parsedEmail.from)
      ? parsedEmail.from.map((address) => address.text).join(", ")
      : parsedEmail.from?.text ?? "";

    const to = Array.isArray(parsedEmail.to)
      ? parsedEmail.to.map((address) => address.text).join(", ")
      : parsedEmail.to?.text ?? "";

    return {
      uid: message.attributes.uid,
      from,
      to,
      subject: parsedEmail.subject ?? "",
      date: parsedEmail.date ?? null,
      text: parsedEmail.text ?? "",
    };
  } finally {
    connection.end();
  }
}

export async function summarizeEmail(uid: number) {
  const email = await readEmail(uid);

  const body = email.text.trim();

  if (!body) {
    return {
      uid: email.uid,
      subject: email.subject,
      summary: "No text content was available for this email.",
    };
  }

  const shortenedBody =
    body.length > 500 ? `${body.substring(0, 500)}...` : body;

  return {
    uid: email.uid,
    subject: email.subject,
    summary: shortenedBody,
  };
}