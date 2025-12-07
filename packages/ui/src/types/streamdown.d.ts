declare module 'streamdown' {
  import type { FC, ReactNode, ComponentType } from 'react';

  export interface StreamdownProps {
    children: string;
    mode?: 'streaming' | 'static';
    className?: string;

    shikiTheme?: readonly [string, string] | [string, string];

    controls?: boolean | {
      code?: boolean;
      table?: boolean;
      mermaid?: boolean;
    };
    components?: {
      [key: string]: ComponentType<{ children?: ReactNode; className?: string; [key: string]: unknown }>;
    };
  }

  export const Streamdown: FC<StreamdownProps>;
}
