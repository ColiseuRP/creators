import { errorResponse, okResponse, requireApiActor } from "@/lib/api";
import { publishCreatorFormPanel } from "@/lib/creator-form-admin";

export async function POST() {
  try {
    const { actor, response } = await requireApiActor([
      "admin_general",
      "responsavel_creators",
    ]);

    if (response || !actor) {
      return response;
    }

    const result = await publishCreatorFormPanel();
    return okResponse(result, result.success ? 201 : 200);
  } catch (error) {
    return errorResponse(error, 400);
  }
}
