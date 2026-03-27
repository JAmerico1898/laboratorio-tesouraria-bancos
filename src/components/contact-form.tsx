"use client";

import { useState } from "react";
import Link from "next/link";
import { strings } from "@/lib/strings";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message }),
      });

      if (res.ok) {
        setStatus("sent");
        setName("");
        setEmail("");
        setMessage("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20">
      {/* Background orbs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-1/4 -top-1/4 h-1/2 w-1/2 rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-1/3 w-1/3 rounded-full bg-primary-container/5 blur-[100px]" />
      </div>

      <main className="mx-auto max-w-xl px-6">
        {/* Back */}
        <div className="mb-10">
          <Link
            href="/"
            className="flex items-center gap-2 text-primary font-semibold hover:opacity-70 transition-opacity"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
            <span className="text-xs font-bold uppercase tracking-widest">{strings.backToHome}</span>
          </Link>
        </div>

        <h1 className="font-headline text-3xl font-extrabold text-primary mb-2 sm:text-4xl">
          {strings.contactTitle}
        </h1>
        <p className="text-on-surface-variant mb-8">{strings.contactSubtitle}</p>

        {status === "sent" ? (
          <div className="rounded-xl bg-primary/10 border border-primary/20 p-6 text-center">
            <span className="material-symbols-outlined text-4xl text-primary mb-2">check_circle</span>
            <p className="text-lg font-bold text-primary">{strings.contactSent}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Name */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                {strings.contactName}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={strings.contactNamePlaceholder}
                className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                {strings.contactEmail}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={strings.contactEmailPlaceholder}
                className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              />
            </div>

            {/* Message */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                {strings.contactMessage} <span className="text-error">*</span>
              </label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={strings.contactMessagePlaceholder}
                className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors resize-y"
              />
            </div>

            {status === "error" && (
              <div className="rounded-xl bg-error/10 border border-error/20 px-4 py-3 text-sm text-error">
                {strings.contactError}
              </div>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              className="bg-primary text-on-primary rounded-xl px-6 py-3 font-bold text-sm transition-colors hover:bg-primary-container active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {status === "sending" ? strings.contactSending : strings.contactSubmit}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
