"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface ShowOptions {
  /** 값 하나짜리 짧은 말풍선이 아니라 줄바꿈이 있는 설명형 내용 — 폭을 넓히고 줄바꿈을 허용한다 */
  wide?: boolean;
}

interface TipState {
  show: (content: ReactNode, ev: { clientX: number; clientY: number }, opts?: ShowOptions) => void;
  hide: () => void;
}

const Ctx = createContext<TipState | null>(null);

export function TooltipProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<ReactNode>(null);
  const [wide, setWide] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const boxRef = useRef<HTMLDivElement>(null);

  const show = useCallback<TipState["show"]>((node, ev, opts) => {
    setContent(node);
    setWide(Boolean(opts?.wide));
    const pad = 16;
    const box = boxRef.current;
    const w = box?.offsetWidth ?? (opts?.wide ? 260 : 180);
    const h = box?.offsetHeight ?? 70;
    let x = ev.clientX + pad;
    let y = ev.clientY - h - 12;
    if (x + w > window.innerWidth - 8) x = ev.clientX - w - pad;
    if (y < 8) y = ev.clientY + pad;
    setPos({ x, y });
  }, []);

  const hide = useCallback(() => setContent(null), []);

  const value = useMemo(() => ({ show, hide }), [show, hide]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div
        ref={boxRef}
        className={`tip${content ? " show" : ""}${wide ? " tip-wide" : ""}`}
        style={{ left: pos.x, top: pos.y }}
        role="status"
        aria-live="polite"
      >
        {content}
      </div>
    </Ctx.Provider>
  );
}

export function useTooltip(): TipState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTooltip 은 TooltipProvider 안에서만 쓸 수 있습니다.");
  return v;
}
