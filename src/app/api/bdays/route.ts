import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";

const execFileAsync = promisify(execFile);

const SCRIPT = path.join(process.cwd(), "api", "_run_bdays.py");

export async function GET(request: NextRequest) {
  const start = request.nextUrl.searchParams.get("start");
  const end = request.nextUrl.searchParams.get("end");
  if (!start || !end) {
    return NextResponse.json({ error: "start and end parameters required" }, { status: 400 });
  }

  try {
    const { stdout, stderr } = await execFileAsync("python", [SCRIPT, start, end], {
      timeout: 15000,
    });
    if (stderr) console.error("bdays stderr:", stderr);
    const data = JSON.parse(stdout);
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
