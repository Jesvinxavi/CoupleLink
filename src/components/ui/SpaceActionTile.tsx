import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SpaceActionTileProps {
    title?: string
    description: string
    icon: string
    iconColor?: string
    iconBgColor?: string
    buttonText: string
    onClick: () => void
    variant?: "primary" | "secondary"
    buttonClassName?: string
    className?: string
}

export function SpaceActionTile({
    title,
    description,
    icon,
    iconColor = "text-[#EA2831]",
    iconBgColor = "bg-[#EA2831]/10",
    buttonText,
    onClick,
    variant = "primary",
    buttonClassName,
    className
}: SpaceActionTileProps) {
    return (
        <Card
            className={cn(
                "cursor-pointer border-none shadow-md transition-all hover:-translate-y-1 hover:shadow-xl",
                variant === "secondary" && "hover:border-indigo-100",
                className
            )}
            onClick={onClick}
        >
            <CardHeader className="text-center pb-2 pt-4">
                <div className={cn(
                    "mx-auto flex h-14 w-14 items-center justify-center rounded-full transition-transform group-hover:scale-110",
                    title ? "mb-3" : "mb-0",
                    iconBgColor
                )}>
                    <span className={cn("material-symbols-outlined text-3xl", iconColor)}>{icon}</span>
                </div>
                {title && <CardTitle className="text-xl font-bold text-heading-dark">{title}</CardTitle>}
            </CardHeader>
            <CardContent className="text-center pb-4">
                <Button
                    className={cn(
                        "h-10 w-auto min-w-[140px] px-6 rounded-full text-sm font-medium shadow-sm transition-all",
                        variant === "primary"
                            ? "bg-[#EA2831] text-white hover:bg-[#D41F27]"
                            : "border-2 border-[#EA2831] bg-transparent text-[#EA2831] hover:bg-[#EA2831]/5",
                        buttonClassName
                    )}
                >
                    {buttonText}
                </Button>
                <CardDescription className="mt-3 text-sm text-body-soft px-2">
                    {description}
                </CardDescription>
            </CardContent>
        </Card>
    )
}
