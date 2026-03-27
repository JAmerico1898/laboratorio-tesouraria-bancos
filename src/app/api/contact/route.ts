import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { name, email, message } = await request.json();

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json({ error: "Mensagem é obrigatória." }, { status: 400 });
  }

  const token = process.env.PUSHOVER_TOKEN;
  const user = process.env.PUSHOVER_USER;

  if (!token || !user) {
    return NextResponse.json(
      { error: "Serviço indisponível.", detail: "credentials missing" },
      { status: 500 }
    );
  }

  const lines = [
    "Contato — Tesouraria Lab",
    name ? `Nome: ${name}` : null,
    email ? `Email: ${email}` : null,
    "",
    message.trim(),
  ]
    .filter(Boolean)
    .join("\n");

  const body = new URLSearchParams();
  body.append("token", token);
  body.append("user", user);
  body.append("title", "Tesouraria Lab — Contato");
  body.append("message", lines);

  const res = await fetch("https://api.pushover.net/1/messages.json", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Falha ao enviar mensagem." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
