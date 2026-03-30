import { ReactNode, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ExpandableContentSectionProps = {
  title: string;
  summary: string;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
  expandLabel?: string;
  collapseLabel?: string;
};

export default function ExpandableContentSection({
  title,
  summary,
  children,
  className,
  defaultOpen = false,
  expandLabel = 'Read more',
  collapseLabel = 'Hide section',
}: ExpandableContentSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className={cn('theme-panel rounded-[2rem] border p-6', className)}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="max-w-3xl">
          <h2 className="theme-title text-2xl font-bold">{title}</h2>
          <p className="theme-muted mt-3 text-sm leading-7">{summary}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsOpen((current) => !current)}
          aria-expanded={isOpen}
          className="shrink-0 self-start"
        >
          {isOpen ? collapseLabel : expandLabel}
          <ChevronDown className={cn('ml-2 h-4 w-4 transition-transform duration-200', isOpen && 'rotate-180')} />
        </Button>
      </div>

      <div className={cn('grid transition-all duration-300 ease-out', isOpen ? 'mt-5 grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
        <div className="overflow-hidden">
          <div className="space-y-4 border-t border-border/70 pt-5">{children}</div>
        </div>
      </div>
    </section>
  );
}
