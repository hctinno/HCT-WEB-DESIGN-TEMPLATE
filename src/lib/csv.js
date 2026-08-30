/**
 * 최소한의 CSV 파서.
 *
 * 라이브러리를 쓰지 않는 이유: 가져오기 화면 하나 때문에 파서 의존성을
 * 더하는 것은 과합니다. 대신 **어디까지 처리하는지 분명히 밝힙니다** —
 * 능력을 숨긴 파서가 조용히 틀린 값을 만드는 것이 가장 나쁩니다.
 *
 * 처리하는 것:
 *   - 쉼표 구분, 큰따옴표로 감싼 값, 값 안의 `""` 이스케이프
 *   - 따옴표 안의 줄바꿈과 쉼표
 *   - CRLF, 끝에 붙은 빈 줄, UTF-8 BOM
 *
 * 처리하지 않는 것(실제 제품에서 필요하면 papaparse 같은 것으로 교체):
 *   - 세미콜론·탭 등 다른 구분자
 *   - EUC-KR 등 UTF-8 이 아닌 인코딩 (엑셀에서 나온 한글 CSV 가 자주 이렇습니다)
 */
export function parseCsv(text) {
  const src = text.replace(/^﻿/, '')
  const rows = []
  let row = []
  let value = ''
  let quoted = false

  for (let i = 0; i < src.length; i += 1) {
    const c = src[i]

    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') { value += '"'; i += 1 }
        else quoted = false
      } else {
        value += c
      }
      continue
    }

    if (c === '"') { quoted = true; continue }
    if (c === ',') { row.push(value); value = ''; continue }
    if (c === '\r') continue
    if (c === '\n') { row.push(value); rows.push(row); row = []; value = ''; continue }
    value += c
  }

  /* 마지막 줄에 줄바꿈이 없을 수 있습니다 */
  if (value !== '' || row.length > 0) { row.push(value); rows.push(row) }

  /* 끝에 붙은 빈 줄 제거 — 엑셀이 자주 남깁니다 */
  while (rows.length > 0 && rows[rows.length - 1].every((v) => v.trim() === '')) rows.pop()

  return rows
}

/**
 * 첫 줄을 머리글로 보고 { headers, rows } 로 나눕니다.
 *
 * 열 개수가 머리글과 다른 줄은 버리지 않고 `ragged` 로 표시해 넘깁니다.
 * 조용히 버리면 사용자는 왜 100행 중 97행만 들어왔는지 알 수 없습니다.
 */
export function toTable(text) {
  const all = parseCsv(text)
  if (all.length === 0) return { headers: [], rows: [] }

  const headers = all[0].map((h) => h.trim())
  const rows = all.slice(1).map((cells, i) => ({
    /* CSV 파일에서의 실제 줄 번호 — 오류를 이 번호로 말해야 사용자가 찾습니다 */
    line: i + 2,
    cells,
    ragged: cells.length !== headers.length,
  }))
  return { headers, rows }
}
