import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "ui-button",
    {
        variants: {
            variant: {
                default: "ui-button-default",
                destructive: "ui-button-destructive",
                outline: "ui-button-outline",
                secondary: "ui-button-secondary",
                ghost: "ui-button-ghost",
                link: "ui-button-link",
            },
            size: {
                default: "ui-button-md",
                sm: "ui-button-sm",
                lg: "ui-button-lg",
                icon: "ui-button-icon",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    },
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    },
)
Button.displayName = "Button"

export { Button, buttonVariants }
