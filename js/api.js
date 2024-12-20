import CONFIG from './config.js';

class NovelAPI {
    constructor() {
        this.apiKey = localStorage.getItem('api_key');
        this.retryCount = 0;
    }

    setApiKey(key) {
        this.apiKey = key;
        localStorage.setItem('api_key', key);
    }

    async verifyApiKey(key) {
        try {
            // 使用chat/completions端点进行简单的API密钥验证
            const response = await fetch(CONFIG.API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key}`
                },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: '测试API密钥' }],
                    model: CONFIG.MODEL_NAME,
                    max_tokens: 10
                })
            });

            if (response.ok) {
                return true;
            } else if (response.status === 401 || response.status === 403) {
                return false;
            } else {
                throw new Error('API验证请求失败：' + response.statusText);
            }
        } catch (error) {
            console.error('API密钥验证失败：', error);
            return false;
        }
    }

    // 扩展大纲
    async expandOutline(title, type, outline) {
        const prompt = CONFIG.PROMPTS.EXPAND_OUTLINE(title, type, outline);
        const response = await this.makeRequest(null, {
            messages: [{ role: 'user', content: prompt }],
            temperature: CONFIG.CREATIVITY_SETTINGS.getTemperature(70),
            top_p: CONFIG.CREATIVITY_SETTINGS.getTopP(70)
        });
        return response.content;
    }

    // 创建人物设定
    async createCharacters(expandedOutline) {
        const prompt = CONFIG.PROMPTS.CREATE_CHARACTERS(expandedOutline);
        const response = await this.makeRequest(null, {
            messages: [{ role: 'user', content: prompt }],
            temperature: CONFIG.CREATIVITY_SETTINGS.getTemperature(60),
            top_p: CONFIG.CREATIVITY_SETTINGS.getTopP(60)
        });
        return response.content;
    }

    // 规划章节
    async planChapters(expandedOutline, characters) {
        // 获取小说整体设置
        const totalChapters = parseInt(document.getElementById('total-chapters').value);
        const totalWords = parseInt(document.getElementById('total-words').value);
        const novelType = document.getElementById('novel-type').value;

        // 第一步：整体架构规划
        const structurePrompt = CONFIG.NOVEL_STRUCTURE.STRUCTURE_PROMPTS.PLAN_OVERALL_STRUCTURE(
            totalChapters,
            totalWords,
            novelType,
            expandedOutline
        );
        const structurePlan = await this.makeRequest(null, {
            messages: [{ role: 'user', content: structurePrompt }],
            temperature: CONFIG.CREATIVITY_SETTINGS.getTemperature(50),
            top_p: CONFIG.CREATIVITY_SETTINGS.getTopP(50)
        });

        // 第二步：主线剧情规划
        const mainPlotPrompt = CONFIG.PROMPTS.CHAPTER_PLANNING.MAIN_PLOT_PLANNING(
            expandedOutline,
            structurePlan.content
        );
        const mainPlot = await this.makeRequest(null, {
            messages: [{ role: 'user', content: mainPlotPrompt }],
            temperature: CONFIG.CREATIVITY_SETTINGS.getTemperature(60),
            top_p: CONFIG.CREATIVITY_SETTINGS.getTopP(60)
        });

        // 第三步：支线剧情规划
        const subPlotPrompt = CONFIG.PROMPTS.CHAPTER_PLANNING.SUB_PLOT_PLANNING(
            mainPlot.content,
            characters
        );
        const subPlots = await this.makeRequest(null, {
            messages: [{ role: 'user', content: subPlotPrompt }],
            temperature: CONFIG.CREATIVITY_SETTINGS.getTemperature(70),
            top_p: CONFIG.CREATIVITY_SETTINGS.getTopP(70)
        });

        // 第四步：具体章节规划
        const detailedPlanPrompt = CONFIG.PROMPTS.CHAPTER_PLANNING.DETAILED_CHAPTER_PLANNING(
            structurePlan.content,
            mainPlot.content,
            subPlots.content,
            1,
            totalChapters
        );
        const detailedPlan = await this.makeRequest(null, {
            messages: [{ role: 'user', content: detailedPlanPrompt }],
            temperature: CONFIG.CREATIVITY_SETTINGS.getTemperature(60),
            top_p: CONFIG.CREATIVITY_SETTINGS.getTopP(60)
        });

        // 第五步：衔接优化
        const connectionPrompt = CONFIG.PROMPTS.CHAPTER_PLANNING.CONNECTION_OPTIMIZATION(
            detailedPlan.content
        );
        const optimizedPlan = await this.makeRequest(null, {
            messages: [{ role: 'user', content: connectionPrompt }],
            temperature: CONFIG.CREATIVITY_SETTINGS.getTemperature(50),
            top_p: CONFIG.CREATIVITY_SETTINGS.getTopP(50)
        });

        // 返回完整的章节规划
        return {
            structure: structurePlan.content,
            mainPlot: mainPlot.content,
            subPlots: subPlots.content,
            chapters: this.parseChapterPlan(detailedPlan.content),
            optimization: optimizedPlan.content
        };
    }

    // 生成章节部分
    async generateChapterPart(partType, context, novelInfo) {
        let prompt;
        const scaleSettings = CONFIG.NOVEL_STRUCTURE.SCALE_SETTINGS;
        const chapterScale = scaleSettings.CHAPTER_SCALE[context.totalChapters];
        const wordCountScale = scaleSettings.WORD_COUNT_SCALE[context.targetWords];

        switch (partType) {
            case 'opening':
                prompt = this.buildChapterOpeningPrompt(context, novelInfo, chapterScale, wordCountScale);
                break;
            case 'scene':
                prompt = this.buildChapterScenePrompt(context, novelInfo, chapterScale, wordCountScale);
                break;
            case 'ending':
                prompt = this.buildChapterEndingPrompt(context, novelInfo, chapterScale, wordCountScale);
                break;
            default:
                throw new Error('未知的章节部分类型');
        }

        const response = await this.makeRequest(null, {
            messages: [{ role: 'user', content: prompt }],
            temperature: CONFIG.CREATIVITY_SETTINGS.getTemperature(65),
            top_p: CONFIG.CREATIVITY_SETTINGS.getTopP(65)
        });

        return response.content;
    }

    // 构建章节开头提示词
    buildChapterOpeningPrompt(context, novelInfo, chapterScale, wordCountScale) {
        return `
            你是一位专业的小说创作者，正在创作一部${novelInfo.type}小说的第${context.chapterNumber}章开头部分。

            小说信息：
            标题：${novelInfo.title}
            类型：${novelInfo.type}
            写作风格：${novelInfo.style}
            故事基调：${novelInfo.tone}

            章节信息：
            章节标题：${context.chapterTitle}
            章节概要：${context.chapterSummary}
            主要情节：${context.mainPlot}
            涉及人物：${context.characters.join('、')}

            结构要求：
            - 本章预计总字数：${context.targetWords}字
            - 开头部分字数：${Math.floor(context.targetWords * 0.2)}字左右
            - 符合${novelInfo.type}类型特点
            - 体现${novelInfo.style}写作风格
            - 营造${novelInfo.tone}调

            创作要求：
            1. 开头要吸引读者注意
            2. 自然引入本章主题
            3. 设置合适的场景
            4. 为后续情节做铺垫
            5. 保持与上一章的连贯性
            ${context.chapterNumber > 1 ? '6. 注意与上一章的内容衔接' : ''}

            请直接开始创作章节开头部分，无需重复以上要求。
        `;
    }

    // 构建章节场景提示词
    buildChapterScenePrompt(context, novelInfo, chapterScale, wordCountScale) {
        return `
            你是一位专业的小说创作者，正在创作一部${novelInfo.type}小说第${context.chapterNumber}章的场景。

            当前场景信息：
            场景概要：${context.currentScene.summary}
            场景地点：${context.currentScene.location}
            参与人物：${context.currentScene.characters.join('、')}
            情节发展：${context.currentScene.plot}

            已有内容：${context.previousContent.substring(-200)}

            创作要求：
            1. 场景字数：${Math.floor(context.targetWords * 0.6 / context.scenes.length)}字左右
            2. 符合${novelInfo.type}类型特点
            3. 体现${novelInfo.style}写作风格
            4. 营造${novelInfo.tone}基调
            5. 注意与前文的自然衔接
            6. 细致描写场景细节
            7. 展现人物性格特点
            8. 推动情节发展
            9. 为下一场景做铺垫

            请直接开始创作场景内容，无需重复以上要求。
        `;
    }

    // 构建章节结尾提示词
    buildChapterEndingPrompt(context, novelInfo, chapterScale, wordCountScale) {
        return `
            你是一位专业的小说创作者，正在创作一部${novelInfo.type}小说第${context.chapterNumber}章的结尾。

            已有内容：${context.previousContent.substring(-200)}

            结尾要求：
            1. 结尾字数：${Math.floor(context.targetWords * 0.2)}字左右
            2. 符合${novelInfo.type}类型特点
            3. 体现${novelInfo.style}写作风格
            4. 营造${novelInfo.tone}基调
            5. 总结本章重点
            6. 为下一章埋下伏笔
            7. ${context.chapterNumber < context.totalChapters ? '设置适当悬念' : '照应全书主题'}

            请直接开始创作章节结尾，无需重复以上要求。
        `;
    }

    // 优化内容
    async polishContent(content) {
        const prompt = CONFIG.PROMPTS.POLISH_CONTENT(content);
        const response = await this.makeRequest(null, {
            messages: [{ role: 'user', content: prompt }],
            temperature: CONFIG.CREATIVITY_SETTINGS.getTemperature(40),
            top_p: CONFIG.CREATIVITY_SETTINGS.getTopP(40)
        });
        return response.content;
    }

    // 解析章节规划
    parseChapterPlan(planContent) {
        try {
            // 将文本内容按章节分割
            const chapterBlocks = planContent.split(/第\s*\d+\s*章/).filter(block => block.trim());
            
            const chapters = chapterBlocks.map((block, index) => {
                // 提取章节标题
                const titleMatch = block.match(/【.*?】|".*?"|「.*?」|［.*?］/);
                const title = titleMatch ? titleMatch[0].replace(/[【】""「」［］]/g, '') : `第${index + 1}章`;
                
                // 提取章节概要
                const summaryMatch = block.match(/概要[:：]([\s\S]*?)(?=主要情节|$)/);
                const summary = summaryMatch ? summaryMatch[1].trim() : '';
                
                // 提取主要情节
                const mainPlotMatch = block.match(/主要情节[:：]([\s\S]*?)(?=场景设置|$)/);
                const mainPlot = mainPlotMatch ? mainPlotMatch[1].trim() : '';
                
                // 提取场景设置
                const sceneMatch = block.match(/场景设置[:：]([\s\S]*?)(?=人物出场|$)/);
                const scenes = sceneMatch ? sceneMatch[1].trim().split(/[,，]/).map(s => s.trim()) : [];
                
                // 提取人物出场
                const charactersMatch = block.match(/人物出场[:：]([\s\S]*?)(?=写作要点|$)/);
                const characters = charactersMatch ? charactersMatch[1].trim().split(/[,，]/).map(c => c.trim()) : [];
                
                // 提取写作要点
                const pointsMatch = block.match(/写作要点[:：]([\s\S]*?)(?=预计字数|$)/);
                const points = pointsMatch ? pointsMatch[1].trim().split(/[,，]/).map(p => p.trim()) : [];
                
                // 提取预计字数
                const wordCountMatch = block.match(/预计字数[:：]\s*(\d+)/);
                const wordCount = wordCountMatch ? parseInt(wordCountMatch[1]) : 3000;
                
                return {
                    chapterNumber: index + 1,
                    title,
                    summary,
                    mainPlot,
                    scenes,
                    characters,
                    writingPoints: points,
                    targetWords: wordCount,
                    status: 'pending'
                };
            });
            
            return {
                chapters,
                totalChapters: chapters.length,
                currentChapter: 1
            };
        } catch (error) {
            console.error('解析章节规划时出错：', error);
            throw new Error('章节规划解析失败，���检查格式是否正确');
        }
    }

    // 添加延迟函数
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 发送API请求
    async makeRequest(endpoint, data) {
        if (!this.apiKey) {
            throw new Error('请先设置API密钥');
        }

        try {
            const response = await fetch('https://api.deepseek.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    ...data,
                    model: CONFIG.MODEL_NAME,
                    max_tokens: CONFIG.MAX_TOKENS
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            return result.choices[0].message;
        } catch (error) {
            console.error('API请求失败:', error);
            throw new Error('API请求失败，请检查网络连接或API密钥是否正确');
        }
    }
}

export default new NovelAPI(); 