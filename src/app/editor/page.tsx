'use client';

import Navigation from '@/components/Navigation';
import LevelEditor from '@/components/LevelEditor';

export default function EditorPage() {
    return (
        <div className='min-h-screen bg-gray-100 dark:bg-gray-900'>
            <Navigation />
            <div className='container mx-auto px-4 py-8'>
                <h1 className='text-3xl font-bold text-center mb-8 text-gray-800 dark:text-white'>关卡编辑器</h1>
                <LevelEditor />
            </div>
        </div>
    );
}
