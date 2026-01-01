"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

const PHRASE = "Agende uma consulta";

function useTyping(text: string, speedMs = 45, enabled = true) {
  const [out, setOut] = useState("");

  useEffect(() => {
    if (!enabled) {
      setOut("");
      return;
    }

    setOut("");
    let i = 0;

    const id = window.setInterval(() => {
      i += 1;
      setOut(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, speedMs);

    return () => window.clearInterval(id);
  }, [text, speedMs, enabled]);

  return out;
}


function Rotator() {
  // Imagem 1 fica mais tempo
  const images = useMemo(
    () => [
      { src: "/rotator/1.png", ms: 6500 },
      { src: "/rotator/2.png", ms: 2600 },
      { src: "/rotator/3.png", ms: 2600 },
      { src: "/rotator/4.png", ms: 2600 },
      { src: "/rotator/5.png", ms: 2600 },
      { src: "/rotator/6.png", ms: 2600 },
      { src: "/rotator/7.png", ms: 2600 },
      { src: "/rotator/8.png", ms: 2600 },
    ],
    []
  );

  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setIdx((v) => (v + 1) % images.length);
    }, images[idx].ms);

    return () => window.clearTimeout(t);
  }, [idx, images]);

  const current = images[idx];

  return (
    <div className="rotator-wrap" aria-label="Galeria de imagens">
      <Image
        key={current.src}
        src={current.src}
        alt="Imagem ilustrativa"
        fill
        priority={idx === 0}
        className="rotator-img fade-in"
        sizes="(max-width: 768px) 80vw, 520px"
      />
    </div>
  );
}

function HandArrow() {
  return (
    <svg className="hand-arrow" viewBox="0 0 620 360" fill="none" aria-hidden>
      <path
        className="hand-arrow-path"
        d="
          M 90 40
          C 140 15, 210 20, 240 70
          C 260 105, 220 130, 185 145
          C 140 165, 155 205, 205 205
          C 265 205, 310 150, 290 110
          C 270 70, 330 60, 370 90
          C 425 130, 405 200, 350 210
          C 300 220, 290 265, 340 285
          C 405 312, 485 280, 520 235
          C 545 205, 560 190, 585 178
        "
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        className="hand-arrow-path"
        d="M565 168 L592 178 L570 200"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


export default function Home() {
  // 1) primeiro declara o state
  const [startTyping, setStartTyping] = useState(false);

  // 2) depois usa ele
  const typed = useTyping(PHRASE, 45, startTyping);

  // 3) e só ativa após alguns segundos
  useEffect(() => {
    const t = window.setTimeout(() => setStartTyping(true), 1400); // 1.4s
    return () => window.clearTimeout(t);
  }, []);

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* FUNDO GLOBAL (atrás de tudo) */}
      <div className="orbs-layer" aria-hidden>
        <div className="orb orb1" />
        <div className="orb orb2" />
        <div className="orb orb3" />
      </div>

      {/* CONTEÚDO (na frente das bolhas) */}
      <div className="relative z-10">
        {/* Topbar */}
        <header className="mx-auto max-w-6xl px-6 pt-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="sticker w-10 h-10 bg-(--periwinkle) grid place-items-center font-bold">
              Ψ
            </div>
            <div>
              <div className="font-semibold">Psi • Maria Laura</div>
              <div className="text-sm opacity-70">psicóloga</div>
            </div>
          </div>

          <Link className="btn btn-secondary lift" href="/login">
            Login
          </Link>
        </header>
      </div>

      {/* Texto + flecha + CTA (só aparece depois do delay) */}
      {startTyping && (
        <section className="cta-typing cta-appear" aria-label="Chamada para agendamento">
          <div className="cta-stage">
            <div className="handwrite">
              {typed}
              <span className="caret" aria-hidden />
            </div>

            <HandArrow />

            <Link className="cta-pill lift" href="/agendar" aria-label="Agendar consulta">
              Agendar
            </Link>
          </div>
        </section>
      )}

      {/* Rotator no canto direito inferior */}
      <div className="rotator-pos">
        <Rotator />
      </div>
    </main>
  );
}

