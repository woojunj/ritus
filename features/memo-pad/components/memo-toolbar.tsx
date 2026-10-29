import { Eye, List, PencilLine, Save } from "lucide-react";

import { CopyButton } from "@/components/copy-button";
import { DownloadButton } from "@/components/download-button";
import { SaveStatus } from "@/components/save-status";
import { Button } from "@/components/ui/button";
import { UploadButton } from "@/components/upload-button";

import { memoFile } from "../lib/download";
import type { MemoDoc, MemoFormat } from "../lib/storage";
import { MemoHelp } from "./memo-help";

const FORMATS: MemoFormat[] = ["txt", "md"];

type Props = {
  doc: MemoDoc;
  saving: boolean;
  listOpen: boolean;
  hasSaved?: boolean;
  narrowView: "edit" | "preview";
  onChange: (doc: MemoDoc) => void;
  onTogglePreview: () => void;
  onToggleList: () => void;
  onSave: () => void;
  onImport: (text: string, fileName: string) => void;
};

export function MemoToolbar({
  doc, saving, listOpen, narrowView, hasSaved = false,
  onChange, onTogglePreview, onToggleList, onSave, onImport,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2">
      <div data-memo-help="format" role="tablist" aria-label="형식" className="flex gap-1">
        {FORMATS.map((format) => (
          <Button
            key={format}
            type="button"
            role="tab"
            size="sm"
            variant={doc.format === format ? "secondary" : "ghost"}
            aria-selected={doc.format === format}
            onClick={() => onChange({ ...doc, format })}
          >
            {format}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-1">
        <MemoHelp key={listOpen ? "library" : "editor"} listOpen={listOpen} hasSaved={hasSaved} />
        <span data-memo-help="autosave" className="inline-flex"><SaveStatus saving={saving} className="mr-1" /></span>
        {doc.format === "md" && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={narrowView === "edit" ? "프리뷰 보기" : "편집하기"}
            title={narrowView === "edit" ? "프리뷰 보기" : "편집하기"}
            onClick={onTogglePreview}
          >
            {narrowView === "edit" ? <Eye aria-hidden="true" /> : <PencilLine aria-hidden="true" />}
          </Button>
        )}
        <Button
          data-memo-help="save"
          type="button" variant="ghost" size="icon"
          className="text-muted-foreground"
          aria-label="메모 저장" title="메모 저장" onClick={onSave}
        >
          <Save aria-hidden="true" />
        </Button>
        <Button
          data-memo-help="library"
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground"
          aria-label={listOpen ? "편집으로 돌아가기" : "저장한 메모 목록"}
          aria-pressed={listOpen}
          title={listOpen ? "편집으로 돌아가기" : "저장한 메모 목록"}
          onClick={onToggleList}
        >
          {listOpen ? <PencilLine aria-hidden="true" /> : <List aria-hidden="true" />}
        </Button>
        <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
        <span data-memo-help="copy" className="inline-flex"><CopyButton getText={() => doc.text} /></span>
        <span data-memo-help="download" className="inline-flex"><DownloadButton getFile={() => memoFile(doc.text, doc.format)} /></span>
        <span data-memo-help="import" className="inline-flex"><UploadButton accept=".txt,.md,text/plain,text/markdown" label="파일 불러오기" onText={onImport} /></span>
      </div>
    </div>
  );
}
