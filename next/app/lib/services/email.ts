const getEmailServiceToken = async (): Promise<{
  isOk: boolean;
  message: string;
  status?: number;
  accessToken?: string;
}> => {
  const clientId = process.env.EMAIL_SERVICE_CLIENT_ID;
  if (!clientId) {
    return {
      isOk: false,
      message: "Email service client id is not configured.",
    };
  }

  const clientSecret = process.env.EMAIL_SERVICE_CLIENT_SECRET;
  if (!clientSecret) {
    return {
      isOk: false,
      message: "Email service client secret is not configured.",
    };
  }

  const url = process.env.CHES_AUTH_URL;
  if (!url) {
    return {
      isOk: false,
      message: "Email service authentication url is not configured.",
    };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  });

  const responseBody = await response.json();
  return {
    isOk: response.ok,
    message: response.statusText,
    status: response.status,
    accessToken: responseBody?.access_token,
  };
};

export const sendEmail = async (
  recipientEmails: string[],
  subject: string,
  bodyType: "html" | "text",
  body: string,
) => {
  const url = process.env.CHES_EMAIL_URL;
  if (!url) {
    console.error("CHES email url not configured.");
    return false;
  }

  const senderEmail = process.env.SENDER_EMAIL;
  if (!senderEmail) {
    console.error("Sender email not configured.");
    return false;
  }

  const senderName = process.env.SENDER_NAME;
  if (!senderName) {
    console.error("Sender name not configured.");
    return false;
  }

  const emailServiceToken = await getEmailServiceToken();
  if (!emailServiceToken.isOk) {
    console.error(
      "Error in getting email service token:",
      emailServiceToken.message,
    );
    return false;
  }

  const accessToken = emailServiceToken.accessToken;
  if (!accessToken) {
    console.error("Email service token is missing.");
    return false;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      from: `${senderName} <${senderEmail}>`,
      to: ["ZEVRegulationDoNotReply@gov.bc.ca"],
      bcc: recipientEmails,
      subject,
      bodyType,
      body,
      encoding: "utf-8",
    }),
  });

  if (!response.ok) {
    const responseBody = await response.json();
    console.error("Error in sending email:", JSON.stringify(responseBody));
    return false;
  }

  console.log("Send email OK - Subject:", subject);
  return true;
};
