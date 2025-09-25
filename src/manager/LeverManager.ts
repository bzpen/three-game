import { LevelConfig } from '@/types';
import { LEVELS_LIST } from '@/config/LevelConfig';

class LeverManager {
    private levelDataList: LevelConfig[];

    constructor() {
        this.levelDataList = [];
    }

    async init(successCallback: () => void) {
        const promises = LEVELS_LIST.map(async (item, index) => {
            try {
                const response = await fetch(`/livels-json/${item}`);
                const levelData = await response.json();
                return { data: levelData, index };
            } catch (error) {
                console.error(`Failed to load level data for ${item}:`, error);
                return { data: null, index };
            }
        });

        const results = await Promise.all(promises);
        const sortedResults = results
            .filter(result => result.data !== null)
            .sort((a, b) => a.index - b.index)
            .map(result => result.data);

        this.levelDataList = sortedResults;

        successCallback();
    }

    public getLevelDataByIndex(index: number) {
        return this.levelDataList[index];
    }

    public getTotalLevels(): number {
        return this.levelDataList.length;
    }
}

const leverManager = new LeverManager();
export default leverManager;
