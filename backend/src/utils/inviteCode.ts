import { env } from '../config/env';

export function isValidInviteCode(code: string): boolean {
  return env.teacherInviteCodes.includes(code);
}
