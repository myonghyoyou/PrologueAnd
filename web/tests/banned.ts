import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** 공개하지 않는 낱말(회사·업종·실제 지역·실제 인물). 목록은 저장소 밖 — 커밋하지 않는 tests/banned.local.json 에만 둔다.
 *  파일이 없으면 null: 그 검사만 건너뛴다 */
export function bannedWords(): string[] | null {
  const f = join(__dirname, 'banned.local.json');
  if (!existsSync(f)) return null;
  return (JSON.parse(readFileSync(f, 'utf8')) as { words: string[] }).words;
}
