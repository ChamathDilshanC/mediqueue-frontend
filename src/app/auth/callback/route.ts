import { type NextRequest } from "next/server";
import { finishGoogle } from "@/lib/oauth-server";
export function GET(request: NextRequest) {
  return finishGoogle(request);
}
