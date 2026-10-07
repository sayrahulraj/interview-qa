import { isKnownTopic } from '../../config/categories.config';
import { Question } from '../../models/question.model';

export interface ValidationResult {
  errors: string[];
  questions: Question[];
}

const MAX_ERRORS = 40;
const isStr = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const isHttpUrl = (v: string): boolean => {
  try {
    const u = new URL(v);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};

/** Validates an imported questions.json against the schema in the project brief. */
export function validateQuestionsFile(data: unknown): ValidationResult {
  const errors: string[] = [];
  const fail = (m: string) => errors.push(m);

  if (!data || typeof data !== 'object' || !Array.isArray((data as { questions?: unknown }).questions)) {
    return { errors: ['The file must be a JSON object with a "questions" array.'], questions: [] };
  }
  const items = (data as { questions: unknown[] }).questions;
  const ids = new Set<string>();
  for (const it of items) if (it && typeof it === 'object' && isStr((it as Question).id)) ids.add((it as Question).id);

  const seen = new Set<string>();
  items.forEach((raw, i) => {
    if (!raw || typeof raw !== 'object') {
      fail(`Item #${i + 1} is not an object.`);
      return;
    }
    const q = raw as Record<string, unknown>;
    const at = `Question #${i + 1}${isStr(q['id']) ? ` (${q['id']})` : ''}`;

    for (const f of ['id', 'group', 'topic', 'question', 'answer', 'createdAt', 'updatedAt']) {
      if (!isStr(q[f])) fail(`${at}: "${f}" is required and must be a non-empty string.`);
    }
    if (isStr(q['id'])) {
      if (seen.has(q['id'])) fail(`${at}: duplicate id.`);
      seen.add(q['id']);
    }
    if (isStr(q['group']) && isStr(q['topic']) && !isKnownTopic(q['group'], q['topic'])) {
      fail(`${at}: unknown group/topic "${q['group']}" / "${q['topic']}".`);
    }
    for (const f of ['createdAt', 'updatedAt']) {
      if (isStr(q[f]) && Number.isNaN(Date.parse(q[f] as string))) fail(`${at}: "${f}" is not a valid date.`);
    }
    for (const f of ['notes', 'source', 'diagram', 'codeLanguage']) {
      if (q[f] !== undefined && typeof q[f] !== 'string') fail(`${at}: "${f}" must be a string.`);
    }
    if (q['tags'] !== undefined && (!Array.isArray(q['tags']) || !q['tags'].every(isStr))) {
      fail(`${at}: "tags" must be an array of non-empty strings.`);
    }
    if (q['relatedIds'] !== undefined) {
      if (!Array.isArray(q['relatedIds']) || !q['relatedIds'].every(isStr)) fail(`${at}: "relatedIds" must be an array of strings.`);
      else for (const r of q['relatedIds'] as string[]) if (!ids.has(r)) fail(`${at}: relatedIds points to missing id "${r}".`);
    }
    if (q['externalLinks'] !== undefined) {
      if (!Array.isArray(q['externalLinks'])) fail(`${at}: "externalLinks" must be an array.`);
      else (q['externalLinks'] as unknown[]).forEach((l, j) => {
        const link = l as { label?: unknown; url?: unknown };
        if (!link || !isStr(link.label)) fail(`${at}: externalLinks[${j}] needs a label.`);
        if (!link || !isStr(link.url) || !isHttpUrl(link.url)) fail(`${at}: externalLinks[${j}] needs a valid http(s) URL.`);
      });
    }
  });

  const shown = errors.slice(0, MAX_ERRORS);
  if (errors.length > MAX_ERRORS) shown.push(`…and ${errors.length - MAX_ERRORS} more problems.`);
  return { errors: shown, questions: errors.length ? [] : (items as Question[]) };
}
