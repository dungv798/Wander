import { ApiError } from '../../../shared/api/ApiError.ts';
import { CLIENT_ERROR } from '../../../shared/api/http.const.ts';
import { RATING } from '../model/rating.const.ts';
import type { MyRating, PlaceRating, RatingComment } from '../model/rating.types.ts';

type Body = Record<string, unknown>;

/** Whether it is a plain object. */
function isRecord(v: unknown): v is Body {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** A valid score: an integer 1-5. */
function isStars(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= RATING.MAX_STARS;
}

/** A broken response => an internal error (the UI never uses wrongly shaped data). */
function broken(): never {
  throw new ApiError(CLIENT_ERROR.INTERNAL);
}

/** Reads the viewer's own score; missing => null. */
function toMine(v: unknown): MyRating | null {
  if (v === null || v === undefined) return null;
  if (!isRecord(v) || !isStars(v['stars']) || typeof v['updatedAt'] !== 'string') return broken();
  const comment = v['comment'];
  if (comment !== null && comment !== undefined && typeof comment !== 'string') return broken();
  return { stars: v['stars'], comment: comment ?? null, updatedAt: v['updatedAt'] };
}

/** Reads one comment. */
function toComment(v: unknown): RatingComment {
  if (!isRecord(v) || typeof v['id'] !== 'string' || !isStars(v['stars']) || typeof v['comment'] !== 'string'
    || typeof v['updatedAt'] !== 'string' || typeof v['mine'] !== 'boolean') return broken();
  return { id: v['id'], stars: v['stars'], comment: v['comment'], updatedAt: v['updatedAt'], mine: v['mine'] };
}

/** Turns the response `{rating:{summary,mine,comments}}` into `PlaceRating`; a wrong shape => `ApiError('INTERNAL')`. */
export function toPlaceRating(body: unknown): PlaceRating {
  const rating = isRecord(body) ? body['rating'] : undefined;
  if (!isRecord(rating) || !isRecord(rating['summary']) || !Array.isArray(rating['comments'])) return broken();
  const { average, count } = rating['summary'];
  if ((average !== null && typeof average !== 'number') || typeof count !== 'number' || count < 0) return broken();
  return { summary: { average: average ?? null, count }, mine: toMine(rating['mine']), comments: rating['comments'].map(toComment) };
}
