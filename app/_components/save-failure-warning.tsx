"use client";

import { useState, useSyncExternalStore } from "react";
import { CircleAlert, X } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  getSaveFailureSnapshot,
  getSaveFailureServerSnapshot,
  retryFailedSaves,
  subscribeSaveFailures,
} from "@/lib/browser-store";
import { downloadTextFile } from "@/lib/download";

import { backupFile, currentBackup } from "./backup";

export function SaveFailureWarning() {
  const failed = useSyncExternalStore(
    subscribeSaveFailures, getSaveFailureSnapshot, getSaveFailureServerSnapshot
  );
  if (!failed) return null;
  return <SaveFailureDetails />;
}

// 실패가 모두 해결되면 사라지고, 다음 실패 때는 펼친 상태로 새로 나타난다.
function SaveFailureDetails() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return (
      <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-b px-4 py-1 text-sm text-destructive">
        <span role="status">저장되지 않은 변경이 있습니다</span>
        <Button type="button" variant="ghost" size="sm" onClick={() => setDismissed(false)}>
          저장 실패 안내 보기
        </Button>
      </div>
    );
  }

  return (
    <Alert variant="destructive" className="shrink-0 rounded-none">
      <CircleAlert aria-hidden="true" />
      <AlertTitle className="flex items-start justify-between gap-2">
        이 브라우저에 저장하지 못했습니다
        <Button
          type="button" variant="ghost" size="icon-sm"
          aria-label="저장 실패 안내 닫기" title="저장 실패 안내 닫기"
          onClick={() => setDismissed(true)}
        >
          <X aria-hidden="true" />
        </Button>
      </AlertTitle>
      <AlertDescription>
        <p>변경한 내용은 현재 탭에만 남아 있습니다. 새로고침하거나 닫기 전에 파일로 백업해 주세요.</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => downloadTextFile(backupFile(currentBackup()))}>
            파일로 백업
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={retryFailedSaves}>
            다시 저장
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
