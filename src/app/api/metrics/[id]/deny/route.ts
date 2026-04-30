import { errorResponse, okResponse, requireApiActor } from "@/lib/api";
import { metricReviewSchema } from "@/lib/validation";
import { reviewMetric } from "@/lib/workflows";

interface DenyRouteProps {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: DenyRouteProps) {
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
      decision: "rejected",
      reason: payload.reason,
    });

    return okResponse(result);
  } catch (error) {
    return errorResponse(error, 400);
  }
}
