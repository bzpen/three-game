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
            {
                id: 'arrow-2',
                type: 'arrow',
                direction: 'down',
                width: 2,
                height: 1,
                position: { x: 2, y: 2 },
            },
            {
                id: 'arrow-3',
                type: 'arrow',
                direction: 'left',
                width: 2,
                height: 1,
                position: { x: 2, y: 7 },
            },
        ],
    },
];

export { LEVELS_LIST };
