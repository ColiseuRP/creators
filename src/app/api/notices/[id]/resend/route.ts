import { errorResponse, okResponse, requireApiActor } from "@/lib/api";
import { resendNoticeToDiscord } from "@/lib/workflows";

interface NoticeResendRouteProps {
  params: Promise<{ id: string }>;
}

export async function POST(_: Request, { params }: NoticeResendRouteProps) {
  try {
    const { actor, response } = await requireApiActor([
      "admin_general",
      "responsavel_creators",
    ]);

    if (response || !actor) {
      return response;
    }

    const { id } = await params;
    const result = await resendNoticeToDiscord(actor, id);

    return okResponse(result, 200);
  } catch (error) {
    return errorResponse(error, 400);
  }
}
