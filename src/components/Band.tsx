import type { ReactNode } from "react";

/** 섹션 구분 띠. 캔버스를 몇 덩어리로 끊어 읽게 만든다. */
export default function Band({ label, hint }: { label: string; hint?: ReactNode }) {
  return (
    <div className="band">
      <span className="lbl">{label}</span>
      <span className="rule" />
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}
