import novelAPI from './api.js';
import CONFIG from './config.js';
import timeUtils from './timeUtils.js';

document.addEventListener('DOMContentLoaded', () => {
    // 状态管理
    const state = {
        currentChapter: 1,
        editHistory: [],
        historyIndex: -1,
        isFullscreen: false,
        showOutline: false,
        novelProgress: {
            totalChapters: CONFIG.NOVEL_SETTINGS.CHAPTER_LIMITS.DEFAULT,
            totalWords: CONFIG.NOVEL_SETTINGS.WORD_LIMITS.DEFAULT,
            completedChapters: 0,
            completedWords: 0,
            currentChapterWords: 0
        },
        customSettings: {
            chaptersEnabled: false,
            wordsEnabled: false
        }
    };

    // DOM元素
    const elements = {
        // API Key相关
        apiKeyModal: document.getElementById('api-key-modal'),
        apiKeyInput: document.getElementById('api-key-input'),
        apiKeyError: document.getElementById('api-key-error'),
        verifyApiKeyBtn: document.getElementById('verify-api-key'),
        container: document.querySelector('.container'),
        
        // 输入控件
        novelTitle: document.getElementById('novel-title'),
        novelType: document.getElementById('novel-type'),
        writingStyle: document.getElementById('writing-style'),
        storyTone: document.getElementById('story-tone'),
        novelOutline: document.getElementById('novel-outline'),
        chapterLength: document.getElementById('chapter-length'),
        creativityLevel: document.getElementById('creativity-level'),
        
        // 输出和控制
        chapterNumber: document.getElementById('chapter-number'),
        chapterTitle: document.getElementById('chapter-title'),
        novelOutput: document.getElementById('novel-output'),
        loadingSpinner: document.querySelector('.loading-spinner'),
        progressText: document.querySelector('.progress-text'),
        historyList: document.getElementById('history-list'),
        
        // 按钮
        generateBtn: document.getElementById('generate-btn'),
        saveOutlineBtn: document.getElementById('save-outline-btn'),
        editBtn: document.getElementById('edit-btn'),
        saveBtn: document.getElementById('save-btn'),
        continueBtn: document.getElementById('continue-btn'),
        changeKeyBtn: document.getElementById('change-key-btn'),
        undoBtn: document.getElementById('undo-btn'),
        redoBtn: document.getElementById('redo-btn'),
        toggleOutlineBtn: document.getElementById('toggle-outline-btn'),
        toggleFullscreenBtn: document.getElementById('toggle-fullscreen-btn'),
        totalChapters: document.getElementById('total-chapters'),
        totalWords: document.getElementById('total-words'),
        customChapters: document.getElementById('custom-chapters'),
        customWords: document.getElementById('custom-words'),
        completedChapters: document.getElementById('completed-chapters'),
        completedWords: document.getElementById('completed-words')
    };

    // 工具函数
    const utils = {
        // 保存到历史记录
        saveToHistory(content, type = 'generate') {
            const history = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.NOVEL_HISTORY) || '[]');
            history.unshift({
                timestamp: new Date().toISOString(),
                title: elements.novelTitle.value,
                type: elements.novelType.value,
                content: content,
                actionType: type
            });
            localStorage.setItem(CONFIG.STORAGE_KEYS.NOVEL_HISTORY, JSON.stringify(history.slice(0, 50)));
            utils.updateHistoryList();
        },

        // 更新历史列表显示
        updateHistoryList() {
            const history = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.NOVEL_HISTORY) || '[]');
            elements.historyList.innerHTML = history.map((item, index) => `
                <div class="history-item" data-index="${index}">
                    <div class="history-info">
                        <span class="history-title">${item.title}</span>
                        <span class="history-time">${new Date(item.timestamp).toLocaleString()}</span>
                    </div>
                    <div class="history-preview">${item.content.substring(0, 100)}...</div>
                </div>
            `).join('');
        },

        // 保存编辑历史
        saveEditHistory(content) {
            state.editHistory = state.editHistory.slice(0, state.historyIndex + 1);
            state.editHistory.push(content);
            state.historyIndex = state.editHistory.length - 1;
            utils.updateUndoRedoButtons();
        },

        // 更新撤销/重做按钮状态
        updateUndoRedoButtons() {
            elements.undoBtn.disabled = state.historyIndex <= 0;
            elements.redoBtn.disabled = state.historyIndex >= state.editHistory.length - 1;
        },

        // 切换全屏模式
        toggleFullscreen() {
            const outputPanel = elements.novelOutput.closest('.output-panel');
            state.isFullscreen = !state.isFullscreen;
            outputPanel.classList.toggle('fullscreen-mode', state.isFullscreen);
            elements.toggleFullscreenBtn.querySelector('.icon').textContent = 
                state.isFullscreen ? '⛶' : '⛶';
        },

        // 切换大纲显示
        toggleOutline() {
            state.showOutline = !state.showOutline;
            const outlineDisplay = document.querySelector('.outline-display') || 
                document.createElement('div');
            outlineDisplay.className = 'outline-display';
            
            if (state.showOutline) {
                outlineDisplay.textContent = elements.novelOutline.value;
                elements.novelOutput.parentElement.insertBefore(
                    outlineDisplay, 
                    elements.novelOutput
                );
            } else {
                outlineDisplay.remove();
            }
        },

        // 更新进度文本
        updateProgressText(text) {
            elements.progressText.textContent = text;
        },

        // 更新进度显示
        updateProgress() {
            const { totalChapters, totalWords, completedChapters, completedWords } = state.novelProgress;
            
            // 更新章节进度
            if (elements.completedChapters) {
                elements.completedChapters.textContent = `${completedChapters}/${totalChapters}`;
            }
            const chapterProgress = document.querySelector('.progress-fill.chapters');
            if (chapterProgress) {
                chapterProgress.style.width = `${(completedChapters / totalChapters) * 100}%`;
            }

            // 更新字数进度
            if (elements.completedWords) {
                elements.completedWords.textContent = `${completedWords}/${totalWords}`;
            }
            const wordProgress = document.querySelector('.progress-fill.words');
            if (wordProgress) {
                wordProgress.style.width = `${(completedWords / totalWords) * 100}%`;
            }
        },

        // 计算字数
        countWords(text) {
            return text.replace(/\s+/g, '').length;
        },

        // 检查字数是否符合要求
        checkWordCount(content, targetCount) {
            const currentCount = utils.countWords(content);
            const tolerance = CONFIG.NOVEL_SETTINGS.AUTO_ADJUST.TOLERANCE;
            const minCount = targetCount * (1 - tolerance);
            const maxCount = targetCount * (1 + tolerance);
            return currentCount >= minCount && currentCount <= maxCount;
        },

        // 验证设置值
        validateSettings() {
            const totalChapters = state.customSettings.chaptersEnabled ? 
                parseInt(elements.customChapters.value) : 
                parseInt(elements.totalChapters.value);
            
            const totalWords = state.customSettings.wordsEnabled ? 
                parseInt(elements.customWords.value) : 
                parseInt(elements.totalWords.value);

            const avgChapterWords = Math.floor(totalWords / totalChapters);

            let isValid = true;
            let message = '';

            if (totalChapters < CONFIG.NOVEL_SETTINGS.CHAPTER_LIMITS.MIN || 
                totalChapters > CONFIG.NOVEL_SETTINGS.CHAPTER_LIMITS.MAX) {
                isValid = false;
                message = `章节数必须在 ${CONFIG.NOVEL_SETTINGS.CHAPTER_LIMITS.MIN} 到 ${CONFIG.NOVEL_SETTINGS.CHAPTER_LIMITS.MAX} 之间`;
            }

            if (totalWords < CONFIG.NOVEL_SETTINGS.WORD_LIMITS.MIN || 
                totalWords > CONFIG.NOVEL_SETTINGS.WORD_LIMITS.MAX) {
                isValid = false;
                message = `总字数必须在 ${CONFIG.NOVEL_SETTINGS.WORD_LIMITS.MIN} 到 ${CONFIG.NOVEL_SETTINGS.WORD_LIMITS.MAX} 之间`;
            }

            if (avgChapterWords < CONFIG.NOVEL_SETTINGS.WORD_LIMITS.CHAPTER_MIN) {
                isValid = false;
                message = `平均每章字数不能少于 ${CONFIG.NOVEL_SETTINGS.WORD_LIMITS.CHAPTER_MIN} 字`;
            }

            return { isValid, message };
        }
    };

    // 小说生成控制器
    const novelController = {
        // 生成小说内容
        async generateNovel() {
            const {
                novelTitle, novelType, writingStyle, storyTone,
                novelOutline, chapterLength, creativityLevel
            } = elements;

            if (!novelTitle.value || !novelOutline.value) {
                alert('请填写小说标题和大纲');
                return;
            }

            try {
                ui.updateButtonState('generateBtn', true);
                ui.showLoading(true);

                // 第一步：扩展大纲
                utils.updateProgressText('正在扩展故事大纲...');
                const expandedOutline = await novelAPI.expandOutline(
                    novelTitle.value,
                    novelType.value,
                    novelOutline.value
                );
                ui.updateStepResult('expanded-outline', '扩展大纲', expandedOutline);

                // 第二步：创建人物设定（分段处理）
                utils.updateProgressText('正在创建人物设定...');
                const characters = await this.generateCharactersInBatches(expandedOutline);
                ui.updateStepResult('characters', '人物设定', characters.join('\n\n'));

                // 第三步：规划章节
                utils.updateProgressText('正在规划章节结构...');
                const chapterPlan = await novelAPI.planChapters(expandedOutline, characters);
                ui.updateStepResult('chapter-plan', '章节规划', chapterPlan);

                // 保存章节规划
                localStorage.setItem('chapter_plan', JSON.stringify(chapterPlan));

                // 第四步：生成第一章
                utils.updateProgressText('正在生成第一章...');
                const firstChapter = await this.generateChapter(1, chapterPlan, {
                    title: novelTitle.value,
                    type: novelType.value,
                    outline: expandedOutline,
                    characters: characters,
                    style: writingStyle.value,
                    tone: storyTone.value,
                    targetWords: parseInt(chapterLength.value)
                });

                // 更新显示
                elements.novelOutput.innerText = firstChapter;
                utils.saveToHistory(firstChapter, 'generate');
                utils.saveEditHistory(firstChapter);
                localStorage.setItem(CONFIG.STORAGE_KEYS.CURRENT_NOVEL, firstChapter);
                
                // 更新状态
                state.currentChapter = 1;
                state.novelProgress.completedChapters = 1;
                state.novelProgress.completedWords = utils.countWords(firstChapter);
                state.novelProgress.currentChapterWords = state.novelProgress.completedWords;
                
                // 保存进度
                localStorage.setItem(CONFIG.STORAGE_KEYS.CHAPTER_COUNT, state.currentChapter);
                utils.updateProgress();
                
                ui.updateButtonState('continueBtn', false);

            } catch (error) {
                if (error.message.includes('API密钥')) {
                    ui.toggleApiKeyModal(true);
                } else {
                    alert('生成失败：' + error.message);
                }
            } finally {
                ui.updateButtonState('generateBtn', false);
                ui.showLoading(false);
            }
        },

        // 分批生成人物设定
        async generateCharactersInBatches(expandedOutline) {
            const characterTypes = [
                { type: 'main', prompt: '主要人物', count: 3 },
                { type: 'supporting', prompt: '重要配角', count: 5 },
                { type: 'minor', prompt: '次要人物', count: 8 }
            ];

            let allCharacters = [];

            for (const { type, prompt, count } of characterTypes) {
                utils.updateProgressText(`正在创建${prompt}设定...`);
                const characterPrompt = `
                    基于以下故事大纲，创建${count}个${prompt}的详细设定：
                    ${expandedOutline}

                    要求：
                    1. 每个人物包含以下信息：
                       - 基本信息（姓名、年龄、性别等）
                       - 外貌特征
                       - 性格特点
                       - 背景故事
                       - 在故事中的作用
                       - 与其他人物的关系
                       - 个人动机和目标
                    2. 人物性格要立体，避免脸谱化
                    3. 人物关系要合理，互相呼应
                    4. 符合故事背景和主题
                    5. 为后续情节发展预留空间

                    请按照以上要求，详细描述每个人物。
                `;

                const characters = await novelAPI.createCharacters(characterPrompt);
                allCharacters.push(characters);
            }

            // 最后生成人物关系网
            utils.updateProgressText('正在生成人物关系网...');
            const relationshipPrompt = `
                基于以下人物设定，创建一个详细的人物关系网：
                ${allCharacters.join('\n\n')}

                要求：
                1. 描述所有主要人物之间的关系
                2. 说明重要配角与主要人物的联系
                3. 解释次要人物在故事中的作用
                4. 标注关系的性质（亲情、友情、爱情、对立等）
                5. 说明关系对故事发展的影响
            `;

            const relationships = await novelAPI.createCharacters(relationshipPrompt);
            allCharacters.push(relationships);

            return allCharacters;
        },

        // 生成单个章节
        async generateChapter(chapterNumber, chapterPlan, novelInfo) {
            try {
                if (chapterNumber === 1) {
                    timeUtils.startTimer();
                }

                // 获取当前章节的规划
                const chapterInfo = chapterPlan.chapters[chapterNumber - 1];
                if (!chapterInfo) {
                    throw new Error(`找不到第 ${chapterNumber} 章的规划信息`);
                }
                
                // 更新章节状态
                chapterInfo.status = 'generating';
                await this.saveChapterPlan(chapterPlan);
                
                // 构建章节生成的上下文
                const context = {
                    chapterNumber,
                    chapterTitle: chapterInfo.title,
                    chapterSummary: chapterInfo.summary,
                    mainPlot: chapterInfo.mainPlot,
                    subPlots: chapterInfo.subPlots,
                    characters: chapterInfo.characters,
                    scenes: chapterInfo.scenes,
                    previousContent: chapterNumber > 1 ? elements.novelOutput.innerText : '',
                    targetWords: chapterInfo.targetWords
                };
                
                // 分步骤生成章节
                let chapterContent = '';
                
                // 1. 生成章节开头
                utils.updateProgressText(`正在生成第 ${chapterNumber} 章开头...`);
                const opening = await novelAPI.generateChapterPart('opening', context, novelInfo);
                chapterContent += opening;
                
                // 2. 生成章节主要场景
                for (let i = 0; i < context.scenes.length; i++) {
                    utils.updateProgressText(`正在生成第 ${chapterNumber} 章场景 ${i + 1}/${context.scenes.length}...`);
                    const scene = await novelAPI.generateChapterPart('scene', {
                        ...context,
                        currentScene: context.scenes[i]
                    }, novelInfo);
                    chapterContent += '\n\n' + scene;
                }
                
                // 3. 生成章节结尾
                utils.updateProgressText(`正在生成第 ${chapterNumber} 章结尾...`);
                const ending = await novelAPI.generateChapterPart('ending', {
                    ...context,
                    previousContent: chapterContent
                }, novelInfo);
                chapterContent += '\n\n' + ending;
                
                // 4. 优化章节内容
                utils.updateProgressText(`正在优化第 ${chapterNumber} 章...`);
                const polished = await novelAPI.polishContent(chapterContent);
                
                // 更新章节状态
                chapterInfo.status = 'completed';
                chapterInfo.content = polished;
                await this.saveChapterPlan(chapterPlan);
                
                // 记录完成时间
                timeUtils.recordTaskCompletion('chapter');
                
                return polished;
            } catch (error) {
                // 如果生成失败，更新章节状态
                const chapterInfo = chapterPlan.chapters[chapterNumber - 1];
                if (chapterInfo) {
                    chapterInfo.status = 'failed';
                    await this.saveChapterPlan(chapterPlan);
                }
                throw error;
            }
        },

        // 继续生成下一章
        async continueNovel() {
            try {
                const previousContent = elements.novelOutput.innerText;
                if (!previousContent) {
                    alert('请先生成小说内容');
                    return;
                }

                // 获取章节规划
                const chapterPlan = JSON.parse(localStorage.getItem('chapter_plan'));
                if (!chapterPlan) {
                    alert('找不到章节规划，请重新开始生成');
                    return;
                }

                ui.updateButtonState('continueBtn', true);
                ui.showLoading(true);

                // 检查限制
                if (state.novelProgress.completedChapters >= state.novelProgress.totalChapters) {
                    alert('已达到设定的章节数上限');
                    return;
                }

                const remainingWords = state.novelProgress.totalWords - state.novelProgress.completedWords;
                if (remainingWords < CONFIG.NOVEL_SETTINGS.WORD_LIMITS.CHAPTER_MIN) {
                    alert('剩余字数不足以生成新章节');
                    return;
                }

                // 计算目标字数
                const averageRemainingWords = Math.floor(remainingWords / 
                    (state.novelProgress.totalChapters - state.novelProgress.completedChapters));
                const targetChapterWords = Math.min(
                    averageRemainingWords,
                    parseInt(elements.chapterLength.value)
                );

                // 保存当前状态
                const currentState = {
                    content: elements.novelOutput.innerText,
                    chapter: state.currentChapter,
                    completedWords: state.novelProgress.completedWords,
                    completedChapters: state.novelProgress.completedChapters
                };
                localStorage.setItem('generation_state', JSON.stringify(currentState));

                // 生成下一章
                const nextChapter = await this.generateChapter(state.currentChapter + 1, chapterPlan, {
                    title: elements.novelTitle.value,
                    type: elements.novelType.value,
                    style: elements.writingStyle.value,
                    tone: elements.storyTone.value,
                    targetWords: targetChapterWords
                });

                // 更新显示
                elements.novelOutput.innerText += '\n\n' + nextChapter;
                utils.saveToHistory(nextChapter, 'continue');
                utils.saveEditHistory(elements.novelOutput.innerText);
                localStorage.setItem(CONFIG.STORAGE_KEYS.CURRENT_NOVEL, elements.novelOutput.innerText);

                // 更新状态
                state.currentChapter++;
                elements.chapterNumber.textContent = `第${state.currentChapter}章`;
                localStorage.setItem(CONFIG.STORAGE_KEYS.CHAPTER_COUNT, state.currentChapter);

                // 更新进度
                state.novelProgress.completedChapters++;
                const newWords = utils.countWords(nextChapter);
                state.novelProgress.completedWords += newWords;
                state.novelProgress.currentChapterWords = newWords;
                utils.updateProgress();

                // 清除生成状态
                localStorage.removeItem('generation_state');

                // 检查是否需要禁用继续按钮
                const shouldDisableContinue = 
                    state.novelProgress.completedChapters >= state.novelProgress.totalChapters ||
                    remainingWords < CONFIG.NOVEL_SETTINGS.WORD_LIMITS.CHAPTER_MIN;
                ui.updateButtonState('continueBtn', false, null, shouldDisableContinue);

            } catch (error) {
                if (error.message.includes('API密钥')) {
                    ui.toggleApiKeyModal(true);
                } else {
                    // 恢复到上一个状态
                    const savedState = localStorage.getItem('generation_state');
                    if (savedState) {
                        const state = JSON.parse(savedState);
                        elements.novelOutput.innerText = state.content;
                        state.currentChapter = state.chapter;
                        state.novelProgress.completedWords = state.completedWords;
                        state.novelProgress.completedChapters = state.completedChapters;
                        utils.updateProgress();
                    }
                    alert('继续生成失败：' + error.message + '\n已恢复到上一个保存点');
                }
            } finally {
                ui.updateButtonState('continueBtn', false);
                ui.showLoading(false);
            }
        },

        // 保存章节规划
        async saveChapterPlan(chapterPlan) {
            try {
                // 序列化章节规划数据
                const serializedPlan = JSON.stringify({
                    structure: chapterPlan.structure,
                    mainPlot: chapterPlan.mainPlot,
                    subPlots: chapterPlan.subPlots,
                    chapters: chapterPlan.chapters,
                    optimization: chapterPlan.optimization,
                    metadata: {
                        totalChapters: parseInt(document.getElementById('total-chapters').value),
                        totalWords: parseInt(document.getElementById('total-words').value),
                        novelType: document.getElementById('novel-type').value,
                        timestamp: new Date().toISOString()
                    }
                });
                
                // 存储到localStorage
                localStorage.setItem('chapter_plan', serializedPlan);
                
                // 更新UI显示
                this.updateProgressDisplay(chapterPlan);
                
                return true;
            } catch (error) {
                console.error('保存章节规划时出错：', error);
                throw new Error('保存章节规划失败');
            }
        },
        
        // 读取章节规划
        loadChapterPlan() {
            try {
                const serializedPlan = localStorage.getItem('chapter_plan');
                if (!serializedPlan) {
                    return null;
                }
                
                const plan = JSON.parse(serializedPlan);
                
                // 验证数据完整性
                if (!plan.chapters || !Array.isArray(plan.chapters)) {
                    throw new Error('章节规划数据不完整');
                }
                
                // 更新UI显示
                this.updateProgressDisplay(plan);
                
                return plan;
            } catch (error) {
                console.error('读取章节规划时出错：', error);
                localStorage.removeItem('chapter_plan'); // 除可能损坏的数据
                throw new Error('读取章节规划失败，请重新生成');
            }
        },
        
        // 更新进度显示
        updateProgressDisplay(plan) {
            const completedChapters = plan.chapters.filter(ch => ch.status === 'completed').length;
            const totalChapters = plan.chapters.length;
            const completedWords = plan.chapters.reduce((sum, ch) => {
                if (ch.status === 'completed') {
                    return sum + (ch.content ? utils.countWords(ch.content) : ch.targetWords);
                }
                return sum;
            }, 0);
            const totalWords = plan.metadata.totalWords;
            
            // 更新进度条和文本显示
            document.getElementById('completed-chapters').textContent = `${completedChapters}/${totalChapters}`;
            document.getElementById('completed-words').textContent = `${completedWords}/${totalWords}`;
            
            // 更新进度条
            const chaptersProgress = (completedChapters / totalChapters) * 100;
            const wordsProgress = (completedWords / totalWords) * 100;
            
            const chaptersBar = document.querySelector('.progress-fill.chapters');
            const wordsBar = document.querySelector('.progress-fill.words');
            
            // 添加过渡动画
            chaptersBar.style.transition = 'width 0.5s ease-in-out';
            wordsBar.style.transition = 'width 0.5s ease-in-out';
            
            chaptersBar.style.width = `${chaptersProgress}%`;
            wordsBar.style.width = `${wordsProgress}%`;

            // 更新预计剩余时间
            const remainingTimeSeconds = timeUtils.calculateRemainingTime('chapter', completedChapters, totalChapters);
            const remainingTimeText = timeUtils.formatTime(remainingTimeSeconds);
            const remainingTimeElement = document.getElementById('remaining-time');
            
            // 添加动画效果
            remainingTimeElement.style.opacity = '0';
            setTimeout(() => {
                remainingTimeElement.textContent = remainingTimeText;
                remainingTimeElement.style.opacity = '1';
            }, 200);

            // 更新章节状态颜色和提示
            plan.chapters.forEach((chapter, index) => {
                const chapterElement = document.querySelector(`.chapter-status-${index + 1}`);
                if (chapterElement) {
                    // 添加过渡动画
                    chapterElement.style.transition = 'all 0.3s ease';
                    
                    // 更新颜色和状态
                    chapterElement.style.backgroundColor = STATUS_COLORS[chapter.status];
                    chapterElement.title = `第${index + 1}章 - ${chapter.title}\n状态：${
                        chapter.status === 'pending' ? '待生成' :
                        chapter.status === 'generating' ? '生成中' :
                        chapter.status === 'completed' ? '已完成' :
                        '生成失败'
                    }`;
                    
                    // 添加高亮效果
                    if (chapter.status === 'generating') {
                        chapterElement.style.boxShadow = '0 0 8px rgba(52, 152, 219, 0.5)';
                    } else {
                        chapterElement.style.boxShadow = 'none';
                    }
                }
            });
        }
    };

    // UI相关函数
    const ui = {
        // 显示/隐藏API Key验证模态框
        toggleApiKeyModal(show) {
            elements.apiKeyModal.style.display = show ? 'flex' : 'none';
            elements.container.style.display = show ? 'none' : 'block';
            if (show) {
                elements.apiKeyInput.value = '';
                elements.apiKeyError.textContent = '';
            }
        },

        // 显示加载动画
        showLoading(show) {
            elements.loadingSpinner.style.display = show ? 'block' : 'none';
        },

        // 保存小说内容
        saveNovel() {
            const content = elements.novelOutput.innerText;
            const title = elements.novelTitle.value || '未命名小说';
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `${title}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        },

        // 保存大纲
        saveOutline() {
            const outline = elements.novelOutline.value;
            localStorage.setItem(CONFIG.STORAGE_KEYS.NOVEL_OUTLINE, outline);
            alert('大纲已保存');
        },

        // 更新步骤结果显示
        updateStepResult(id, title, content) {
            const resultDiv = document.querySelector(`#${id}`) || 
                document.createElement('div');
            resultDiv.id = id;
            resultDiv.className = 'step-result';
            resultDiv.innerHTML = `
                <h4>${title}</h4>
                <div class="result-content">${content}</div>
            `;

            const resultsContainer = document.querySelector('.generation-results') || 
                (() => {
                    const container = document.createElement('div');
                    container.className = 'generation-results';
                    elements.novelOutput.parentElement.insertBefore(
                        container,
                        elements.novelOutput
                    );
                    return container;
                })();

            resultsContainer.appendChild(resultDiv);
        },

        // 清除所有步骤结果
        clearStepResults() {
            const resultsContainer = document.querySelector('.generation-results');
            if (resultsContainer) {
                resultsContainer.innerHTML = '';
            }
        },

        // 更新按钮状态
        updateButtonState(buttonId, loading, text = null, disabled = false) {
            const button = elements[buttonId];
            if (!button) return;

            button.disabled = loading || disabled;
            if (text !== null) {
                button.textContent = text;
            }
            
            // 添加或移除加载状态的样式
            button.classList.toggle('loading', loading);
        },

        // 更新所有按钮状态
        updateAllButtonStates(loading = false) {
            const buttonIds = [
                'generateBtn',
                'continueBtn',
                'saveBtn',
                'saveOutlineBtn',
                'undoBtn',
                'redoBtn',
                'toggleFullscreenBtn',
                'toggleOutlineBtn',
                'clearResultsBtn',
                'changeKeyBtn'
            ];

            buttonIds.forEach(id => {
                this.updateButtonState(id, loading);
            });
        }
    };

    // 绑定事件处理函数
    function bindEvents() {
        // API Key相关
        elements.verifyApiKeyBtn.addEventListener('click', async () => {
            const key = elements.apiKeyInput.value.trim();
            if (!key) {
                elements.apiKeyError.textContent = '请输入API密钥';
                return;
            }

            elements.apiKeyError.textContent = '';
            elements.verifyApiKeyBtn.disabled = true;
            elements.verifyApiKeyBtn.textContent = '验证中...';

            try {
                const isValid = await novelAPI.verifyApiKey(key);
                if (isValid) {
                    novelAPI.setApiKey(key);
                    ui.toggleApiKeyModal(false);
                } else {
                    elements.apiKeyError.textContent = 'API密钥无效';
                }
            } catch (error) {
                elements.apiKeyError.textContent = '验证失败：' + error.message;
            } finally {
                elements.verifyApiKeyBtn.disabled = false;
                elements.verifyApiKeyBtn.textContent = '验证并开始使用';
            }
        });

        // Enter键触发验证
        elements.apiKeyInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                elements.verifyApiKeyBtn.click();
            }
        });

        // 更换API密钥
        elements.changeKeyBtn.addEventListener('click', () => {
            ui.toggleApiKeyModal(true);
        });

        // 生成控制
        elements.generateBtn.addEventListener('click', () => novelController.generateNovel());
        elements.continueBtn.addEventListener('click', () => novelController.continueNovel());
        elements.saveBtn.addEventListener('click', ui.saveNovel);
        elements.saveOutlineBtn.addEventListener('click', ui.saveOutline);

        // 编辑控制
        elements.undoBtn.addEventListener('click', () => {
            if (state.historyIndex > 0) {
                state.historyIndex--;
                elements.novelOutput.innerText = state.editHistory[state.historyIndex];
                utils.updateUndoRedoButtons();
            }
        });

        elements.redoBtn.addEventListener('click', () => {
            if (state.historyIndex < state.editHistory.length - 1) {
                state.historyIndex++;
                elements.novelOutput.innerText = state.editHistory[state.historyIndex];
                utils.updateUndoRedoButtons();
            }
        });

        // 视图控制
        elements.toggleFullscreenBtn.addEventListener('click', utils.toggleFullscreen);
        elements.toggleOutlineBtn.addEventListener('click', utils.toggleOutline);

        // 创意程度滑块
        elements.creativityLevel.addEventListener('input', (e) => {
            const value = e.target.value;
            e.target.nextElementSibling.textContent = value;
        });

        // 章节标题
        elements.chapterTitle.addEventListener('change', () => {
            localStorage.setItem('chapter_title_' + state.currentChapter, 
                elements.chapterTitle.value);
        });

        // 添加清除结果的事件
        elements.clearResultsBtn = document.createElement('button');
        elements.clearResultsBtn.textContent = '清除中间结果';
        elements.clearResultsBtn.className = 'secondary-btn';
        elements.clearResultsBtn.addEventListener('click', ui.clearStepResults);
        
        const actionButtons = document.querySelector('.action-buttons .right-buttons');
        actionButtons.insertBefore(elements.clearResultsBtn, elements.saveBtn);

        // 总章节数选择
        elements.totalChapters.addEventListener('change', (e) => {
            const value = e.target.value;
            if (value === 'custom') {
                elements.customChapters.style.display = 'block';
                state.customSettings.chaptersEnabled = true;
            } else {
                elements.customChapters.style.display = 'none';
                state.customSettings.chaptersEnabled = false;
                state.novelProgress.totalChapters = parseInt(value);
                utils.updateProgress();
                // 更新继续按钮状态
                const shouldDisableContinue = state.novelProgress.completedChapters >= state.novelProgress.totalChapters;
                ui.updateButtonState('continueBtn', false, null, shouldDisableContinue);
            }
        });

        // 总字数选择
        elements.totalWords.addEventListener('change', (e) => {
            const value = e.target.value;
            if (value === 'custom') {
                elements.customWords.style.display = 'block';
                state.customSettings.wordsEnabled = true;
            } else {
                elements.customWords.style.display = 'none';
                state.customSettings.wordsEnabled = false;
                state.novelProgress.totalWords = parseInt(value);
                utils.updateProgress();
                // 更新继续按钮状态
                const remainingWords = value - state.novelProgress.completedWords;
                const shouldDisableContinue = remainingWords < CONFIG.NOVEL_SETTINGS.WORD_LIMITS.CHAPTER_MIN;
                ui.updateButtonState('continueBtn', false, null, shouldDisableContinue);
            }
        });

        // 自定义章节数输入
        elements.customChapters.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            if (value >= CONFIG.NOVEL_SETTINGS.CHAPTER_LIMITS.MIN && 
                value <= CONFIG.NOVEL_SETTINGS.CHAPTER_LIMITS.MAX) {
                state.novelProgress.totalChapters = value;
                utils.updateProgress();
                // 更新继续按钮状态
                const shouldDisableContinue = state.novelProgress.completedChapters >= value;
                ui.updateButtonState('continueBtn', false, null, shouldDisableContinue);
            }
        });

        // 自定义字数输入
        elements.customWords.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            if (value >= CONFIG.NOVEL_SETTINGS.WORD_LIMITS.MIN && 
                value <= CONFIG.NOVEL_SETTINGS.WORD_LIMITS.MAX) {
                state.novelProgress.totalWords = value;
                utils.updateProgress();
                // 更新继续按钮状态
                const remainingWords = value - state.novelProgress.completedWords;
                const shouldDisableContinue = remainingWords < CONFIG.NOVEL_SETTINGS.WORD_LIMITS.CHAPTER_MIN;
                ui.updateButtonState('continueBtn', false, null, shouldDisableContinue);
            }
        });
    }

    // 初始化
    function init() {
        bindEvents();
        utils.updateHistoryList();
        
        // 初始化进度显示
        state.novelProgress = {
            totalChapters: parseInt(elements.totalChapters.value) || CONFIG.NOVEL_SETTINGS.CHAPTER_LIMITS.DEFAULT,
            totalWords: parseInt(elements.totalWords.value) || CONFIG.NOVEL_SETTINGS.WORD_LIMITS.DEFAULT,
            completedChapters: 0,
            completedWords: 0,
            currentChapterWords: 0
        };
        utils.updateProgress();

        // 检查是否有未完成的生成任务
        const savedState = localStorage.getItem('generation_state');
        if (savedState) {
            const state = JSON.parse(savedState);
            if (confirm('检测到上次生成被中断，是否恢复到中断点？')) {
                elements.novelOutput.innerText = state.content;
                state.currentChapter = state.chapter;
                state.novelProgress.completedWords = state.completedWords;
                state.novelProgress.completedChapters = state.completedChapters;
                utils.updateProgress();
            } else {
                localStorage.removeItem('generation_state');
            }
        }

        // 检查API Key
        if (!novelAPI.apiKey) {
            ui.toggleApiKeyModal(true);
        } else {
            // 恢复上次的内容
            const lastContent = localStorage.getItem(CONFIG.STORAGE_KEYS.CURRENT_NOVEL);
            if (lastContent) {
                elements.novelOutput.innerText = lastContent;
                utils.saveEditHistory(lastContent);
                elements.continueBtn.disabled = false;
                
                // 更新进度
                state.novelProgress.completedWords = utils.countWords(lastContent);
                state.novelProgress.completedChapters = state.currentChapter;
                utils.updateProgress();
            }

            // 恢复上次的大纲
            const savedOutline = localStorage.getItem(CONFIG.STORAGE_KEYS.NOVEL_OUTLINE);
            if (savedOutline) {
                elements.novelOutline.value = savedOutline;
            }

            // 恢复章节信息
            const savedChapterCount = localStorage.getItem(CONFIG.STORAGE_KEYS.CHAPTER_COUNT);
            if (savedChapterCount) {
                state.currentChapter = parseInt(savedChapterCount);
                elements.chapterNumber.textContent = `第${state.currentChapter}章`;
                const chapterTitle = localStorage.getItem('chapter_title_' + state.currentChapter);
                if (chapterTitle) {
                    elements.chapterTitle.value = chapterTitle;
                }
            }
        }
    }

    // 启动应用
    init();

    // 生成章节状态指示器
    function generateChapterStatusIndicators(totalChapters) {
        const statusList = document.getElementById('chapter-status-list');
        statusList.innerHTML = '';
        
        // 创建状态指示器容器
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.flexWrap = 'wrap';
        container.style.gap = '8px';
        
        for (let i = 0; i < totalChapters; i++) {
            const statusDot = document.createElement('div');
            statusDot.className = `chapter-status chapter-status-${i + 1}`;
            statusDot.style.backgroundColor = STATUS_COLORS.pending;
            statusDot.title = `第${i + 1}章`;
            
            // 添加点击事件，显示章节详情
            statusDot.addEventListener('click', () => {
                const chapterPlan = JSON.parse(localStorage.getItem('chapter_plan'));
                if (chapterPlan && chapterPlan.chapters[i]) {
                    const chapter = chapterPlan.chapters[i];
                    showChapterDetails(chapter, i + 1);
                }
            });
            
            container.appendChild(statusDot);
        }
        
        statusList.appendChild(container);
    }

    // 显示章节详情
    function showChapterDetails(chapter, chapterNumber) {
        const statusText = {
            pending: '待生成',
            generating: '生成中',
            completed: '已完成',
            failed: '生成失败'
        };
        
        const details = `
            第${chapterNumber}章详情：
            标题：${chapter.title}
            状态：${statusText[chapter.status]}
            预计字数：${chapter.targetWords}字
            ${chapter.status === 'completed' ? `实际字数：${utils.countWords(chapter.content)}字` : ''}
            ${chapter.status === 'failed' ? '请点击"继续生成"重试' : ''}
        `;
        
        alert(details); // 这里可以改用更好的UI展示方式，比如弹出模态框
    }

    // 更新进度显示函数改进
    function updateProgressDisplay(plan) {
        const completedChapters = plan.chapters.filter(ch => ch.status === 'completed').length;
        const totalChapters = plan.chapters.length;
        const completedWords = plan.chapters.reduce((sum, ch) => {
            if (ch.status === 'completed') {
                return sum + (ch.content ? utils.countWords(ch.content) : ch.targetWords);
            }
            return sum;
        }, 0);
        const totalWords = plan.metadata.totalWords;
        
        // 更新进度条和文本显示
        document.getElementById('completed-chapters').textContent = `${completedChapters}/${totalChapters}`;
        document.getElementById('completed-words').textContent = `${completedWords}/${totalWords}`;
        
        // 更新进度条
        const chaptersProgress = (completedChapters / totalChapters) * 100;
        const wordsProgress = (completedWords / totalWords) * 100;
        
        const chaptersBar = document.querySelector('.progress-fill.chapters');
        const wordsBar = document.querySelector('.progress-fill.words');
        
        // 添加过渡动画
        chaptersBar.style.transition = 'width 0.5s ease-in-out';
        wordsBar.style.transition = 'width 0.5s ease-in-out';
        
        chaptersBar.style.width = `${chaptersProgress}%`;
        wordsBar.style.width = `${wordsProgress}%`;

        // 更新预计剩余时间
        const remainingTimeSeconds = timeUtils.calculateRemainingTime('chapter', completedChapters, totalChapters);
        const remainingTimeText = timeUtils.formatTime(remainingTimeSeconds);
        const remainingTimeElement = document.getElementById('remaining-time');
        
        // 添加动画效果
        remainingTimeElement.style.opacity = '0';
        setTimeout(() => {
            remainingTimeElement.textContent = remainingTimeText;
            remainingTimeElement.style.opacity = '1';
        }, 200);

        // 更新章节状态颜色和提示
        plan.chapters.forEach((chapter, index) => {
            const chapterElement = document.querySelector(`.chapter-status-${index + 1}`);
            if (chapterElement) {
                // 添加过渡动画
                chapterElement.style.transition = 'all 0.3s ease';
                
                // 更新颜色和状态
                chapterElement.style.backgroundColor = STATUS_COLORS[chapter.status];
                chapterElement.title = `第${index + 1}章 - ${chapter.title}\n状态：${
                    chapter.status === 'pending' ? '待生成' :
                    chapter.status === 'generating' ? '生成中' :
                    chapter.status === 'completed' ? '已完成' :
                    '生成失败'
                }`;
                
                // 添加高亮效果
                if (chapter.status === 'generating') {
                    chapterElement.style.boxShadow = '0 0 8px rgba(52, 152, 219, 0.5)';
                } else {
                    chapterElement.style.boxShadow = 'none';
                }
            }
        });
    }
}); 