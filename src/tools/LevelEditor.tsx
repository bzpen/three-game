'use client';

import React, { useState, useRef } from 'react';
import { LevelGenerator } from '../lib/generators/LevelGenerator';
import type { LevelData } from '../lib/types/level';

/**
 * 关卡制作工具 - 仅供开发者使用
 * 这是一个独立的工具组件，不会出现在最终的游戏中
 */
const LevelEditor: React.FC = () => {
  const [levels, setLevels] = useState<LevelData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard' | 'expert'>('medium');
  const [levelName, setLevelName] = useState('');
  const [batchCount, setBatchCount] = useState(1);
  const [previewLevel, setPreviewLevel] = useState<LevelData | null>(null);
  
  const levelGenerator = useRef(LevelGenerator.getInstance());

  // 生成单个关卡
  const generateSingleLevel = async () => {
    if (!levelName.trim()) {
      alert('请输入关卡名称');
      return;
    }

    setIsGenerating(true);
    try {
      const levelId = `${selectedDifficulty}_${Date.now()}`;
      const level = await levelGenerator.current.generateLevel(
        levelId,
        selectedDifficulty,
        levelName.trim()
      );

      if (level) {
        setLevels(prev => [...prev, level]);
        setLevelName('');
        console.log('✓ 关卡生成成功:', level.name);
      } else {
        alert('关卡生成失败，请重试');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // 批量生成关卡
  const generateBatchLevels = async () => {
    setIsGenerating(true);
    try {
      const newLevels = await levelGenerator.current.generateLevels({
        levelCount: batchCount,
        difficulty: selectedDifficulty,
        namePrefix: `${selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1)} Level`,
      });

      setLevels(prev => [...prev, ...newLevels]);
      console.log(`✓ 批量生成完成: ${newLevels.length} 个关卡`);
    } finally {
      setIsGenerating(false);
    }
  };

  // 预览关卡
  const previewLevelData = (level: LevelData) => {
    setPreviewLevel(level);
  };

  // 删除关卡
  const deleteLevel = (levelId: string) => {
    setLevels(prev => prev.filter(level => level.id !== levelId));
    if (previewLevel?.id === levelId) {
      setPreviewLevel(null);
    }
  };

  // 导出单个关卡
  const exportLevel = (level: LevelData) => {
    const jsonData = JSON.stringify(level, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${level.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 导出所有关卡为关卡包
  const exportAllAsLevelPack = () => {
    if (levels.length === 0) {
      alert('没有关卡可导出');
      return;
    }

    const difficultyDistribution = {
      easy: levels.filter(l => l.difficulty === 'easy').length,
      medium: levels.filter(l => l.difficulty === 'medium').length,
      hard: levels.filter(l => l.difficulty === 'hard').length,
      expert: levels.filter(l => l.difficulty === 'expert').length,
    };

    const levelPack = {
      id: `custom_pack_${Date.now()}`,
      name: 'Custom Level Pack',
      description: '自定义关卡包',
      version: '1.0.0',
      levels: levels,
      metadata: {
        createdAt: new Date().toISOString(),
        totalLevels: levels.length,
        difficultyDistribution,
      },
    };

    const jsonData = JSON.stringify(levelPack, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'level_pack.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 清空所有关卡
  const clearAllLevels = () => {
    if (confirm('确定要清空所有关卡吗？')) {
      setLevels([]);
      setPreviewLevel(null);
    }
  };

  // 导入关卡文件
  const importLevelFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = e.target?.result as string;
        const data = JSON.parse(jsonData);
        
        if (Array.isArray(data.levels)) {
          // 关卡包格式
          setLevels(prev => [...prev, ...data.levels]);
          console.log(`✓ 导入关卡包: ${data.levels.length} 个关卡`);
        } else if (data.id && data.name) {
          // 单个关卡格式
          setLevels(prev => [...prev, data]);
          console.log(`✓ 导入关卡: ${data.name}`);
        } else {
          alert('无效的关卡文件格式');
        }
      } catch (error) {
        alert('文件解析失败');
        console.error(error);
      }
    };
    reader.readAsText(file);
    
    // 重置文件输入
    event.target.value = '';
  };

  const difficultyStats = {
    easy: levels.filter(l => l.difficulty === 'easy').length,
    medium: levels.filter(l => l.difficulty === 'medium').length,
    hard: levels.filter(l => l.difficulty === 'hard').length,
    expert: levels.filter(l => l.difficulty === 'expert').length,
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          🛠️ 关卡制作工具
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：制作工具 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 单个关卡生成 */}
            <div className="bg-white rounded-lg p-6 shadow">
              <h2 className="text-xl font-semibold mb-4">生成单个关卡</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">关卡名称</label>
                  <input
                    type="text"
                    value={levelName}
                    onChange={(e) => setLevelName(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="输入关卡名称..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">难度</label>
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value as any)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="easy">简单 (4x4)</option>
                    <option value="medium">中等 (6x6)</option>
                    <option value="hard">困难 (8x8)</option>
                    <option value="expert">专家 (10x10)</option>
                  </select>
                </div>
                
                <button
                  onClick={generateSingleLevel}
                  disabled={isGenerating || !levelName.trim()}
                  className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                >
                  {isGenerating ? '生成中...' : '生成关卡'}
                </button>
              </div>
            </div>

            {/* 批量生成 */}
            <div className="bg-white rounded-lg p-6 shadow">
              <h2 className="text-xl font-semibold mb-4">批量生成</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">数量</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={batchCount}
                    onChange={(e) => setBatchCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full p-2 border rounded"
                  />
                </div>
                
                <button
                  onClick={generateBatchLevels}
                  disabled={isGenerating}
                  className="w-full py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
                >
                  {isGenerating ? '生成中...' : `批量生成 ${batchCount} 个`}
                </button>
              </div>
            </div>

            {/* 统计信息 */}
            <div className="bg-white rounded-lg p-6 shadow">
              <h2 className="text-xl font-semibold mb-4">统计信息</h2>
              <div className="space-y-2 text-sm">
                <p>总关卡数: <span className="font-medium">{levels.length}</span></p>
                <p>简单: <span className="font-medium">{difficultyStats.easy}</span></p>
                <p>中等: <span className="font-medium">{difficultyStats.medium}</span></p>
                <p>困难: <span className="font-medium">{difficultyStats.hard}</span></p>
                <p>专家: <span className="font-medium">{difficultyStats.expert}</span></p>
              </div>
            </div>

            {/* 导入导出 */}
            <div className="bg-white rounded-lg p-6 shadow">
              <h2 className="text-xl font-semibold mb-4">导入导出</h2>
              
              <div className="space-y-3">
                <label className="block">
                  <span className="sr-only">导入关卡文件</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={importLevelFile}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </label>
                
                <button
                  onClick={exportAllAsLevelPack}
                  disabled={levels.length === 0}
                  className="w-full py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400"
                >
                  导出关卡包 ({levels.length} 个)
                </button>
                
                <button
                  onClick={clearAllLevels}
                  disabled={levels.length === 0}
                  className="w-full py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400"
                >
                  清空所有关卡
                </button>
              </div>
            </div>
          </div>

          {/* 中间：关卡列表 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 shadow h-full">
              <h2 className="text-xl font-semibold mb-4">关卡列表 ({levels.length})</h2>
              
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {levels.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">还没有关卡</p>
                ) : (
                  levels.map((level, index) => (
                    <div
                      key={level.id}
                      className={`p-3 border rounded cursor-pointer transition-colors ${
                        previewLevel?.id === level.id ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => previewLevelData(level)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium">{level.name}</p>
                          <p className="text-sm text-gray-500">
                            {level.difficulty} • {level.arrows.length} 箭头 • {level.config.rows}x{level.config.cols}
                          </p>
                        </div>
                        <div className="flex space-x-1 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              exportLevel(level);
                            }}
                            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                            title="导出"
                          >
                            📥
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteLevel(level.id);
                            }}
                            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                            title="删除"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 右侧：关卡预览 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 shadow">
              <h2 className="text-xl font-semibold mb-4">关卡预览</h2>
              
              {previewLevel ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-lg">{previewLevel.name}</h3>
                    <p className="text-sm text-gray-500">ID: {previewLevel.id}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><span className="font-medium">难度:</span> {previewLevel.difficulty}</p>
                      <p><span className="font-medium">尺寸:</span> {previewLevel.config.rows}x{previewLevel.config.cols}</p>
                      <p><span className="font-medium">箭头数:</span> {previewLevel.arrows.length}</p>
                    </div>
                    <div>
                      <p><span className="font-medium">网格大小:</span> {previewLevel.config.gridSize}px</p>
                      <p><span className="font-medium">间距:</span> {previewLevel.config.gridGap}px</p>
                      <p><span className="font-medium">生成尝试:</span> {previewLevel.metadata.generationAttempts}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="font-medium mb-2">箭头位置:</p>
                    <div className="space-y-1 text-sm max-h-40 overflow-y-auto">
                      {previewLevel.arrows.map(arrow => (
                        <div key={arrow.id} className="flex justify-between">
                          <span>箭头 {arrow.id}</span>
                          <span>{arrow.direction} ({arrow.gridPosition.row}, {arrow.gridPosition.col})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <button
                      onClick={() => exportLevel(previewLevel)}
                      className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      导出此关卡
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">选择一个关卡进行预览</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LevelEditor;
