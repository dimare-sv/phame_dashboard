import type { ReactNode } from "react";

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
}

/**
 * 카드 하나.
 *
 * 이미지 저장은 상단의 "이미지 저장" 하나로만 한다.
 * 카드마다 ↓ 를 달면 화면 어디를 봐도 버튼이 먼저 눈에 들어와서
 * 정작 읽어야 할 숫자가 뒤로 밀린다.
 */
export default function Card({ title, note, fixedChip, bare, className, children }: Props) {
  return (
    <div className={`card${className ? ` ${className}` : ""}`}>
      {!bare && (
        <div className="card-hd">
          <h2>{title}</h2>
          {note && <span className="note">{note}</span>}
          {fixedChip && (
            <span className="fixed-chip" title="이 카드는 상단 기간 필터를 따르지 않습니다">
              {fixedChip}
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
