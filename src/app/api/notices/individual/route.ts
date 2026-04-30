import { errorResponse, okResponse, requireApiActor } from "@/lib/api";
import { individualNoticeSchema } from "@/lib/validation";
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

    const payload = individualNoticeSchema.parse(await request.json());
    const result = await createNotice(actor, {
      title: payload.title,
      message: payload.message,
      type: payload.type,
      targetType: "individual",
      targetCreatorId: payload.targetCreatorId,
      sendToDiscord: payload.sendToDiscord,
    });

    return okResponse(result, 201);
  } catch (error) {
    return errorResponse(error, 400);
  }
}
