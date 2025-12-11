
"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cn } from "@/lib/utils"
import type { Profile } from "@/lib/data";
import { Rose } from "@/components/icons";
import { BadgeCheck } from "lucide-react";

interface AvatarProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
    profile?: Partial<Profile>;
    src?: string | null;
    alt?: string;
}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ className, profile, src, alt, ...props }, ref) => {
    
    const imageUrl = src ?? profile?.avatar_url;
    const username = alt ?? profile?.username;
        
    return (
      <div className={cn("relative h-10 w-10 shrink-0", className)}>
          <AvatarPrimitive.Root
            ref={ref}
            className={cn(
              "relative flex h-full w-full shrink-0 overflow-hidden rounded-md",
            )}
            {...props}
          >
            <AvatarImage src={imageUrl ?? undefined} alt={alt ?? username} className="aspect-square h-full w-full object-cover"/>
            <AvatarFallback className="flex h-full w-full items-center justify-center rounded-md bg-muted">
                {username ? username.charAt(0).toUpperCase() : '?'}
            </AvatarFallback>
          </AvatarPrimitive.Root>
          
          {profile?.is_in_relationship && <Rose className="absolute -top-2 -right-2 h-5 w-5 z-20" />}
          {profile?.is_verified && (
              <BadgeCheck className="absolute -bottom-1 -right-1 h-5 w-5 text-white bg-blue-500 rounded-full z-20 p-0.5" />
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
