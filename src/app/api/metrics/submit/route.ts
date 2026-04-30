import { errorResponse, okResponse, requireApiActor } from "@/lib/api";
import { metricSubmissionSchema } from "@/lib/validation";
import { submitMetric } from "@/lib/workflows";

export async function POST(request: Request) {
  try {
    const { actor, response } = await requireApiActor(["creator"]);

    if (response || !actor) {
      return response;
    }

    const payload = metricSubmissionSchema.parse(await request.json());
    const result = await submitMetric(actor, payload);

    return okResponse(result, 201);
  } catch (error) {
    return errorResponse(error, 400);
  }
}
