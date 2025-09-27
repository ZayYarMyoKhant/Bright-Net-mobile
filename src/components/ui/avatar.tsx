
"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { Swords } from "lucide-react";
import { cn } from "@/lib/utils"
import type { Profile } from "@/lib/data";

interface AvatarProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
    profile?: Partial<Profile>;
}


const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ className, profile, ...props }, ref) => {
    
    const borderClass = profile?.win_streak_10 
        ? 'border-2 border-yellow-400' 
        : profile?.win_streak_3
        ? 'border-2 border-blue-500'
        : '';
        
    return (
      <div className={cn("relative h-10 w-10", className)}>
          <AvatarPrimitive.Root
            ref={ref}
            className={cn(
              "relative flex h-full w-full shrink-0 overflow-hidden rounded-md",
               borderClass
            )}
            {...props}
          >
            <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.username} className="aspect-square h-full w-full"/>
            <AvatarFallback className="flex h-full w-full items-center justify-center rounded-md bg-muted">
                {profile?.username ? profile.username.charAt(0).toUpperCase() : '?'}
            </AvatarFallback>
          </AvatarPrimitive.Root>
          {profile?.win_streak_3 && !profile.win_streak_10 && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-auto h-auto flex items-center justify-center pointer-events-none">
                 <div className="bg-blue-500/90 p-0.5 rounded-full">
                    <Swords className="h-4 w-4 text-white" />
                </div>
            </div>
          )}
           {profile?.win_streak_10 && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-auto h-auto flex items-center justify-center pointer-events-none">
                 <div className="bg-yellow-400/90 p-0.5 rounded-full">
                    <Swords className="h-4 w-4 text-background" />
                </div>
            </div>
          )}
      </div>
    )
})
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full object-cover", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-md bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
