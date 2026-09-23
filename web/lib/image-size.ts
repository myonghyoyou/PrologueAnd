import { readFileSync } from 'node:fs';
import path from 'node:path';

/** PNG·JPEG 파일 머리에서 원본 가로·세로를 읽는다(의존성 없이). 다른 형식이면 오류 */
export function imageSize(file: string): { w: number; h: number } {
  const b = readFileSync(file);
  if (b.length > 24 && b.readUInt32BE(0) === 0x89504e47) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i += 1; continue; }
      const m = b[i + 1];
      const sof = m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc;
      if (sof) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  throw new Error(`이미지 크기를 읽을 수 없습니다: ${file}`);
}

/** '/screens/pfh/form.png' → <web>/public/screens/pfh/form.png (빌드·테스트 모두 web/ 에서 돈다) */
export const publicFile = (src: string) => path.join(process.cwd(), 'public', src);
