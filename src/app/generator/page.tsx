import LevelGeneratorView from '@/components/LevelGeneratorView';
import Link from 'next/link';

export default function GeneratorPage() {
    return (
        <main className='min-h-[100svh] w-full flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800'>
            {/* 返回主页 */}
            <div className='absolute top-4 left-4 z-10'>
                <Link
                    href='/'
                    className='px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors shadow-lg flex items-center gap-2'
                >
                    ← 返回游戏
                </Link>
            </div>

            <LevelGeneratorView />
        </main>
    );
}
