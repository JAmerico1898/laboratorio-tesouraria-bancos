import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";

const execFileAsync = promisify(execFile);

const SCRIPT = path.join(process.cwd(), "api", "_run_di1.py");

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");
  if (!date) {
    return NextResponse.json({ error: "date parameter required" }, { status: 400 });
  }

  try {
    const { stdout, stderr } = await execFileAsync("python", [SCRIPT, date], {
      timeout: 30000,
    });
    if (stderr) console.error("di1 stderr:", stderr);
    const data = JSON.parse(stdout);
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
