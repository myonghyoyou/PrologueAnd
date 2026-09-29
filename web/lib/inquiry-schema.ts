import { z } from 'zod';

export const NEED   = ['쓰던 시스템을 고치고 싶어요', '엑셀·종이로 하던 일을 옮기고 싶어요', '새로 만들고 싶어요', '아직 잘 모르겠어요'] as const;
export const PEOPLE = ['나 혼자', '팀 (2~20명)', '회사 전체 (21명 이상)', '고객·외부 사용자'] as const;
export const WHEN   = ['아직 정하지 않았어요', '한 달 안', '세 달 안', '올해 안'] as const;
export const BUDGET = ['이야기 나눠 보고', '300만 원 이하', '300~1,000만 원', '1,000만 원 이상'] as const;

export const inquirySchema = z.object({
  need:   z.enum(NEED).optional(),                          // 무엇이 필요하세요 (홈 '지금은 어느 쪽인가요?'의 고치기·옮기기·만들기)
  pain:   z.string({ error: '지금 상황을 적어주세요' }).trim().min(2, '지금 상황을 적어주세요').max(1000),   // 지금 상황
  people: z.enum(PEOPLE).optional(),                        // 누가 쓰나요
  goal:   z.string().max(1000).default(''),                 // 이렇게 됐으면
  when:   z.enum(WHEN).optional(),
  budget: z.enum(BUDGET).optional(),
  email:  z.string({ error: '연락받을 메일 주소를 적어주세요' }).trim().email('연락받을 메일 주소를 적어주세요'),
  phone:  z.string().max(40).default(''),
  project: z.string().max(60).default(''),                  // 상세에서 열었을 때의 slug
  hp_note: z.string().max(200).default(''),                 // 허니팟: 채워져 있으면 봇 (R4 — .max(0)이 아니라 .max(200)).
                                                            // website 같은 이름은 브라우저가 자동 완성해 사람을 봇으로 거른다
  elapsed: z.number().int().nonnegative(),                  // 폼을 연 뒤 지난 ms
});

export type InquiryInput = z.infer<typeof inquirySchema>;
