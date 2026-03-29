'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

type NewsMarkdownBodyProps = {
    markdown: string;
    /** Merged onto the outer wrapper (e.g. admin preview pane). */
    wrapperClassName?: string;
};

export default function NewsMarkdownBody({ markdown, wrapperClassName }: NewsMarkdownBodyProps) {
    return (
        <div
            className={[
                'news-md max-w-none text-stone-200',
                '[&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-white',
                '[&_h2]:mb-2 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-red-200',
                '[&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-medium [&_h3]:text-stone-100',
                '[&_p]:mb-3 [&_p]:leading-relaxed',
                '[&_a]:text-red-400 [&_a]:underline hover:[&_a]:text-red-300',
                '[&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-6',
                '[&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6',
                '[&_li]:mb-1',
                '[&_code]:rounded [&_code]:bg-stone-800 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-sm',
                '[&_pre]:mb-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-stone-950 [&_pre]:p-3',
                '[&_pre_code]:bg-transparent [&_pre_code]:p-0',
                '[&_blockquote]:border-l-4 [&_blockquote]:border-red-500/50 [&_blockquote]:pl-4 [&_blockquote]:text-stone-400',
                '[&_table]:w-full [&_table]:border-collapse [&_table]:text-sm',
                '[&_th]:border [&_th]:border-white/10 [&_th]:bg-stone-800/80 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left',
                '[&_td]:border [&_td]:border-white/10 [&_td]:px-2 [&_td]:py-1',
                '[&_hr]:my-6 [&_hr]:border-white/10',
                '[&_img]:max-h-96 [&_img]:rounded-lg [&_img]:border [&_img]:border-white/10',
                wrapperClassName || '',
            ].join(' ')}
        >
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                {markdown}
            </ReactMarkdown>
        </div>
    );
}
