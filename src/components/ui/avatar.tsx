
"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import Image from "next/image";
import { cn } from "@/lib/utils"
import type { Profile } from "@/lib/data";

interface AvatarProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
    profile?: Partial<Profile>;
    src?: string | null;
    alt?: string;
}

const AvatarFrame = ({ isStreak10 }: { isStreak10?: boolean }) => {
    const frameUrl = isStreak10 
        ? "https://blbqaojfppwybkjqiyeb.supabase.co/storage/v1/object/public/avatars/gold_frame.png"
        : "https://blbqaojfppwybkjqiyeb.supabase.co/storage/v1/object/public/avatars/blue_frame.png";

    return (
        <div className="absolute inset-[-11%] pointer-events-none z-10">
            <Image
                src={frameUrl}
                alt={isStreak10 ? "Gold Frame" : "Blue Frame"}
                fill
                className="object-contain"
                unoptimized
            />
        </div>
    );
}


const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ className, profile, src, alt, ...props }, ref) => {
    
    const showFrame = profile?.win_streak_3 || profile?.win_streak_10;
    const imageUrl = src ?? profile?.avatar_url;
    const username = profile?.username;
        
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
          
          {showFrame && <AvatarFrame isStreak10={profile?.win_streak_10} />}
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
