"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { LanguageSelector } from "@/components/LanguageSelector";

export interface LanguagesSectionProps {
  selectedLanguages: string[];
  onLanguagesChange: (langs: string[]) => void;
  preferredLang?: string;
}

export function LanguagesSection({
  selectedLanguages,
  onLanguagesChange,
  preferredLang = "en",
}: LanguagesSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Languages</CardTitle>
        <CardDescription>
          Choose languages for caption translation (default: en, es, fr, ar, zh)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LanguageSelector
          selectedLanguages={selectedLanguages}
          onLanguagesChange={onLanguagesChange}
          preferredLang={preferredLang}
        />
      </CardContent>
    </Card>
  );
}
