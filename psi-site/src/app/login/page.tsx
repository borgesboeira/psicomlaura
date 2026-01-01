"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AUTH_COOKIE } from "@/lib/auth";

export default function LoginPage() {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const router = useRouter();

  function entrar() {
    if (senha !== "mudar-depois") {
      setErro("Senha incorreta.");
      return;
    }
    document.cookie = `${AUTH_COOKIE}=1; Path=/; SameSite=Lax`;
    router.push("/app/calendario");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-3xl bg-white sticker p-6">
        <h1 className="font-[var(--font-display)] text-2xl">Login</h1>
        <p className="text-sm text-black/60 mt-2">
          MVP local. Depois trocamos por Firebase Auth.
        </p>

        <label className="block text-sm font-semibold mt-5">Senha</label>
        <input
          className="mt-1 w-full rounded-xl border px-3 py-2"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          type="password"
          placeholder="mudar-depois"
        />

        {erro && <p className="text-sm text-red-600 mt-2">{erro}</p>}

        <button
          className="mt-4 w-full rounded-full bg-[var(--coral)] text-white py-2 font-semibold sticker"
          onClick={entrar}
        >
          Entrar
        </button>

        <button
          className="mt-3 w-full rounded-full border py-2 font-semibold"
          onClick={() => router.push("/")}
        >
          Voltar
        </button>
      </div>
    </main>
  );
}
