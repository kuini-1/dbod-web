'use client';

import { useEffect, useRef } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/ariakit';
import { parseBlockNoteDocumentJson } from '@/lib/utils/news-body-blocknote';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/ariakit/style.css';

export type NewsBlockNoteFieldProps = {
    /** Serialized `JSON.stringify(editor.document)` or legacy markdown. */
    initialStored: string;
    onChangeStored?: (json: string) => void;
    editable?: boolean;
    className?: string;
    theme?: 'light' | 'dark';
};

export default function NewsBlockNoteField({
    initialStored,
    onChangeStored,
    editable = true,
    className,
    theme = 'dark',
}: NewsBlockNoteFieldProps) {
    const editor = useCreateBlockNote({});
    const didSeed = useRef(false);

    useEffect(() => {
        if (didSeed.current) return;
        didSeed.current = true;

        const blocks = parseBlockNoteDocumentJson(initialStored);
        if (blocks?.length) {
            editor.replaceBlocks(editor.document, blocks);
            return;
        }
        if (initialStored.trim()) {
            try {
                const fromMd = editor.tryParseMarkdownToBlocks(initialStored);
                editor.replaceBlocks(editor.document, fromMd);
            } catch {
                /* keep empty */
            }
        }
        // Intentionally run once per mount only; parent remounts this component via `key` when the post changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editor]);

    return (
        <div
            className={[
                'bn-admin-wrap w-full min-w-0 rounded-xl border border-white/12 bg-stone-950/40 [&_.bn-editor]:min-h-[320px]',
                className ?? '',
            ].join(' ')}
        >
            <BlockNoteView
                editor={editor}
                editable={editable}
                theme={theme}
                onChange={() => {
                    onChangeStored?.(JSON.stringify(editor.document));
                }}
            />
        </div>
    );
}
