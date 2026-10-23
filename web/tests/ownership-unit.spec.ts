import { test, expect } from '@playwright/test';
import { normalizeInput } from '../lib/ownership/normalize';

/** 권한 점검 — 화면 없이 도는 계산(입력 다듬기·조회·패턴·판정·저장) */

test.describe('입력 다듬기', () => {
  const ok = (raw: string) => { const r = normalizeInput(raw); if (!r.ok) throw new Error(raw); return r; };
  test('주소 꼴을 도메인으로', () => {
    expect(ok('  https://www.가게.co.kr/menu?x=1 ').display).toBe('가게.co.kr');
    expect(ok('https://www.가게.co.kr/menu?x=1').domain).toBe(new URL('http://가게.co.kr').hostname);
    expect(ok('Shop.COM').domain).toBe('shop.com');
    expect(ok('me@shop.kr').domain).toBe('shop.kr');
    expect(ok('가게.한국').domain).toMatch(/^xn--/);
    expect(ok('http://shop.com:8080/a').domain).toBe('shop.com');
  });
  test('하위 주소는 등록 도메인으로 자르고 원래 호스트를 남긴다', () => {
    expect(ok('shop.가게.co.kr')).toMatchObject({ display: '가게.co.kr', trimmedFrom: 'shop.가게.co.kr' });
    expect(ok('www.example.com').trimmedFrom).toBeNull();          // www 는 알리지 않는다
    expect(ok('blog.example.com').domain).toBe('example.com');
    expect(ok('a.b.example.co.uk').domain).toBe('example.co.uk');
    expect(ok('가게.seoul.kr').display).toBe('가게.seoul.kr');
  });
  test('빌더 기본 주소', () => {
    expect(ok('abc.imweb.me').builderOnly).toBe('imweb');
    expect(ok('mystore.wixsite.com/home').builderOnly).toBe('wix');
    expect(ok('example.com').builderOnly).toBeNull();
  });
  test('틀린 모양', () => {
    expect(normalizeInput('   ')).toEqual({ ok: false, error: 'empty' });
    expect(normalizeInput('abc')).toEqual({ ok: false, error: 'shape' });
    expect(normalizeInput('a b.com')).toEqual({ ok: false, error: 'shape' });
  });
});
