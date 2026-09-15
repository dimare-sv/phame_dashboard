import Card from "@/components/Card";
import { fmt } from "@/lib/format";
import type { FunnelStage } from "@/lib/data/types";

const STEP_NAMES = ["장바구니 전환", "결제 진입", "결제 완료"];

export default function FunnelCard({
  stages,
  periodLabel,
}: {
  stages: FunnelStage[];
  periodLabel: string;
}) {
  const top = stages[0].value;
  const steps = stages.slice(0, -1).map((s, i) => (stages[i + 1].value / s.value) * 100);
  /* 가장 많이 빠지는 구간 하나만 강조한다 — 전부 칠하면 어디를 볼지 알 수 없다 */
  const worst = steps.indexOf(Math.min(...steps));

  return (
    <Card title="결제 퍼널" note={periodLabel}>
      <div className="funnel">
        {stages.map((s, i) => (
          <div key={s.event}>
            <div className="fn-stage">
              <div className="fn-top">
                <span className="fn-name">{s.name}</span>
                <span className="fn-ev mono">{s.event}</span>
                <span className="fn-val num">{fmt(s.value)}</span>
              </div>
              <div className="fn-bar">
                <i style={{ width: `${((s.value / top) * 100).toFixed(1)}%` }} />
              </div>
            </div>
            {i < stages.length - 1 && (
              <div className={`fn-step${i === worst ? " bad" : ""}`}>
                <span className="arrow">↳</span>
                {STEP_NAMES[i]} <b>{steps[i].toFixed(1)}%</b>
                {i === worst && " · 가장 큰 이탈"}
              </div>
            )}
          </div>
        ))}
        <div className="fn-foot">
          <span>전체 전환율</span>
          <b className="num">{((stages[stages.length - 1].value / top) * 100).toFixed(1)}%</b>
        </div>
      </div>
    </Card>
  );
}
