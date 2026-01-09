// New component structure with tailwind-variants
import { Card as CardComponent } from "./card";
import { Skeleton as SkeletonComponent } from "./skeleton";

// Button
export { Button, IconButton } from "./button";
export type { ButtonProps, ButtonLabelProps, ButtonVariant, ButtonSize, IconButtonProps } from "./button";
export { buttonStyles } from "./button";

// Card
export { Card } from "./card";
export type {
  CardProps,
  CardHeaderProps,
  CardContentProps,
  CardFooterProps,
  CardVariant,
  CardPadding,
} from "./card";
export { cardStyles } from "./card";

// Backward compatibility exports for Card sub-components
export const CardHeader = CardComponent.Header;
export const CardContent = CardComponent.Content;
export const CardFooter = CardComponent.Footer;

// Input
export { Input } from "./input";
export type {
  InputProps,
  InputLabelProps,
  InputHelperTextProps,
  InputSize,
  InputState,
} from "./input";
export { inputStyles } from "./input";

// Skeleton
export { Skeleton } from "./skeleton";
export type {
  SkeletonProps,
  SkeletonAvatarProps,
  SkeletonTextProps,
  SkeletonCardProps,
  SkeletonMessageProps,
  SkeletonVariant,
} from "./skeleton";
export { skeletonStyles } from "./skeleton";

// Backward compatibility exports for Skeleton sub-components
export const SkeletonAvatar = SkeletonComponent.Avatar;
export const SkeletonText = SkeletonComponent.Text;
export const SkeletonCard = SkeletonComponent.Card;
export const SkeletonMessage = SkeletonComponent.Message;

// Other UI components (not yet migrated)
export { OpenChamberLogo } from "./OpenChamberLogo";
export { ProviderLogo } from "./ProviderLogo";
export { TextLoop } from "./TextLoop";
