import { uploadRequestSchema } from "@/lib/schemas";
import { body, route } from "@/server/api";
import { requestUpload } from "@/server/services/gifts";

/**
 * Before a recording is sent: say what it is (audio; at most 3 minutes and
 * 10 MB) and get a short-lived signed URL to PUT it to, in their own folder.
 */
export const POST = route(async ({ request, user, store }) => {
  const input = await body(request, uploadRequestSchema);
  return requestUpload(await store(), user.id, input);
});
