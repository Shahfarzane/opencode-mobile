import * as React from "react"
import { Button, type buttonVariants } from "./button"
import { cn } from "@/lib/utils"
import { type VariantProps } from "class-variance-authority"

function ButtonLarge({
  className,
  variant,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  return (
    <Button
      variant={variant}
      size="sm"
      className={cn("h-7 px-2 py-0", className)}
      {...props}
    />
  )
}

export { ButtonLarge }
