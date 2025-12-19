import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface CommitInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const CommitInput: React.FC<CommitInputProps> = ({
  value,
  onChange,
  placeholder = 'Commit message',
  disabled = false,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const hasMultipleLines = value.includes('\n');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const shouldShowTextarea = isExpanded || hasMultipleLines;

  const handleInputFocus = () => {
    setIsExpanded(true);
  };

  const handleTextareaBlur = () => {
    if (!hasMultipleLines && !value.trim()) {
      setIsExpanded(false);
    }
  };

  React.useEffect(() => {
    if (shouldShowTextarea && textareaRef.current) {
      textareaRef.current.focus();
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [shouldShowTextarea]);

  if (shouldShowTextarea) {
    return (
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleTextareaBlur}
        placeholder={placeholder}
        rows={4}
        disabled={disabled}
        className={cn(
          'rounded-lg bg-background/80 resize-none min-h-[100px]',
          disabled && 'opacity-50'
        )}
      />
    );
  }

  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={handleInputFocus}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        'rounded-lg bg-background/80',
        disabled && 'opacity-50'
      )}
    />
  );
};
