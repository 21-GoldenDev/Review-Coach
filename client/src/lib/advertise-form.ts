export type AdvertiseFormInput = {
  fullName: string;
  fromEmail: string;
  subject: string;
  body: string;
};

let cachedAccessKey: string | null = null;

async function resolveWeb3FormsAccessKey(): Promise<string> {
  const fromBuild = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY?.trim();
  if (fromBuild) return fromBuild;

  if (cachedAccessKey) return cachedAccessKey;

  const response = await fetch("/api/advertise-config");
  const data = (await response.json().catch(() => ({}))) as {
    accessKey?: string;
    message?: string;
  };
  const accessKey = data.accessKey?.trim();
  if (!response.ok || !accessKey) {
    throw new Error(
      data.message ||
        "Advertise form is not configured (missing VITE_WEB3FORMS_ACCESS_KEY).",
    );
  }
  cachedAccessKey = accessKey;
  return accessKey;
}

/** Web3Forms free tier: submit from the browser only (server-side returns 403). */
export async function submitAdvertiseForm(
  input: AdvertiseFormInput,
): Promise<void> {
  const accessKey = await resolveWeb3FormsAccessKey();

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
