import { Suspense } from 'react';
import type { Metadata } from 'next';
import { SkillCalculatorView } from './SkillCalculatorView';

export const metadata: Metadata = {
    title: 'Skill Calculator | DBOD',
    description: 'Plan and share Dragon Ball Online Daebak skill builds (SP trees, tooltips, and build links).',
};

export default function SkillCalculatorPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-[50vh] bg-[#1a1512] p-8 text-center text-stone-300">Loading skill calculator…</div>
            }
        >
            <SkillCalculatorView />
        </Suspense>
    );
}
