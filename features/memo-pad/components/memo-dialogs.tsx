import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import type { SavedMemo } from "../lib/library";
import type { MemoDoc } from "../lib/storage";

type Props = {
  pendingLoad: SavedMemo | null;
  pendingDelete: string | null;
  pendingImport: MemoDoc | null;
  temp: SavedMemo | null;
  onLoad: () => void;
  onDelete: () => void;
  onImport: () => void;
  onCancelLoad: () => void;
  onCancelDelete: () => void;
  onCancelImport: () => void;
};

export function MemoDialogs({
  pendingLoad, pendingDelete, pendingImport, temp,
  onLoad, onDelete, onImport, onCancelLoad, onCancelDelete, onCancelImport,
}: Props) {
  return (
    <>
      <AlertDialog open={pendingLoad !== null} onOpenChange={(open) => { if (!open) onCancelLoad(); }}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingLoad && pendingLoad.id === temp?.id
                ? "지금 글과 임시 보관본을 바꿀까요?"
                : "지금 글을 임시 보관하고 이 메모를 불러올까요?"}
            </AlertDialogTitle>
            {temp && pendingLoad?.id !== temp.id && (
              <AlertDialogDescription>이전 임시 보관본은 사라집니다.</AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={onLoad}>확인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => { if (!open) onCancelDelete(); }}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>이 메모를 지울까요?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={pendingImport !== null} onOpenChange={(open) => { if (!open) onCancelImport(); }}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>쓰던 글을 불러온 파일로 바꿀까요?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={onImport}>확인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
