import { z } from 'zod';

export const TOOLS  = ['엑셀', '종이', '카톡', '이메일', '기존 시스템', '없음'] as const;
export const PEOPLE = ['1~5명', '6~20명', '21~100명', '100명 이상'] as const;
export const REPEAT = ['매일', '매주', '매월', '가끔'] as const;
export const KIND   = ['쓰던 걸 고치기', '새로 만들기', '잘 모르겠어요'] as const;
export const WHEN   = ['아직 정하지 않았어요', '한 달 안', '세 달 안', '올해 안'] as const;
export const BUDGET = ['이야기 나눠 보고', '300만 원 이하', '300~1,000만 원', '1,000만 원 이상'] as const;

export const inquirySchema = z.object({
  work:   z.string().max(500).default(''),                 // 어떤 일을 하고 계세요
  tools:  z.array(z.enum(TOOLS)).max(6).default([]),        // 지금 쓰는 것 (복수, 보기 6개)
  pain:   z.string().trim().min(2, '가장 불편한 점을 적어주세요').max(1000),
  people: z.enum(PEOPLE).optional(),
  repeat: z.enum(REPEAT).optional(),
  kind:   z.enum(KIND).optional(),
  goal:   z.string().max(1000).default(''),                 // 이렇게 됐으면
  when:   z.enum(WHEN).optional(),
  budget: z.enum(BUDGET).optional(),
  email:  z.string().trim().email('연락받을 메일 주소를 적어주세요'),
  phone:  z.string().max(40).default(''),
  project: z.string().max(60).default(''),                  // 상세에서 열었을 때의 slug
  hp_note: z.string().max(200).default(''),                 // 허니팟: 채워져 있으면 봇 (R4 — .max(0)이 아니라 .max(200)).
                                                            // website 같은 이름은 브라우저가 자동 완성해 사람을 봇으로 거른다
  elapsed: z.number().int().nonnegative(),                  // 폼을 연 뒤 지난 ms
});

export type InquiryInput = z.infer<typeof inquirySchema>;
