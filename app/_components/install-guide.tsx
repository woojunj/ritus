"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { InstallReminder } from "./install-reminder";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

type InstallPrompt = Event & { prompt: () => Promise<{ outcome: "accepted" | "dismissed" }> };
const DISMISSED_KEY = "ritus:install-guide-dismissed";
const STORAGE_NOTICE_KEY = "ritus:storage-notice-confirmed:v1";
const WEEK = 7 * 24 * 60 * 60 * 1000;

export function InstallGuide({ inline = false }: { inline?: boolean }) {
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [device, setDevice] = useState<"apple" | "android" | "desktop">("desktop");
  const [canInstall, setCanInstall] = useState(false);
  const [storageNotice, setStorageNotice] = useState(false);
  const [storageDetails, setStorageDetails] = useState(false);
  const [reminding, setReminding] = useState(false);
  const endReminder = useCallback(() => setReminding(false), []);
  const prompt = useRef<InstallPrompt | null>(null);

  useEffect(() => {
    const media = matchMedia("(display-mode: standalone)");
    const standalone = () => media.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    const frame = requestAnimationFrame(() => {
      setInstalled(standalone());
      setDevice(/iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) ? "apple" : /Android/.test(navigator.userAgent) ? "android" : "desktop");
      let dismissed = false;
      try { dismissed = Date.now() - Number(localStorage.getItem(DISMISSED_KEY)) < WEEK; } catch { /* 저장 불가 시 현재 화면에서만 닫는다. */ }
      setVisible(!standalone() && (process.env.NODE_ENV === "development" || !dismissed));
      let confirmed = false;
      try { confirmed = localStorage.getItem(STORAGE_NOTICE_KEY) === "yes"; } catch { /* 현재 화면에서만 확인 상태를 유지한다. */ }
      setStorageNotice(process.env.NODE_ENV === "development" || !confirmed);
    });
    const capture = (event: Event) => { event.preventDefault(); prompt.current = event as InstallPrompt; setCanInstall(true); };
    const finish = () => { setInstalled(true); setVisible(false); setOpen(false); prompt.current = null; setCanInstall(false); };
    const change = () => { if (standalone()) finish(); };
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", finish);
    media.addEventListener("change", change);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("beforeinstallprompt", capture); window.removeEventListener("appinstalled", finish); media.removeEventListener("change", change); };
  }, []);

  function dismiss() {
    setVisible(false);
    try { localStorage.setItem(DISMISSED_KEY, String(Date.now())); } catch { /* 현재 화면에서는 닫는다. */ }
  }

  function confirmStorage() {
    setStorageNotice(false);
    setStorageDetails(false);
    try { localStorage.setItem(STORAGE_NOTICE_KEY, "yes"); } catch { /* 현재 화면에서만 확인 상태를 유지한다. */ }
  }

  async function install() {
    const event = prompt.current;
    if (!event) { setOpen(true); return; }
    prompt.current = null;
    setCanInstall(false);
    try {
      const result = await event.prompt();
      if (result.outcome === "accepted") { setVisible(false); setOpen(false); }
    } catch { setOpen(true); }
  }

  return <>
    {reminding && <InstallReminder onDone={endReminder} />}
    {!inline && storageNotice && <aside aria-label="저장 위치 안내" className="flex shrink-0 flex-col gap-2 border-t bg-muted px-4 py-3 text-sm">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-2">
        <p className="font-semibold">쓴 내용은 지금 브라우저에만 저장돼요.</p>
        <p className="text-muted-foreground">카카오톡 등 앱 안에서 열었다면, 글을 쓰기 전에 기본 브라우저에서 여는 것을 권합니다. 다른 브라우저에서는 글이 보이지 않을 수 있습니다.</p>
        <div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={() => setStorageDetails(true)}>자세히</Button><Button size="sm" onClick={confirmStorage}>확인</Button></div>
      </div>
    </aside>}
    <AlertDialog open={storageDetails} onOpenChange={setStorageDetails}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>쓴 내용이 저장되는 곳</AlertDialogTitle><AlertDialogDescription>쓴 글과 할 일은 지금 사용 중인 브라우저에 저장됩니다. 다른 브라우저나 설치한 앱에 자동으로 옮겨지지 않을 수 있습니다.</AlertDialogDescription></AlertDialogHeader>
        <div className="flex flex-col gap-3 text-sm leading-relaxed">
          <p>카카오톡 등 앱 안의 브라우저에서는 백업 파일 다운로드도 제한될 수 있습니다. 가능하면 글을 쓰기 전에 기기의 기본 브라우저에서 열어 주세요.</p>
          <p>다운로드가 가능하면 ‘전체 백업 → 전체 저장’으로 파일을 받고, 옮길 브라우저나 설치한 앱에서 ‘전체 백업 → 불러오기’로 복원합니다. 불러오기는 그곳의 현재 내용을 백업 내용으로 바꿉니다.</p>
          <p>다운로드가 어려우면 ‘전체 백업 → 클립보드에 복사’를 누르고, 옮길 브라우저에서 ‘전체 백업 → 붙여넣기’를 사용하세요. 자동 복사·붙여넣기가 막히면 창 안의 글을 직접 선택해 복사하거나 붙여넣을 수 있습니다. 옮긴 내용을 확인할 때까지 원래 브라우저의 자료를 지우지 마세요.</p>
        </div>
        <AlertDialogFooter><AlertDialogCancel>닫기</AlertDialogCancel><Button onClick={confirmStorage}>확인</Button></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    {inline ? <Button variant="outline" onClick={() => setOpen(true)}><Download aria-hidden="true" />앱 설치 안내</Button> : !storageNotice && visible && <aside aria-label="앱 설치 안내" className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-t bg-muted px-3 py-2 text-sm">
      <p>ritus를 앱으로 설치해 보세요.</p>
      <Button variant={canInstall ? "default" : "outline"} size="sm" onClick={canInstall ? install : () => setOpen(true)}>{canInstall ? "앱 설치" : "설치 안내"}</Button>
      <Button variant="ghost" size="sm" onClick={() => { dismiss(); setReminding(true); }}>나중에</Button>
      <Button variant="ghost" size="icon-sm" aria-label="설치 안내 닫기" onClick={dismiss}><X aria-hidden="true" /></Button>
    </aside>}
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ritus 앱 설치하기</AlertDialogTitle>
          <AlertDialogDescription>홈 화면이나 앱 목록의 아이콘으로 바로 열 수 있습니다. 설치하지 않아도 지금처럼 사용할 수 있습니다.</AlertDialogDescription>
        </AlertDialogHeader>
        {installed ? <p className="text-sm">지금 설치된 앱으로 실행 중입니다.</p> : <div className="flex flex-col gap-3 text-sm leading-relaxed">
          <p>{device === "apple" ? "브라우저의 공유 버튼을 누르고 ‘홈 화면에 추가’를 선택하세요. 항목이 보이지 않으면 Safari에서 열어 주세요." : device === "android" ? "Chrome 메뉴에서 ‘앱 설치’ 또는 ‘홈 화면에 추가’를 선택하세요. 메뉴 이름은 브라우저에 따라 다를 수 있습니다." : "Chrome·Edge 주소창의 설치 아이콘이나 브라우저 메뉴에서 ‘앱 설치’를 선택하세요. 설치 항목이 없으면 Chrome 또는 Edge에서 열어 주세요."}</p>
          {device === "apple" && <p>기존 글이 설치한 앱에 보이지 않으면 브라우저에서 전체 백업한 뒤 설치한 앱에서 불러오세요.</p>}
          <p className="text-muted-foreground">쓴 내용은 현재 브라우저에 저장됩니다. 카카오톡 등 앱 안의 브라우저에서 쓴 글은 다른 브라우저나 설치한 앱에서 보이지 않을 수 있고, 백업 파일 다운로드도 제한될 수 있습니다. 가능하면 글을 쓰기 전에 기기의 기본 브라우저에서 열어 주세요.</p>
        </div>}
        <AlertDialogFooter>
          <AlertDialogCancel>닫기</AlertDialogCancel>
          {!installed && canInstall && <Button onClick={install}>설치하기</Button>}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>;
}
