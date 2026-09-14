/**
 * 아직 채우지 않은 레이어.
 * 레이아웃은 획득 탭과 동일하고 분해 축만 바뀌므로, 화면 골격은 재사용된다.
 */
export default function Stub() {
  return (
    <div className="canvas">
      <div className="card stub">
        <h3>준비 중</h3>
        <p>
          <b>획득</b> 탭과 동일한 3단 구조(메인 지표 → 서브 지표 → 분해)로 확장됩니다. 레이아웃은
          그대로 두고 <b>분해 축만</b> 해당 레이어에 맞게 교체합니다.
        </p>
      </div>
    </div>
  );
}
