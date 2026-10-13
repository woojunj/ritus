"use client";

import { CopyButton } from "@/components/copy-button";

import { helperRequest } from "../lib/copy-text";
import { HelperLink } from "./helper-link";

// 도우미에게 보낼 글을 복사하는 버튼 둘과 도우미 링크. 도움말의 설명 안에 놓인다.
export function HelperRequestCopy() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <CopyButton label="양식 복사" getText={() => helperRequest(false)} />
      <CopyButton label="양식과 신호 판단 복사" getText={() => helperRequest(true)} />
      <HelperLink />
    </div>
  );
}
