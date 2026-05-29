export type AdvertiseFormInput = {
  fullName: string;
  fromEmail: string;
  subject: string;
  body: string;
};

/** Web3Forms free tier: submit from the browser only (server-side returns 403). */
export async function submitAdvertiseForm(
  input: AdvertiseFormInput,
): Promise<void> {
  const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY?.trim();
  if (!accessKey) {
    throw new Error(
      "Advertise form is not configured (missing VITE_WEB3FORMS_ACCESS_KEY).",
    );
  }

  const response = await fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      access_key: accessKey,
      subject: `[Advertise] ${input.subject}`,
      name: input.fullName,
      email: input.fromEmail,
      message: input.body,
      from_name: input.fullName,
      botcheck: false,
    }),
  });

  const text = await response.text();
  let data: { success?: boolean; message?: string; body?: { message?: string } };
  try {
    data = JSON.parse(text) as typeof data;
  } catch {
    throw new Error(
      "Could not send message. Check your Web3Forms access key and try again.",
    );
  }

  if (!response.ok || !data.success) {
    throw new Error(
      data.message || data.body?.message || "Web3Forms request failed",
    );
  }
}
