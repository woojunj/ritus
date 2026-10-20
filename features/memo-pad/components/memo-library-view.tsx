import { useRef, useState } from "react";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchTerms } from "@/lib/search";
import { useKeyShortcut } from "@/lib/use-key-shortcut";

import { filterLibrary, type MemoLibrary, type SavedMemo } from "../lib/library";
import { SavedMemoList } from "./saved-memo-list";

type Props = {
  library: MemoLibrary;
  onLoad: (memo: SavedMemo) => void;
  onDelete: (id: string) => void;
};

// 검색 상태는 목록을 떠나면 버린다. 저장 데이터와 확인 창은 상위 화면이 관리한다.
export function MemoLibraryView({ library, onLoad, onDelete }: Props) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const terms = searchTerms(query);
  const shownLibrary = searchOpen ? filterLibrary(library, terms) : library;
  const hasSaved = library.saved.length > 0 || library.temp !== null;

  function openSearch() {
    setSearchOpen(true);
    searchRef.current?.focus();
  }
  function closeSearch() {
    setSearchOpen(false);
    setQuery("");
  }
  useKeyShortcut("/", hasSaved, openSearch);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      {hasSaved && (
        <div className="flex items-center gap-1 px-4 pt-4">
          {searchOpen ? (
            <>
              <Input
                ref={searchRef} type="search" aria-label="저장한 메모 검색"
                autoFocus value={query} onChange={(event) => setQuery(event.target.value)}
              />
              <Button
                type="button" variant="ghost" size="icon" className="text-muted-foreground"
                aria-label="검색 닫기" title="검색 닫기" onClick={closeSearch}
              >
                <X aria-hidden="true" />
              </Button>
            </>
          ) : (
            <Button
              type="button" variant="ghost" size="icon" className="ml-auto text-muted-foreground"
              aria-label="저장한 메모 검색" title="저장한 메모 검색" onClick={() => setSearchOpen(true)}
            >
              <Search aria-hidden="true" />
            </Button>
          )}
        </div>
      )}
      <SavedMemoList
        library={shownLibrary}
        emptyMessage={searchOpen && terms.length > 0 ? "일치하는 메모가 없습니다" : undefined}
        onLoad={onLoad} onDelete={onDelete}
      />
    </div>
  );
}
