import { errorResponse, okResponse, requireApiActor } from "@/lib/api";
import { reviewCreatorApplication } from "@/lib/creator-application-workflows";

interface ApproveApplicationRouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  _request: Request,
  { params }: ApproveApplicationRouteContext,
) {
  try {
    const { actor, response } = await requireApiActor([
      "admin_general",
      "responsavel_creators",
    ]);

    if (response || !actor) {
      return response;
    }

    const { id } = await params;
    const result = await reviewCreatorApplication(actor, {
      applicationId: id,
      decision: "approved",
    });

    return okResponse(result);
  } catch (error) {
    return errorResponse(error, 400);
  }
}
