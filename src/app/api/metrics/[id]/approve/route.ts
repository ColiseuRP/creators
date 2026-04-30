import { errorResponse, okResponse, requireApiActor } from "@/lib/api";
import { metricReviewSchema } from "@/lib/validation";
import { reviewMetric } from "@/lib/workflows";

interface ApproveRouteProps {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: ApproveRouteProps) {
  try {
    const { actor, response } = await requireApiActor([
      "admin_general",
      "responsavel_creators",
    ]);

    if (response || !actor) {
      return response;
    }

    const { id } = await params;
    const payload = metricReviewSchema.parse(await request.json());
    const result = await reviewMetric(actor, {
      metricId: id,
      decision: "approved",
      reason: payload.reason,
    });

    return okResponse(result);
  } catch (error) {
    return errorResponse(error, 400);
  }
}
