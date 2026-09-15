"use client";

import { useTooltip } from "@/components/Tooltip";
import { findMetric } from "@/lib/metrics/dictionary";

/**
 * 제목 옆의 (i) — 마우스를 올리면 지표 사전의 정의·계산식을 말풍선으로 보여준다.
 *
 * metricId 가 없거나 사전에 없는 지표는 조용히 아무것도 렌더링하지 않는다.
 * 잘못 짚느니 안 다는 게 낫다 — 특히 서브 지표는 이름 매칭으로 자동으로 붙은
 * 것도 있어서(findMetricByName), 확실하지 않으면 애초에 metricId 가 비어 있다.
 */
export default function InfoTip({ metricId }: { metricId?: string }) {
  const { show, hide } = useTooltip();
  if (!metricId) return null;

  const def = findMetric(metricId);
  if (!def) return null;

  const content = (
    <>
      <div className="ti-name">{def.name}</div>
      <div className="ti-def">{def.definition}</div>
      <div className="ti-calc">{def.calc}</div>
    </>
  );

  return (
    <i
      className="info-tip"
      role="img"
      aria-label={`${def.name} 정의: ${def.definition}`}
      tabIndex={0}
      onClick={(ev) => {
        /* 개요 타일처럼 아이콘이 링크 안에 있을 수도 있다 — 아이콘을 눌러 탭 이동이
           일어나면 정의를 읽으려던 것이 아니라 실수로 화면이 바뀐 것처럼 느껴진다 */
        ev.preventDefault();
        ev.stopPropagation();
      }}
      onMouseEnter={(ev) => show(content, ev, { wide: true })}
      onMouseMove={(ev) => show(content, ev, { wide: true })}
      onMouseLeave={hide}
      onFocus={(ev) =>
        show(content, { clientX: ev.currentTarget.getBoundingClientRect().right, clientY: ev.currentTarget.getBoundingClientRect().top }, { wide: true })
      }
      onBlur={hide}
    >
      i
    </i>
  );
}
