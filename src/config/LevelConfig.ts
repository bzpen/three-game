import { LevelConfig } from '@/types';

const LEVELS_LIST: LevelConfig[] = [
    {
        id: 1,
        rows: 10,
        cols: 10,
        elements: [
            {
                id: 'arrow-1',
                type: 'arrow',
                direction: 'right',
                width: 2,
                height: 1,
                position: { x: 0, y: 0 },
            },
        ],
    },
];

export { LEVELS_LIST };
