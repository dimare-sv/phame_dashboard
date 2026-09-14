"use client";

import { toPng } from "html-to-image";

/**
 * 화면 일부를 PNG 로 내려받는다.
 *
 * 기획팀이 어드민에 들어가지 않고 대시보드만 보고 문서에 붙일 수 있어야 한다는 요구라,
 * 카드 단위 / 화면 전체 두 단위로 저장한다.
 */
export async function captureElement(el: HTMLElement, name: string) {
  /* 캡처 중에는 호버 툴팁이 같이 찍히면 안 된다 */
  document.querySelector(".tip")?.classList.remove("show");

  const bg = getComputedStyle(document.body).getPropertyValue("--ground").trim() || "#EFF3F8";

  const url = await toPng(el, {
    pixelRatio: 2,
    backgroundColor: bg,
    /* 저장 버튼 자신은 이미지에 들어가지 않게 */
    filter: (node) =>
      !(node instanceof HTMLElement && node.dataset.capture === "exclude"),
  });

  const stamp = new Date().toISOString().slice(0, 10);
  const a = document.createElement("a");
  a.href = url;
  a.download = `파메대시보드_${name}_${stamp}.png`;
  a.click();
}
