import { errorResponse, okResponse, requireApiActor } from "@/lib/api";
import { reviewCreatorApplication } from "@/lib/creator-application-workflows";
import { creatorApplicationRejectSchema } from "@/lib/validation";

interface RejectApplicationRouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  request: Request,
  { params }: RejectApplicationRouteContext,
) {
  try {
    const { actor, response } = await requireApiActor([
      "admin_general",
      "responsavel_creators",
    ]);

    if (response || !actor) {
      return response;
    }

    const payload = creatorApplicationRejectSchema.parse(await request.json());
    const { id } = await params;
    const result = await reviewCreatorApplication(actor, {
      applicationId: id,
      decision: "rejected",
      rejectionReason: payload.rejectionReason,
    });

    return okResponse(result);
  } catch (error) {
    return errorResponse(error, 400);
  }
}
