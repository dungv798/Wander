import { VIEW } from '../../../shared/const/routes.const.ts';
import { navigate } from '../../../shared/router/hashRoute.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { EmptyState } from '../../../shared/ui/EmptyState.tsx';
import { useIdentity } from '../hooks/identityContext.ts';
import { IDENTITY_COPY as C } from '../model/identity.copy.ts';
import { expiredBranch } from '../model/identitySnapshot.ts';

/**
 * Màn hết phiên (S19) khi máy chủ không còn nhận phiên của máy này (bị thu hồi từ nơi khác). Hai nhánh theo điều đã biết lần cuối:
 * A còn mã hoặc thiết bị khác → "Mở trên máy này"; B không còn gì để khôi phục → nói thẳng không khôi phục được (D20, D26).
 * Không nêu thời hạn phiên (chưa chốt).
 */
export function ExpiredScreen() {
  const { session, actions } = useIdentity();
  const branch = expiredBranch(session.known);
  /** Quên phiên cũ của máy này rồi đi tới màn khác. */
  const leave = (to: typeof VIEW.RECOVER | typeof VIEW.EXPLORE): void => {
    actions.loseSession();
    navigate(to);
  };
  return (
    <EmptyState
      pageTitle
      role="alert"
      icon="key"
      title={branch === 'A' ? C.expired.title : C.expired.titleB}
      text={branch === 'A' ? C.expired.textA : C.expired.textB}
      actions={
        <>
          {branch === 'A' ? <Button onClick={() => leave(VIEW.RECOVER)}>{C.expired.open}</Button> : null}
          <Button kind={branch === 'A' ? 'ghost' : 'primary'} onClick={() => leave(VIEW.EXPLORE)}>
            {C.expired.home}
          </Button>
        </>
      }
    />
  );
}
