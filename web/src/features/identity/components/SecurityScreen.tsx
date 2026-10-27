import { useEffect, useState } from 'react';
import { VIEW } from '../../../shared/const/routes.const.ts';
import { navigate } from '../../../shared/router/hashRoute.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { EmptyState } from '../../../shared/ui/EmptyState.tsx';
import { IconButton } from '../../../shared/ui/IconButton.tsx';
import { useIdentity } from '../hooks/identityContext.ts';
import { IDENTITY_COPY as C } from '../model/identity.copy.ts';
import { ActivitySection, CodeSection, DemoBox, DevicesSection, PairSection } from './SecuritySections.tsx';

/** Đầu trang Bảo mật: nút quay lại (về danh sách chuyến đi), tiêu đề và lời dẫn. */
function SecurityHead() {
  return (
    <div className="pagehead pad-x">
      <div>
        <IconButton icon="chevron-left" label={C.security.back} onClick={() => navigate(VIEW.TRIPS)} />
      </div>
      <p className="note">{C.security.eyebrow}</p>
      <h1>{C.security.title}</h1>
      <p className="note">{C.security.lead}</p>
    </div>
  );
}

/** Màn Bảo mật (S11): trạng thái mã khôi phục, thiết bị tin cậy, hoạt động gần đây, thêm thiết bị mới. Chưa có danh tính thì nói rõ và dẫn tới khám phá/khôi phục. */
export function SecurityScreen() {
  const { identity, session, actions } = useIdentity();
  const [hadUnseen] = useState(() => Boolean(identity?.unseen));
  const [wasRecovered] = useState(() => session.recovered);
  const here = identity !== null;
  useEffect(() => {
    if (!here) return;
    actions.touch();
    actions.markSeen();
    actions.ackRecovered();
  }, [here, actions]);
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
        <div className="stack pad-x">
          <DemoBox />
        </div>
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
        <DevicesSection identity={identity} deviceId={session.deviceId} />
        <ActivitySection identity={identity} />
        <PairSection />
        <DemoBox />
      </div>
    </>
  );
}
