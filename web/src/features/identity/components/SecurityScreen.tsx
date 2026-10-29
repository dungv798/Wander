import { useEffect, useState } from 'react';
import { VIEW } from '../../../shared/const/routes.const.ts';
import { goBack, navigate } from '../../../shared/router/hashRoute.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { EmptyState } from '../../../shared/ui/EmptyState.tsx';
import { IconButton } from '../../../shared/ui/IconButton.tsx';
import { useIdentity } from '../hooks/identityContext.ts';
import { IDENTITY_COPY as C } from '../model/identity.copy.ts';
import { ActivitySection, CodeSection, DevicesSection, PairSection } from './SecuritySections.tsx';

/** Đầu trang Bảo mật: quay lại màn trước, hoặc Khám phá khi mở URL trực tiếp. */
function SecurityHead() {
  return (
    <div className="pagehead pad-x">
      <div>
        <IconButton icon="chevron-left" label={C.security.back} onClick={goBack} />
      </div>
      <p className="note">{C.security.eyebrow}</p>
      <h1>{C.security.title}</h1>
      <p className="note">{C.security.lead}</p>
    </div>
  );
}

/** Không nạp được danh tính (mạng): KHÔNG coi là chưa có danh tính; cho thử lại. */
export function RetryState() {
  const { actions } = useIdentity();
  return (
    <>
      <SecurityHead />
      <EmptyState title={C.security.errorTitle} text={C.security.errorText} actions={<Button onClick={() => void actions.refresh()}>{C.security.retry}</Button>} />
    </>
  );
}

/** Màn Bảo mật (S11): trạng thái mã khôi phục, thiết bị tin cậy, hoạt động gần đây, thêm thiết bị mới. Chưa có danh tính thì nói rõ và dẫn đi tiếp. */
export function SecurityScreen() {
  const { status, identity, session, actions } = useIdentity();
  const [hadUnseen, setHadUnseen] = useState(false);
  const [wasRecovered] = useState(() => session.recovered);
  const unseen = identity?.unseen === true;
  const here = identity !== null;
  // Nhớ rằng LẦN MỞ NÀY có hoạt động chưa xem (để hiện hộp nhắc), rồi đánh dấu đã xem ở máy chủ.
  if (unseen && !hadUnseen) setHadUnseen(true);
  useEffect(() => {
    if (unseen) void actions.markSeen().catch(() => undefined);
  }, [unseen, actions]);
  useEffect(() => {
    if (here) actions.ackRecovered();
  }, [here, actions]);
  if (status === 'loading') return <SecurityHead />;
  if (status === 'error') return <RetryState />;
  if (!identity) {
    return (
      <>
        <SecurityHead />
        <EmptyState
          title={C.security.noneTitle}
          text={C.security.noneText}
          actions={
            <>
              <Button onClick={() => navigate(VIEW.EXPLORE)}>{C.security.noneAction}</Button>
              <Button kind="ghost" onClick={() => navigate(VIEW.RECOVER)}>
                {C.recover.title}
              </Button>
            </>
          }
        />
      </>
    );
  }
  return (
    <>
      <SecurityHead />
      <div className="stack pad-x spaced-lg">
        {hadUnseen ? (
          <div className="infobox" role="status">
            <b>{C.security.unseenTitle}</b>
            <p>{C.security.unseenText}</p>
          </div>
        ) : null}
        {wasRecovered ? (
          <div className="infobox" role="status">
            <b>{C.security.recoveredTitle}</b>
            <p>{C.security.recoveredText}</p>
          </div>
        ) : null}
        <CodeSection />
        <DevicesSection identity={identity} />
        <ActivitySection identity={identity} />
        <PairSection />
      </div>
    </>
  );
}
