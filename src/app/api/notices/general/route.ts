import { errorResponse, okResponse, requireApiActor } from "@/lib/api";
import { generalNoticeSchema } from "@/lib/validation";
import { createNotice } from "@/lib/workflows";

export async function POST(request: Request) {
  try {
    const { actor, response } = await requireApiActor([
      "admin_general",
      "responsavel_creators",
    ]);

    if (response || !actor) {
      return response;
    }

    const payload = generalNoticeSchema.parse(await request.json());
    const result = await createNotice(actor, {
      title: payload.title,
      message: payload.message,
      type: payload.type,
      targetType: payload.targetType,
      targetCategory: payload.targetType === "category" ? payload.targetCategory : null,
      sendToDiscord: payload.sendToDiscord,
    });

    return okResponse(result, 201);
  } catch (error) {
    return errorResponse(error, 400);
  }
}
