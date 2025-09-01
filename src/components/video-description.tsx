
"use client";

import { useState, useTransition } from "react";
import { translateDescriptionAction } from "@/lib/actions";
import { Loader2, Languages } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";

type VideoDescriptionProps = {
  username: string;
  descriptionMyanmar: string;
};

export function VideoDescription({ username, descriptionMyanmar }: VideoDescriptionProps) {
  const [isPending, startTransition] = useTransition();
  const [translatedDescription, setTranslatedDescription] = useState<string | null>(null);
  const { toast } = useToast();

  const handleTranslate = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("description", descriptionMyanmar);
      const result = await translateDescriptionAction(formData);
      if (result.success && result.translatedText) {
        setTranslatedDescription(result.translatedText);
      } else {
        toast({
          variant: "destructive",
          title: "Translation Failed",
          description: result.error || "Could not translate the description.",
        });
      }
    });
  };

  return (
    <div className="text-sm text-white">
      <p className="font-bold">@{username}</p>
      <p className="mt-1">
        {translatedDescription || descriptionMyanmar}
      </p>
      {!translatedDescription && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleTranslate}
          disabled={isPending}
          className="mt-2 -ml-2 h-auto p-1 text-xs text-white/70 hover:bg-white/10 hover:text-white"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              Translating...
            </>
          ) : (
             <>
              <Languages className="mr-1 h-3 w-3" />
              See Translation
            </>
          )}
        </Button>
      )}
    </div>
  );
}
