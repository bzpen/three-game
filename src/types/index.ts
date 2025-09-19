// 游戏相关类型定义

export interface GridData {
    x: number;
    y: number;
    elementType: string;
}

export interface ElementData {
    id: string;
    type: string;
    direction: string;
    width: number;
    height: number;
    position: { x: number; y: number };
}

export interface GridConfig {
    rows: number;
    cols: number;
}

export interface LevelConfig {
    id: number;
    rows: number;
    cols: number;
    elements: ElementData[];
}
