"use client";

import Link from "next/link";
import Band from "@/components/Band";
import Card from "@/components/Card";
import { useSettings } from "@/lib/settings-context";
import { DEFAULT_GOALS, formatGoalValue, type MetricGoal } from "@/lib/settings";
import { findMetric } from "@/lib/metrics/dictionary";

/* 구분의 실제 의미는 "경고를 띄우는가"다 — 그렇게 부른다 */
const KIND_LABEL: Record<MetricGoal["kind"], string> = {
  target: "목표 (경고 안 함)",
  limit: "경고 기준",
  reference: "참고값",
};

function NumberCell({
  value,
  goal,
  label,
  onChange,
}: {
  value: number | undefined;
  goal: MetricGoal;
  /** 한 행에 칸이 둘이라 지표명만으로는 구분되지 않는다 */
  label: string;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <span className="goal-input">
      <input
        type="number"
        step={goal.decimals === 0 ? 1 : goal.decimals === 2 ? 0.01 : 0.1}
        value={value ?? ""}
        onChange={(e) => {
          const t = e.target.value;
          onChange(t === "" ? undefined : Number(t));
        }}
        aria-label={`${goal.name} ${label}`}
      />
      <span className="u">{goal.unit}</span>
    </span>
  );
}

export default function SettingsPage() {
  const { goals, setGoal, resetGoal, resetAll, changedCount } = useSettings();

  const defaultOf = (id: string) => DEFAULT_GOALS.find((g) => g.metricId === id)!;

  return (
    <div className="canvas">
      <Band
        label="목표 · 임계"
        hint={changedCount ? `기본값에서 ${changedCount}개 변경됨` : "전부 기본값"}
      />

      <div className="notice-inline">
        <b>여기서 바꾸면 개요가 바로 따라갑니다.</b> 타일 하단의 목표 표시, 경고 점, &ldquo;주의
        필요&rdquo; 목록이 전부 이 표에서 계산됩니다.
        <br />
        다만 <b>지금은 이 브라우저에만 저장됩니다</b> — 팀 전체가 같은 목표를 보려면 DB 연동이
        필요합니다. 그 전까지는 각자 조정해 보는 용도로 쓰시면 됩니다.
      </div>

      <Card title="" bare>
        <div className="goal-scroll">
          <table className="goal">
            <thead>
              <tr>
                <th>지표</th>
                <th>구분</th>
                <th>방향</th>
                <th>기준값</th>
                <th>위험선</th>
                <th>기본값</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {goals.map((g) => {
                const def = defaultOf(g.metricId);
                const changed =
                  g.value !== def.value || g.critValue !== def.critValue;
                const dict = findMetric(g.metricId);
                return (
                  <tr key={g.metricId}>
                    <td>
                      <div className="gname">{g.name}</div>
                      <div className="gid mono">
                        {dict ? (
                          <Link href="/ref/dictionary">{g.metricId}</Link>
                        ) : (
                          g.metricId
                        )}
                      </div>
                      {g.layerSlug && (
                        <Link className="glayer" href={`/layer/${g.layerSlug}`}>
                          해당 레이어 →
                        </Link>
                      )}
                    </td>
                    <td>{KIND_LABEL[g.kind]}</td>
                    <td className="gdir">
                      {g.direction === "higher" ? "높을수록 좋음" : "낮을수록 좋음"}
                    </td>

                    {g.kind === "reference" ? (
                      <>
                        <td className="gna" colSpan={2}>
                          비교 대상이 아닙니다 — {g.display} 로 표시만 합니다
                        </td>
                      </>
                    ) : (
                      <>
                        <td>
                          <NumberCell
                            goal={g}
                            label="기준값"
                            value={g.value ?? undefined}
                            onChange={(v) => setGoal(g.metricId, { value: v ?? null })}
                          />
                        </td>
                        <td>
                          <NumberCell
                            goal={g}
                            label="위험선"
                            value={g.critValue}
                            onChange={(v) => setGoal(g.metricId, { critValue: v })}
                          />
                        </td>
                      </>
                    )}

                    <td className="gdef mono">
                      {def.value === null
                        ? "—"
                        : `${formatGoalValue(def.value, def)}${
                            def.critValue !== undefined
                              ? ` / ${formatGoalValue(def.critValue, def)}`
                              : ""
                          }`}
                    </td>
                    <td>
                      {changed && (
                        <button
                          type="button"
                          className="dict-reset"
                          onClick={() => resetGoal(g.metricId)}
                        >
                          되돌리기
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {changedCount > 0 && (
          <div className="goal-foot">
            <span>기본값에서 {changedCount}개 지표가 바뀌어 있습니다.</span>
            <button type="button" className="dict-reset" onClick={resetAll}>
              전부 기본값으로
            </button>
          </div>
        )}
      </Card>

      <Band label="읽는 규칙" />
      <Card title="이 값들을 정할 때" note="판정 방식">
        <div className="alerts">
          <div className="hl-row">
            <span className="bullet">▸</span>
            <span>
              <b>목표와 경고 기준은 다릅니다.</b> <b>목표</b>는 도달하려는 값이라 못 미쳐도 경고하지
              않습니다 — 목표는 늘 앞에 있는 것이라, 미달을 경고로 만들면 경고가 상시 켜지고 그러면
              아무도 안 봅니다. <b>경고 기준</b>은 지금 문제가 있다는 선이라 넘는 즉시 뜹니다.
            </span>
          </div>
          <div className="hl-row">
            <span className="bullet">▸</span>
            <span>
              <b>위험선은 구분과 무관하게 항상 경고합니다.</b> 목표로 둔 지표도 위험선까지
              떨어지면 빨간 점이 붙습니다. 비워두면 그 단계는 뜨지 않습니다.
            </span>
          </div>
          <div className="hl-row">
            <span className="bullet">▸</span>
            <span>
              <b>방향이 판정을 뒤집습니다.</b> 높을수록 좋은 지표는 선 <b>아래로</b> 내려가면
              경고고, 낮을수록 좋은 지표는 선 <b>위로</b> 올라가면 경고입니다. 방향은 지표 사전에서
              옵니다.
            </span>
          </div>
          <div className="hl-row">
            <span className="bullet">▸</span>
            <span>
              <b>기본값은 합의된 숫자가 아닙니다.</b> 제가 업계 통념으로 넣어둔 제안이고, 기획팀이
              정한 값으로 바꿔야 의미가 생깁니다.
            </span>
          </div>
          <div className="hl-row">
            <span className="bullet">▸</span>
            <span>
              <b>목표를 너무 촘촘히 잡으면 경고가 상시로 켜집니다.</b> 경고가 늘 켜져 있으면 아무도
              안 봅니다 — 지금 몇 건이 뜨는지 개요에서 확인하면서 조정하세요.
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
