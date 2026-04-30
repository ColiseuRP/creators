import { errorResponse, okResponse, requireApiActor } from "@/lib/api";
import { discordMessageSchema } from "@/lib/validation";
import { sendManualDiscordMessage } from "@/lib/workflows";

export async function POST(request: Request) {
  try {
    const { actor, response } = await requireApiActor([
      "admin_general",
      "responsavel_creators",
    ]);

    if (response || !actor) {
      return response;
    }

    const payload = discordMessageSchema.parse(await request.json());
    const result = await sendManualDiscordMessage(actor, payload);

    return okResponse(result, 201);
  } catch (error) {
    return errorResponse(error, 400);
  }
}
