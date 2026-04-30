import { errorResponse, okResponse, requireApiActor } from "@/lib/api";
import { uploadMetricAttachment } from "@/lib/workflows";

export async function POST(request: Request) {
  try {
    const { actor, response } = await requireApiActor(["creator"]);

    if (response || !actor) {
      return response;
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new Error("Nenhum arquivo válido foi enviado.");
    }

    const result = await uploadMetricAttachment(actor, file);

    return okResponse(result, 201);
  } catch (error) {
    return errorResponse(error, 400);
  }
}
