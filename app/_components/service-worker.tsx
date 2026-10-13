"use client";

import { useEffect } from "react";

// 배포된 앱에서만 서비스 워커를 등록한다. 개발 서버에서는 파일이 수시로 바뀌어
// 보관해 둔 화면이 오히려 방해가 된다.
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    void navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch(() => {
        // 등록에 실패해도 온라인에서는 그대로 쓸 수 있다.
      });
  }, []);
  return null;
}
