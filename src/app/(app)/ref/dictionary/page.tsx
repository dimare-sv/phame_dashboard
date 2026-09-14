"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Band from "@/components/Band";
import Card from "@/components/Card";
import {
  ALL_METRICS,
  DIRECTION_LABEL,
  METRIC_LAYERS,
  STATUS_LABEL,
  countByStatus,
  type MetricStatus,
} from "@/lib/metrics/dictionary";

const STATUS_ORDER: MetricStatus[] = ["ga4", "db", "api", "none"];

const STATUS_NOTE: Record<MetricStatus, string> = {
  ga4: "GA4에 이벤트가 이미 있어 바로 조회됩니다",
  db: "DB 쿼리·집계 테이블이 필요합니다",
  api: "외부 서비스 연동이 필요합니다 (Crashlytics · 채널톡 · PG)",
  none: "지금은 수집 자체가 안 됩니다 — 개발 조치 후에야 값이 생깁니다",
};

export default function DictionaryPage() {
  const [status, setStatus] = useState<MetricStatus | "all">("all");
  const [layer, setLayer] = useState<string>("all");
  const [q, setQ] = useState("");

  const counts = useMemo(() => countByStatus(), []);
  const query = q.trim().toLowerCase();

  const groups = useMemo(
    () =>
      METRIC_LAYERS.map((l) => ({
        ...l,
        metrics: l.metrics.filter((m) => {
          if (status !== "all" && m.status !== status) return false;
          if (layer !== "all" && l.slug !== layer) return false;
          if (!query) return true;
          return `${m.id} ${m.name} ${m.definition} ${m.calc} ${m.source}`
            .toLowerCase()
            .includes(query);
        }),
      })).filter((l) => l.metrics.length > 0),
    [status, layer, query],
  );

  const shown = groups.reduce((a, l) => a + l.metrics.length, 0);
  const mixed = ALL_METRICS.filter((m) => m.direction === "mixed");

  return (
    <div className="canvas">
      <Band
        label="수집 현황"
        hint={`전체 ${ALL_METRICS.length}개 · 8개 레이어`}
      />

      <div className="dict-stats">
        {STATUS_ORDER.map((s) => (
          <button
            key={s}
            type="button"
            className={`dict-stat s-${s}`}
            aria-pressed={status === s}
            onClick={() => setStatus(status === s ? "all" : s)}
          >
            <span className="n num">{counts[s]}</span>
            <span className="l">{STATUS_LABEL[s]}</span>
            <span className="d">{STATUS_NOTE[s]}</span>
          </button>
        ))}
      </div>

      <Band label="지표 목록" hint={`${shown}개 표시 중`} />

      <Card title="" bare captureName="지표사전">
        <div className="dict-bar">
          <input
            className="dict-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="지표명 · 이벤트명 · id 검색 (예: retention, purchase, acq-01)"
            aria-label="지표 검색"
          />
          <div className="dict-chips">
            <button
              type="button"
              className="bd-chip"
              aria-pressed={layer === "all"}
              onClick={() => setLayer("all")}
            >
              전체
            </button>
            {METRIC_LAYERS.map((l) => (
              <button
                key={l.slug}
                type="button"
                className="bd-chip"
                aria-pressed={layer === l.slug}
                onClick={() => setLayer(l.slug)}
              >
                {l.idx} {l.name}
              </button>
            ))}
          </div>
          {(status !== "all" || layer !== "all" || q) && (
            <button
              type="button"
              className="dict-reset"
              onClick={() => {
                setStatus("all");
                setLayer("all");
                setQ("");
              }}
            >
              필터 해제
            </button>
          )}
        </div>

        {shown === 0 && <p className="state">조건에 맞는 지표가 없습니다.</p>}

        {groups.map((l) => (
          <section className="dict-group" key={l.slug}>
            <div className="dict-head">
              <span className="gidx mono">{l.idx}</span>
              <h3>{l.name}</h3>
              <span className="gen mono">{l.en}</span>
              <Link className="gto" href={`/layer/${l.slug}`}>
                이 레이어 보기 →
              </Link>
            </div>
            <p className="dict-q">{l.question}</p>

            <div className="dict-scroll">
              <table className="dict">
                <thead>
                  <tr>
                    <th>지표</th>
                    <th>정의 · 계산식</th>
                    <th>데이터 소스</th>
                    <th>방향</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {l.metrics.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <div className="mname">{m.name}</div>
                        <div className="mid mono">{m.id}</div>
                        {m.segment && m.segment !== "-" && (
                          <div className="mseg">{m.segment}</div>
                        )}
                      </td>
                      <td>
                        <div className="mdef">{m.definition}</div>
                        <div className="mcalc mono">{m.calc}</div>
                      </td>
                      <td className="msrc">{m.source}</td>
                      <td>
                        <span className={`dir dir-${m.direction}`}>
                          {DIRECTION_LABEL[m.direction]}
                        </span>
                      </td>
                      <td>
                        <span className={`pill s-${m.status}`}>{STATUS_LABEL[m.status]}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </Card>

      <Card title="이 사전을 쓸 때" note="읽는 규칙" captureName="사전주의사항">
        <div className="alerts">
          <div className="hl-row">
            <span className="bullet">▸</span>
            <span>
              <b>id는 바뀌지 않습니다.</b> 화면의 카드가 이 id로 정의를 찾아옵니다. 지표가
              추가되면 해당 레이어의 다음 번호를 씁니다 — 기존 번호를 당겨 쓰지 않습니다.
            </span>
          </div>
          <div className="hl-row">
            <span className="bullet">▸</span>
            <span>
              <b>계산식이 정의입니다.</b> 같은 이름의 지표가 팀마다 다르게 계산되는 것을 막는
              것이 이 사전의 목적입니다. 화면의 숫자와 계산식이 다르면 화면이 틀린 것입니다.
            </span>
          </div>
          <div className="hl-row">
            <span className="bullet">▸</span>
            <span>
              <b>방향은 아직 초안입니다.</b> 지표명 기준으로 자동 판정한 뒤 손으로 보정했습니다.
              증감 색이 이 값을 따르므로, 틀린 게 있으면 대시보드가 좋아진 것을 나빠졌다고
              표시합니다. 기획팀 검토가 필요합니다.
            </span>
          </div>
          {mixed.length > 0 && (
            <div className="hl-row">
              <span className="bullet">▸</span>
              <span>
                <b>분리 필요 {mixed.length}건</b> — 한 행에 방향이 반대인 지표가 같이 들어 있어
                카드 색을 자동으로 정할 수 없습니다 ({mixed.map((m) => m.name).join(" · ")}).
              </span>
            </div>
          )}
          <div className="hl-row">
            <span className="bullet">▸</span>
            <span>
              <b>측정 불가 {counts.none}건은 오픈 전 조치 대상입니다.</b> 지금 안 붙이면 그
              기간의 데이터는 나중에 소급할 수 없습니다.
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
