"use client";

import { useRef, useState, type ReactNode } from "react";
import { captureElement } from "@/lib/capture";

interface Props {
  title: string;
  /** 제목 옆 회색 부연 — 기간·모수 같은 것 */
  note?: ReactNode;
  /** 기간 필터를 따르지 않는 카드에 붙이는 칩 */
  fixedChip?: string;
  /** 헤더 없이 본문만 쓰는 경우 */
  bare?: boolean;
  className?: string;
  children: ReactNode;
  /** 이미지 저장 파일명에 쓰일 이름 (기본값: title) */
  captureName?: string;
}

/**
 * 카드 하나 = 이미지 저장 한 단위.
 * 헤더 우측의 ↓ 가 그 카드만 잘라서 PNG 로 떨군다.
 */
export default function Card({
  title,
  note,
  fixedChip,
  bare,
  className,
  children,
  captureName,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!ref.current) return;
    setBusy(true);
    try {
      await captureElement(ref.current, captureName ?? title);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`card${className ? ` ${className}` : ""}`} ref={ref}>
      {/* 헤더가 없는 카드도 저장 단위는 카드다 — 버튼만 모서리에 띄운다 */}
      {bare && (
        <span className="bare-act" data-capture="exclude">
          <button
            className="icon-btn"
            type="button"
            title="이미지로 저장"
            onClick={save}
            disabled={busy}
          >
            ↓
          </button>
        </span>
      )}
      {!bare && (
        <div className="card-hd">
          <h2>{title}</h2>
          {note && <span className="note">{note}</span>}
          {fixedChip && (
            <span
              className="fixed-chip"
              title="이 카드는 상단 기간 필터를 따르지 않습니다"
            >
              {fixedChip}
            </span>
          )}
          <span className="act" data-capture="exclude">
            <button
              className="icon-btn"
              type="button"
              title="이미지로 저장"
              onClick={save}
              disabled={busy}
            >
              ↓
            </button>
          </span>
        </div>
      )}
      {children}
    </div>
  );
}
