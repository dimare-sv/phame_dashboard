import Card from "@/components/Card";
import type { Leaderboard } from "@/lib/data/types";

/**
 * TOP10 랭킹. 분해 도넛의 "카테고리별 비중"과 달리 개별 대상(마스터 한 명 한 명)을
 * 짚어서 보여준다 — "누가" 문제인지 바로 액션으로 이어지게 하는 것이 목적.
 */
export default function LeaderboardCard({ board }: { board: Leaderboard }) {
  return (
    <Card title={board.title} note={board.note} fixedChip={board.fixedChip}>
      <div className="lb-wrap">
        {board.rows.map((r) => (
          <div className="lb-row" key={r.rank}>
            <span className={`lb-rank${r.rank <= 3 ? " top" : ""}`}>{r.rank}</span>
            <span className="lb-name">
              {r.name}
              {r.sub && <span className="lb-sub">{r.sub}</span>}
            </span>
            <span className="lb-bar">
              <i
                className={board.tone === "warn" ? "warn" : ""}
                style={{ width: `${Math.max(r.raw * 100, 2).toFixed(1)}%` }}
              />
            </span>
            <span className="lb-val num">{r.value}</span>
          </div>
        ))}
        {board.footnote && (
          <p className="mv-note" dangerouslySetInnerHTML={{ __html: board.footnote }} />
        )}
      </div>
    </Card>
  );
}
