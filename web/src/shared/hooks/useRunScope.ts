import { useEffect, useState } from 'react';
import { RunScope } from '../lib/RunScope.ts';

/** Bộ quản lý lượt chạy gắn với vòng đời thành phần: rời khỏi màn hình thì mọi hoạt họa kể chuyện đang chờ bị hủy sạch. */
export function useRunScope(): RunScope {
  const [scope] = useState(() => new RunScope());
  useEffect(() => () => scope.cancel(), [scope]);
  return scope;
}
