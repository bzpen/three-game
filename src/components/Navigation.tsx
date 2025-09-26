'use client';

import Link from 'next/link';

const Navigation = () => {
    return (
        <nav className='bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700'>
            <div className='container mx-auto px-4 py-3'>
                <div className='flex items-center justify-between'>
                    <Link href='/' className='text-xl font-bold text-gray-800 dark:text-white'>
                        游戏项目
                    </Link>
                    <div className='flex space-x-4'>
                        <Link
                            href='/'
                            className='px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white transition-colors'
                        >
                            游戏
                        </Link>
                        <Link
                            href='/generator'
                            className='px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white transition-colors'
                        >
                            关卡生成器
                        </Link>
                        <Link
                            href='/editor'
                            className='px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white transition-colors'
                        >
                            关卡编辑器
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navigation;
