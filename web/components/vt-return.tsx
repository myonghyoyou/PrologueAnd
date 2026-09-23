// 목록이 그려질 때 sessionStorage('vt-slug')가 가리키는 행의 [data-title]에 pj-title을 붙였다가 얼마 뒤 지운다.
// 인라인 스크립트로 두는 이유: 전체 새로고침(하드 네비게이션)에서는 클라이언트 컴포넌트의 useLayoutEffect가
// Next 16 dev 서버(Turbopack HMR 클라이언트 청크의 지연 로드)로 인해 load 이벤트 이후에야 커밋되어,
// 행을 찾아 이름을 붙이기 전에 검증 시점을 놓친다. 파싱 중 곧바로 실행되는 스크립트는 이 지연과 무관하다.
// SPA 전환(뒤로가기)에서도 React 가 매 마운트마다 새 <script> 노드를 만들어 그대로 재실행된다.
const CODE = `(() => {
  function run() {
    try {
      var slug = sessionStorage.getItem('vt-slug');
      if (!slug) return;
      sessionStorage.removeItem('vt-slug');
      var row = document.querySelector('[data-row][data-slug="' + slug + '"] [data-title]');
      if (!row) return;
      row.style.viewTransitionName = 'pj-title';
      setTimeout(function () { row.style.viewTransitionName = ''; }, 300);
    } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();`;

export function VtReturn() {
  // eslint-disable-next-line react/no-danger
  return <script dangerouslySetInnerHTML={{ __html: CODE }} />;
}
