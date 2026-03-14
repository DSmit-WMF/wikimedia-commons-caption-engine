"use client";

import { CaptionEditorFooter } from "@/components/captions/CaptionEditorFooter";
import { CaptionEditorToolbar } from "@/components/captions/CaptionEditorToolbar";
import type { CaptionItem } from "@/lib/api";
import { CaptionRow } from "@/components/captions/CaptionRow";
import { useCaptionEditor } from "@/hooks/useCaptionEditor";

export interface CaptionEditorProps {
  captions: CaptionItem[];
  onCaptionsChange: (captions: CaptionItem[]) => void;
  languages: string[];
  languagesFromCommons: Set<string>;
  fileIdentifier: string;
  descriptionContext?: string;
}

export function CaptionEditor({
  captions,
  onCaptionsChange,
  languages,
  languagesFromCommons,
  fileIdentifier,
  descriptionContext,
}: CaptionEditorProps) {
  const {
    getLabelText,
    getPlaceholderText,
    displayLangs,
    emptyNonCommonsLangs,
    generatingLang,
    generatingAll,
    generateAllProgress,
    sendingLang,
    sendingAll,
    error,
    fieldErrors,
    sentLangs,
    dirtyLangs,
    baselineValues,
    generateOne,
    generateAll,
    updateCaption,
    sendOne,
    sendAll,
    revertToBaseline,
    copyAll,
    exportJson,
  } = useCaptionEditor({
    captions,
    onCaptionsChange,
    languages,
    languagesFromCommons,
    fileIdentifier,
    descriptionContext,
  });

  return (
    <div className="space-y-4">
      <CaptionEditorToolbar
        emptyNonCommonsLangs={emptyNonCommonsLangs}
        captions={captions}
        generatingAll={generatingAll}
        generateAllProgress={generateAllProgress}
        onGenerateAll={generateAll}
        onCopyAll={copyAll}
        onExportJson={exportJson}
        error={error}
      />
      <div className="space-y-4">
        {displayLangs.map((lang) => {
          const cap = captions.find((c) => c.lang === lang);
          const value = cap?.text ?? "";
          return (
            <CaptionRow
              key={lang}
              lang={lang}
              value={value}
              labelText={getLabelText(lang)}
              placeholderText={getPlaceholderText(lang)}
              fromCommons={languagesFromCommons.has(lang)}
              isSent={sentLangs.has(lang)}
              isDirty={dirtyLangs.has(lang)}
              fieldError={fieldErrors[lang]}
              baselineValue={baselineValues[lang] ?? ""}
              generatingLang={generatingLang}
              generatingAll={generatingAll}
              sendingLang={sendingLang}
              sendingAll={sendingAll}
              onValueChange={(text) => updateCaption(lang, text)}
              onGenerate={() => generateOne(lang)}
              onRevert={() => revertToBaseline(lang)}
              onSend={() => sendOne(lang)}
            />
          );
        })}
      </div>
      {captions.length > 0 && (
        <CaptionEditorFooter
          captions={captions}
          dirtyLangs={dirtyLangs}
          sendingAll={sendingAll}
          onSendAll={sendAll}
        />
      )}
    </div>
  );
}
