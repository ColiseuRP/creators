import { errorResponse, okResponse } from "@/lib/api";
import { creatorApplicationSubmissionSchema } from "@/lib/validation";
import { submitCreatorApplication } from "@/lib/workflows";

export async function POST(request: Request) {
  try {
    const payload = creatorApplicationSubmissionSchema.parse(await request.json());
    const result = await submitCreatorApplication(payload);

    return okResponse(result, 201);
  } catch (error) {
    return errorResponse(error, 400);
  }
}
