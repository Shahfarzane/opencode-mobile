import { View } from "react-native";
import { cardStyles } from "./card.styles";
import type {
  CardContentProps,
  CardFooterProps,
  CardHeaderProps,
  CardProps,
} from "./card.types";
import {
  CARD_CONTENT_DISPLAY_NAME,
  CARD_DISPLAY_NAME,
  CARD_FOOTER_DISPLAY_NAME,
  CARD_HEADER_DISPLAY_NAME,
} from "./card.constants";

/**
 * Card component
 *
 * A container component with variants for different visual styles.
 *
 * @example
 * <Card variant="elevated" padding="md">
 *   <Card.Header>
 *     <Text>Title</Text>
 *   </Card.Header>
 *   <Card.Content>
 *     <Text>Content goes here</Text>
 *   </Card.Content>
 *   <Card.Footer>
 *     <Button>Action</Button>
 *   </Card.Footer>
 * </Card>
 */
function CardRoot({
  variant = "default",
  padding = "md",
  className,
  style,
  children,
  ...props
}: CardProps) {
  const rootClassName = cardStyles.root({
    variant,
    padding,
    className,
  });

  return (
    <View className={rootClassName} style={style} {...props}>
      {children}
    </View>
  );
}

CardRoot.displayName = CARD_DISPLAY_NAME;

/**
 * Card header component
 */
function CardHeader({ className, style, children, ...props }: CardHeaderProps) {
  const headerClassName = cardStyles.header({ className });

  return (
    <View className={headerClassName} style={style} {...props}>
      {children}
    </View>
  );
}

CardHeader.displayName = CARD_HEADER_DISPLAY_NAME;

/**
 * Card content component
 */
function CardContent({ className, style, children, ...props }: CardContentProps) {
  const contentClassName = cardStyles.content({ className });

  return (
    <View className={contentClassName} style={style} {...props}>
      {children}
    </View>
  );
}

CardContent.displayName = CARD_CONTENT_DISPLAY_NAME;

/**
 * Card footer component
 */
function CardFooter({ className, style, children, ...props }: CardFooterProps) {
  const footerClassName = cardStyles.footer({ className });

  return (
    <View className={footerClassName} style={style} {...props}>
      {children}
    </View>
  );
}

CardFooter.displayName = CARD_FOOTER_DISPLAY_NAME;

/**
 * Card component with compound components
 */
export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Content: CardContent,
  Footer: CardFooter,
});

export type { CardProps, CardHeaderProps, CardContentProps, CardFooterProps };
