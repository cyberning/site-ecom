import Button from "@/components/ui/Button";

interface PaginationProps {
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, pages, onPageChange }: PaginationProps) {
  if (pages <= 1) return null;
  return (
    <nav className="flex items-center justify-center gap-2" aria-label="Pagination">
      <Button
        variant="secondary"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Précédent
      </Button>
      <span className="px-2 text-sm text-[var(--text-muted)]">
        Page {page} / {pages}
      </span>
      <Button
        variant="secondary"
        size="sm"
        disabled={page >= pages}
        onClick={() => onPageChange(page + 1)}
      >
        Suivant
      </Button>
    </nav>
  );
}
