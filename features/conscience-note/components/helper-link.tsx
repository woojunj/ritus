import { Sparkles } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { HELPER_URL } from "../lib/form";

// 쓰다가 막힐 때 물어볼 수 있는 바깥 도우미. 쓰던 화면이 남도록 새 탭으로 연다.
// 쓴 글은 넘기지 않는다. 보여 줄 글은 쓰는 사람이 직접 복사해 붙여넣는다.
export function HelperLink() {
  return (
    <a
      href={HELPER_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="양심성찰 도우미 열기"
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon" }),
        "text-muted-foreground"
      )}
    >
      <Sparkles aria-hidden="true" />
    </a>
  );
}
