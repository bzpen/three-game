import { LevelConfig } from '@/types';

const LEVELS_LIST: LevelConfig[] = [
    {
        id: 1758766995725,
        rows: 10,
        cols: 10,
        elements: [
            {
                id: 'arrow-5',
                type: 'arrow',
                direction: 'up',
                width: 2,
                height: 1,
                position: {
                    x: 5,
                    y: 6,
                },
            },
            {
                id: 'arrow-8',
                type: 'arrow',
                direction: 'right',
                width: 2,
                height: 1,
                position: {
                    x: 0,
                    y: 6,
                },
            },
        ],
    },
];

export { LEVELS_LIST };
