import Card from "@/components/Card";
import type { ExtraTable } from "@/lib/data/types";

/**
 * 레이어마다 하나씩 붙는 고유 표.
 * 분해 도넛이 "얼마나"를 말한다면, 이 표는 "그래서 어디가 막혔나"를 말한다.
 */
export default function ExtraTableCard({ table }: { table: ExtraTable }) {
  return (
    <Card title={table.title} note={table.note} captureName={table.title}>
      <div className="mv-wrap">
        <table className="mv">
          <thead>
            <tr>
              {table.columns.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((r) => (
              <tr key={r.cells.c0}>
                {table.columns.map((c) => (
                  <td
                    key={c.key}
                    className={`${c.left ? "" : "num"}${r.hot?.includes(c.key) ? " hot" : ""}`}
                  >
                    {r.cells[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {table.total && (
            <tfoot>
              <tr>
                {table.columns.map((c) => (
                  <td key={c.key} className={c.left ? "" : "num"}>
                    {table.total![c.key]}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
        {table.footnote && (
          <p className="mv-note" dangerouslySetInnerHTML={{ __html: table.footnote }} />
        )}
      </div>
    </Card>
  );
}
