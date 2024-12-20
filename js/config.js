const CONFIG = {
    // API配置
    API_ENDPOINT: 'https://api.deepseek.ai/v1/chat/completions',
    MODEL_NAME: 'deepseek-chat',
    MAX_TOKENS: 4000,
    
    // API重试设置
    API_RETRY: {
        MAX_RETRIES: 3,
        RETRY_DELAY: 1000,  // 重试延迟（毫秒）
        TIMEOUT: 30000      // 请求超时时间（毫秒）
    },
    
    // 本地存储键
    STORAGE_KEYS: {
        NOVEL_HISTORY: 'novel_history',
        CURRENT_NOVEL: 'current_novel',
        NOVEL_OUTLINE: 'novel_outline',
        CHAPTER_COUNT: 'chapter_count',
        NOVEL_SETTINGS: 'novel_settings'
    },
    
    // 创作参数
    CREATIVITY_SETTINGS: {
        // temperature值与创意程度的映射
        getTemperature: (creativityLevel) => {
            return 0.5 + (creativityLevel / 100) * 0.5; // 0.5-1.0
        },
        // top_p值与创意程度的映射
        getTopP: (creativityLevel) => {
            return 0.8 + (creativityLevel / 100) * 0.2; // 0.8-1.0
        }
    },
    
    // 添加新的配置项
    NOVEL_SETTINGS: {
        // 章节设置
        CHAPTER_LIMITS: {
            MIN: 1,
            MAX: 200,
            DEFAULT: 20
        },
        // 字数设置
        WORD_LIMITS: {
            MIN: 1000,
            MAX: 1000000,
            DEFAULT: 50000,
            CHAPTER_MIN: 1000,
            CHAPTER_MAX: 5000
        },
        // 自动调整设置
        AUTO_ADJUST: {
            // 是否自动调整单章字数以满足总字数要求
            ENABLED: true,
            // 字数偏差容忍度（百分比）
            TOLERANCE: 0.1
        }
    },
    
    // 章节管理系统
    CHAPTER_MANAGEMENT: {
        // 单次生成的最大token数
        MAX_GENERATION_TOKENS: 4000,
        
        // 章节状态
        CHAPTER_STATUS: {
            PENDING: 'pending',
            GENERATING: 'generating',
            COMPLETED: 'completed',
            FAILED: 'failed'
        },
        
        // 章节生成优先级
        PRIORITY: {
            HIGH: 3,    // 关键剧情章节
            MEDIUM: 2,  // 普通剧情章节
            LOW: 1      // 过渡章节
        },
        
        // 章节生成策略
        GENERATION_STRATEGY: {
            // 是否启用智能分段
            SMART_SEGMENTATION: true,
            // 最小分段字数
            MIN_SEGMENT_WORDS: 1000,
            // 最大分段字数
            MAX_SEGMENT_WORDS: 3000,
            // 分段重叠字数（确保连贯性）
            OVERLAP_WORDS: 200
        }
    },
    
    // 提示词模板
    PROMPTS: {
        // 第一步：扩展故事大纲
        EXPAND_OUTLINE: (title, type, outline) => `
            你是一位资深的小说策划编辑，擅长故事构建和情节设计。请基于以下信息，创建一个专业的故事大纲：

            作品信息：
            标题：${title}
            类型：${type}
            初始构思：${outline}

            请按以下步骤进行系统规划：

            1. 世界观构建：
               - 时代背景和社会环境
               - 特殊设定（如果是奇幻/科幻类型）
               - 世界规则和限制

            2. 核心主题：
               - 中心思想
               - 情感基调
               - 哲理内涵

            3. 主要人物关系：
               - 角色关系图谱
               - 利益冲突网络
               - 感情纽带设计

            4. 故事主线：
               - 核心矛盾
               - 关键事件链
               - 情节推进点

            5. 重要支线：
               - 次要矛盾设计
               - 与主线的交织点
               - 情节补充作用

            6. 故事结构：
               - 起承转合安排
               - 高潮设计
               - 悬念布局

            7. 结局构思：
               - 主线结局
               - 支线收束
               - 情感升华

            创作要求：
            1. 保持逻辑严密，因果关系清晰
            2. 设计多层次的情节冲突
            3. 注重人物成长轨迹
            4. 埋设伏笔和悬念
            5. 符合${type}类型的特色
            6. 主题深刻但不说教
            7. 结构完整且富有新意

            请以专业的文学策划格式输出以上内容。
        `,

        // 第二步：创建人物设定
        CREATE_CHARACTERS: (outline) => `
            你是一位专业的角色设计师，擅长塑造丰满的人物形象。基于以下故事大纲，创建详细的人物设定：

            故事大纲：${outline}

            请为每个主要角色设计以下内容：

            1. 基础信息：
               - 姓名（包含命名含义）
               - 年龄和生日
               - 性别和外貌特征
               - 职业和社会地位
               - 教育背景

            2. 性格特征：
               - 核心性格特点
               - 独特的行为习惯
               - 说话方式和语言特��
               - 处事风格
               - 性格缺陷

            3. 背景故事：
               - 成长经历
               - 重要人生转折点
               - 创伤或心理阴影
               - 难忘的生活经历
               - 形成性格的关键事件

            4. 社会关系：
               - 家庭关系
               - 朋友圈层
               - 情感状态
               - 重要人际连接
               - 社交网络

            5. 个人特质：
               - 专业技能
               - 兴趣爱好
               - 特殊才能
               - 价值观念
               - 人生目标

            6. 矛盾冲突：
               - 内心挣扎
               - 外部对抗
               - 成长困境
               - 情感纠葛
               - 身份认同

            7. 人物弧光：
               - 性格转变轨迹
               - 能力成长路线
               - 关系发展变化
               - 价值观演变
               - 结局走向

            设计要求：
            1. 确保人物形象鲜明独特
            2. 性格特点要立体丰满
            3. 符合故事背景设定
            4. 为情节发展预留空间
            5. 人物之间要形成互动关系
            6. 设置合理的成长空间
            7. 预留反派的可能性

            请以角色小传的形式输出以上内容。
        `,

        // 第三步：章节规划
        PLAN_CHAPTERS: (outline, characters) => `
            你是一位专业的小说结构师，擅长章节布局和节奏把控。请基于以下信息，设计详细的章节结构：

            故事大纲：${outline}
            人物设定：${characters}

            请按以下方面进行规划：

            1. 整体架构：
               - 分卷安排
               - 章节数量
               - 各章字数分配
               - 主题分布

            2. 节奏控制：
               - 情节密度
               - 叙事节奏
               - 高潮安排
               - 悬念设置

            3. 内容分配：
               - 每章核心内容
               - 场景设计
               - 人物出场
               - 情节推进点

            4. 线索安排：
               - 主线发展
               - 支线穿插
               - 伏笔布置
               - 悬念解答

            5. 场景规划：
               - 重要场景设计
               - 场景转换安排
               - 氛围营造
               - 环境描写

            6. 人物安排：
               - 重要人物戏份
               - 次要��物穿插
               - 人物互动设计
               - 性格展现机会

            规划要求：
            1. 结构完整，层次分明
            2. 节奏把控合理
            3. 为重要情节预留足够篇幅
            4. 确保故事连贯性
            5. 注意场景切换自然
            6. 人物刻画要均衡
            7. 为高潮情节预设铺垫

            请以章节大纲的形式输出规划内容。
        `,

        // 第四步：生成具体章节
        GENERATE_CHAPTER: (chapterInfo, style, tone, length) => `
            你是一位专业的小说创作者，擅长文字表达和情节展现。请基于以下信息创作本章内容：

            章节信息：${chapterInfo}
            写作风格：${style}
            故事基调：${tone}
            目标字数：${length}字

            创作要求：

            1. 内容要求：
               - 严格遵循大纲发展
               - 保持情节连贯性
               - 细节要丰富生动
               - 感情要真实自然

            2. 写作技巧：
               - 运用${style}的写作手法
               - 营造${tone}的氛围
               - 场景描写要细腻
               - 对话要自然生动

            3. 人物刻画：
               - 通��行动展现性格
               - 对话要符合人设
               - 心理活动要细腻
               - 情感变化要合理

            4. 环境描写：
               - 场景要具体形象
               - 气氛要符合情节
               - 细节要真实准确
               - 意境要优美动人

            5. 节奏控制：
               - 详略得当
               - 主次分明
               - 起伏有致
               - 过渡自然

            6. 语言要求：
               - 用词准确优美
               - 句式灵活多变
               - 修辞恰到好处
               - 语言符合人物身份

            7. 技术规范：
               - 字数控制在${length}字左右
               - 段落长度适中
               - 标点符号规范
               - 用语准确规范

            请直接开始创作，无需重复以上要求。
        `,

        // 第五步：优化内容
        POLISH_CONTENT: (content) => `
            你是一位资深的文学编辑，擅长文本优化和内容提升。请对以下内容进行专业的修改建议：

            原文：${content}

            请从以下方面进行分析和建议：

            1. 情节分析：
               - 情节是否合理连贯
               - 因果关系是否清晰
               - 是否存在逻辑漏洞
               - 情节密度是否适中

            2. 人物塑造：
               - 性格表现是否鲜明
               - 行为是否符合人设
               - 对话是否自然
               - 心理描写是否到位

            3. 场景描写：
               - 场景是否生动
               - 细节是否真实
               - 氛围是否到位
               - 环境描写是否合理

            4. 语言风格：
               - 用词是否准确
               - 句式是否多样
               - 修辞是否得当
               - 语言是否流畅

            5. 节奏把控：
               - 节奏是否适中
               - 详略是否得当
               - 过渡是否自然
               - 重点是否突出

            6. 艺术效果：
               - 是否有画面感
               - 是否有感染力
               - 是否有意境美
               - 是否有思想深度

            请提供具体的修改建议和优化方向，包括：
            1. 需要改进的具体段落
            2. 修改的具体方向
            3. 优化的具体方法
            4. 参考的修改示例

            建议以条目形式列出，便于参考和修改。
        `,

        // 继续写作
        CONTINUE_WRITING: (previousContent, style, tone, length, nextChapterInfo) => `
            你是一位专业的小说创作者，请基于以下信息继续创作故事：

            前文内容：${previousContent}
            下一章节信息：${nextChapterInfo}
            写作风格：${style}
            故事基调：${tone}
            目标字数：${length}字

            创作要求：

            1. 情节延续：
               - 承接上文情节发展
               - 保持人物性格一致
               - 维持故事世界观
               - 延续前文伏笔

            2. 内容创新：
               - 引入新的情节点
               - 深化人物形象
               - 增加情节悬念
               - 设置新的冲突

            3. 结构安排：
               - 注意章节承接
               - 设计情节过渡
               - 控制叙事节奏
               - 为后续做铺垫

            4. 写作规范：
               - 保持${style}的写作风格
               - 延续${tone}的情感基调
               - 字数控制在${length}字
               - 注意语言的连贯性

            5. 质量要求：
               - 情节要合理
               - 人物要鲜活
               - 场景要生动
               - 细节要真实

            请直接开始创作，无需重复以上要求。
        `,

        // 章节总结
        SUMMARIZE_CHAPTER: (content) => `
            你是一位专业的文学编辑，请对以下章节内容进行简要总结：

            章节内容：${content}

            请提供：
            1. 本章要点概述（100字以内）
            2. 重要情节发展（3-5点）
            3. 人物关系变化（2-3点）
            4. 新增伏笔（如��）
            5. 下章预测建议

            总结要求：
            1. 内容精炼准确
            2. 重点突出
            3. 便于延续创作
        `,

        // 新增：章节分析和规划
        ANALYZE_CHAPTER_COMPLEXITY: (chapterInfo) => `
            你是一位专业的小说策划分析，请分析以下章节的复杂度：

            章节信息：${chapterInfo}

            请从以下方面进行分析：

            1. 情节复杂度：
               - 主要情节数量
               - 次要情节数量
               - 情节交织程度
               - 转折点数量

            2. 场景复杂度：
               - 场景切换次数
               - 场景描写难度
               - 环境细节要求
               - 氛围营造难度

            3. 人物互动：
               - 出场人物数量
               - 对话场景数量
               - 互动复杂程度
               - 心理描写深度

            4. 写作难度：
               - 预计所需篇幅
               - 技术要求等级
               - 连贯性要求
               - 特殊写作技巧

            请输出：
            1. 建议优先级（HIGH/MEDIUM/LOW）
            2. 建议分段数量
            3. 每段建议字数
            4. 特殊注意��项
        `,

        // 新增：分段生成提示词
        GENERATE_SEGMENT: (segmentInfo, previousSegment, nextSegmentOutline) => `
            你是一位专业的小说创作者，请基于以下信息创作本段内容：

            段落信息：${segmentInfo}
            上文内容：${previousSegment || '无'}
            下段大纲：${nextSegmentOutline || '无'}

            创作要求：

            1. 内容衔接：
               - 如有上文，需自然衔接
               - 为下段内容做好铺垫
               - 保持情节流畅
               - 避免突兀转折

            2. 段落重点：
               - 聚焦本段核心内容
               - 细化情节发展
               - 深化人物刻画
               - 营造场景氛围

            3. 写作规范：
               - 控制好段落节奏
               - 注意描写细节
               - 保持语言风格
               - 保内容完整

            请直接开始创作，无需重复以上要求。
        `,

        // 新增：段落连接优化
        OPTIMIZE_SEGMENT_CONNECTION: (previousSegment, currentSegment) => `
            你是一位专业的文学编辑，请优化以下两段内容的连接：

            上一段结尾：${previousSegment}
            当前段开头：${currentSegment}

            优化要求：
            1. 确保情节过渡自然
            2. 保持语言风格一致
            3. 避免信息重复
            4. 补充必要的过渡内容

            请提供优化后的过渡段落。
        `,

        // 新增：章节完整性检查
        CHECK_CHAPTER_COMPLETENESS: (chapterContent, chapterOutline) => `
            你是一位专业的文学审校编辑，请检查本章内容的完整性：

            章节内容：${chapterContent}
            章节大纲：${chapterOutline}

            检查项目：
            1. 情节完整性
            2. 人物表现完整性
            3. 场景描写完整性
            4. 内容与大纲的匹配度
            5. 前后文的连贯性
            6. 伏笔和悬念的处理

            请提供：
            1. 完整性评分（1-100）
            2. 具体问题列表
            3. 修改建议
            4. 补充内容建议
        `,

        // 修改：将章节规划拆为多个步骤
        CHAPTER_PLANNING: {
            // 第一轮：整体架构规划
            STRUCTURE_PLANNING: (outline, totalChapters, totalWords) => `
                你是一位专业的小说结构规划师，请基于以下信息规划小说整体结构：

                规模信息：
                - 总章节数：${totalChapters}章
                - 总字数：${totalWords}字
                - 故事大纲：${outline}

                请按以下方面进行规划：

                1. 结构分配：
                   - 引入部分：${CONFIG.NOVEL_STRUCTURE.SCALE_SETTINGS.CHAPTER_SCALE[totalChapters].structureGuide.introduction}章
                   - 发展部分：${CONFIG.NOVEL_STRUCTURE.SCALE_SETTINGS.CHAPTER_SCALE[totalChapters].structureGuide.development}章
                   - 高潮部分：${CONFIG.NOVEL_STRUCTURE.SCALE_SETTINGS.CHAPTER_SCALE[totalChapters].structureGuide.climax}章
                   - 结局部分：${CONFIG.NOVEL_STRUCTURE.SCALE_SETTINGS.CHAPTER_SCALE[totalChapters].structureGuide.conclusion}章

                2. 字数分配：
                   - 引入部分：${Math.floor(totalWords * CONFIG.NOVEL_STRUCTURE.SCALE_SETTINGS.WORD_COUNT_SCALE[totalWords].structureGuide.introduction)}字
                   - 发展部分：${Math.floor(totalWords * CONFIG.NOVEL_STRUCTURE.SCALE_SETTINGS.WORD_COUNT_SCALE[totalWords].structureGuide.development)}字
                   - 高潮部分：${Math.floor(totalWords * CONFIG.NOVEL_STRUCTURE.SCALE_SETTINGS.WORD_COUNT_SCALE[totalWords].structureGuide.climax)}字
                   - 结局部分：${Math.floor(totalWords * CONFIG.NOVEL_STRUCTURE.SCALE_SETTINGS.WORD_COUNT_SCALE[totalWords].structureGuide.conclusion)}字

                3. 节奏控制：
                   - 每章平均字数：${CONFIG.NOVEL_STRUCTURE.SCALE_SETTINGS.WORD_COUNT_SCALE[totalWords].averageChapterWords}字
                   - 关键章节可上下浮动20%
                   - 保持整体节奏流畅

                请提供详细的章节规划方案，包括：
                1. 每个部分的主要内容概要
                2. 重点章节的详细规划
                3. 字数分配的具体建议
                4. 情节节奏的控制方案

                注意：
                1. 保持结构的平衡性
                2. 确保情节的连贯性
                3. 为创意发挥预留空间
                4. 考虑读者阅读体验
            `,

            // 第二轮：主线剧情规划
            MAIN_PLOT_PLANNING: (outline, structurePlan) => `
                你是一位专业的剧情规划师，请基于前期规划设计主线剧情：

                故事大纲：${outline}
                架构规划：${structurePlan}

                请设计以下内容：

                1. 主线发展：
                   - 核心冲突展开
                   - 关键转折点
                   - 高潮设计
                   - 结局铺垫

                2. 节点分布：
                   - 重要情节安排
                   - 关键场景设置
                   - 矛盾升级点

                输出要求：
                1. 专注于主线剧情
                2. 确保情节递进合理
                3. 为支线预留空间
                4. 注意节奏把控
            `,

            // 第三轮：支线剧情规划
            SUB_PLOT_PLANNING: (mainPlot, characters) => `
                你是一位专业的支线剧情设计师，请设计故事支线：

                主线剧情：${mainPlot}
                人物设定：${characters}

                请规划以下内容：

                1. 支线设计：
                   - 重要支线数量
                   - 支线主题
                   - 与主线的关系

                2. 人物支线：
                   - 重要人物个人线
                   - 人物关系发展
                   - 成长轨迹

                输出要求：
                1. 支线要服务于主线
                2. 注意人物刻画
                3. 避免支线过多
                4. 确保情节平衡
            `,

            // 第四轮：具体章节规划
            DETAILED_CHAPTER_PLANNING: (structurePlan, mainPlot, subPlots, startChapter, endChapter) => `
                你是一位专业的章节规划师，请详细规划以下章节内容：

                涉及章节：${startChapter} - ${endChapter}章
                架构规划：${structurePlan}
                主线剧情：${mainPlot}
                支线剧情：${subPlots}

                请为每个章节规划：

                1. 核心内容：
                   - 情节发展
                   - 场景设置
                   - 人物出场

                2. 写作重点：
                   - ��节推进点
                   - 人物刻画重点
                   - 场景描写要求

                3. 技术要求：
                   - 字数规划
                   - 节奏控制
                   - 特殊处理

                输出要求：
                1. 每章规划具体可执行
                2. 注意上下文连贯
                3. 标注重点关注内容
                4. 考虑整体平衡
            `,

            // 第五轮：衔接优化
            CONNECTION_OPTIMIZATION: (chapterPlans) => `
                你是一位专业的文学编辑，请优化章节间的衔接：

                章节规划：${chapterPlans}

                请检查和优化：

                1. 情节衔接：
                   - 前后呼应
                   - 伏笔安排
                   - 过渡自然

                2. 节奏控制：
                   - 紧张舒缓
                   - 详略得当
                   - 高潮铺垫

                输出要求：
                1. 指出需要调整的部分
                2. 提供具体优化建议
                3. 确保整体流畅性
                4. 保持风格统一
            `
        },

        // 新增：章节规划总结
        CHAPTER_PLANNING_SUMMARY: (allPlans) => `
            你是一位资深的文学策划，请总结所有章节规划：

            规划内容：${allPlans}

            请提供：

            1. 整体评估：
               - 结构完整性
               - 情节合理性
               - 人物安排
               - 节奏把控

            2. 重点提示：
               - 关键章节提醒
               - 特殊处理建议
               - 注意事项

            3. 执行建议：
               - 写作顺序建议
               - 重点关注环节
               - 可能的难点

            输出要求：
            1. 总结要简明扼要
            2. 突出重点内容
            3. 便于后续参考
        `
    },

    // 添加进度管理系统
    PROGRESS_MANAGEMENT: {
        // 创作阶段
        CREATION_PHASES: {
            OUTLINE_EXPANSION: {
                id: 'outline_expansion',
                name: '故事大纲扩展',
                status: 'pending',
                progress: 0,
                steps: ['世界观构建', '核心主题确定', '人物关系设计', '主线规划', '支线设计', '结构设计', '结局构思']
            },
            CHARACTER_CREATION: {
                id: 'character_creation',
                name: '人物设定创建',
                status: 'pending',
                progress: 0,
                steps: ['基础信息', '��格特征', '背景故事', '社会关系', '个人特质', '矛盾冲突', '人物弧光']
            },
            CHAPTER_PLANNING: {
                id: 'chapter_planning',
                name: '章节规划',
                status: 'pending',
                progress: 0,
                steps: [
                    '整体架构规划',
                    '主线剧情设计',
                    '支线剧情规划',
                    '具体章节规划',
                    '章节衔接优化'
                ]
            },
            CONTENT_GENERATION: {
                id: 'content_generation',
                name: '内容生成',
                status: 'pending',
                progress: 0,
                steps: ['章节分析', '分段生成', '段落连接', '完整性检查']
            },
            CONTENT_OPTIMIZATION: {
                id: 'content_optimization',
                name: '内容优化',
                status: 'pending',
                progress: 0,
                steps: ['情节分析', '人物塑造', '场景描写', '语言风格', '节奏把控', '艺术效果']
            }
        },

        // 状态定义
        STATUS: {
            PENDING: 'pending',      // 待处理
            IN_PROGRESS: 'progress', // 进行中
            COMPLETED: 'completed',  // 已完成
            FAILED: 'failed',        // 失败
            PAUSED: 'paused'        // 暂停
        },

        // 进度显示配置
        DISPLAY_CONFIG: {
            // 进度条颜色
            COLORS: {
                PENDING: '#gray',
                IN_PROGRESS: '#blue',
                COMPLETED: '#green',
                FAILED: '#red',
                PAUSED: '#orange'
            },
            // 进度更新间隔（毫秒）
            UPDATE_INTERVAL: 1000,
            // 是否显示详细步骤
            SHOW_DETAILED_STEPS: true,
            // 是否显示预计剩余时间
            SHOW_ETA: true
        },

        // 进度消息模板
        PROGRESS_MESSAGES: {
            OUTLINE_EXPANSION: (step, progress) => `正在进行故事大纲扩展 - ${step} (${progress}%)`,
            CHARACTER_CREATION: (step, progress) => `正在创建人物设定 - ${step} (${progress}%)`,
            CHAPTER_PLANNING: (step, progress) => `正在规划章节结构 - ${step} (${progress}%)`,
            CONTENT_GENERATION: (step, progress) => `正在生成章节内容 - ${step} (${progress}%)`,
            CONTENT_OPTIMIZATION: (step, progress) => `正在优化内容 - ${step} (${progress}%)`,
            GENERAL_PROGRESS: (phase, step, progress) => `${phase} - ${step} (${progress}%)`
        },

        // 错误处理
        ERROR_HANDLING: {
            // 重试次数
            MAX_RETRIES: 3,
            // 重试间隔（毫秒）
            RETRY_INTERVAL: 5000,
            // 错误消息模板
            ERROR_MESSAGES: {
                GENERATION_FAILED: (phase, step) => `${phase}的${step}步骤生成失败`,
                RETRY_MESSAGE: (attempt, max) => `正在进行第${attempt}/${max}次重试`,
                FINAL_FAILURE: (phase) => `${phase}最终失败，请检查设置后重试`
            }
        },

        // 进度估算
        PROGRESS_ESTIMATION: {
            // 各阶段预计耗时（秒）
            PHASE_DURATION: {
                OUTLINE_EXPANSION: 60,
                CHARACTER_CREATION: 90,
                CHAPTER_PLANNING: 120,
                CONTENT_GENERATION: 180,
                CONTENT_OPTIMIZATION: 60
            },
            // 进度计算方法
            calculateProgress: (phase, completedSteps, totalSteps) => {
                return Math.floor((completedSteps / totalSteps) * 100);
            },
            // 预计剩余时间计算
            calculateETA: (phase, progress) => {
                const totalTime = CONFIG.PROGRESS_MANAGEMENT.PROGRESS_ESTIMATION.PHASE_DURATION[phase];
                return Math.ceil((100 - progress) * totalTime / 100);
            }
        }
    },

    // 步骤检查提示词
    STEP_CHECK_PROMPTS: {
        // 大纲扩展检查
        CHECK_OUTLINE_EXPANSION: (outline) => `
            你是一位资深的文学策划编辑，请检查以下扩展大纲的完整性：

            扩展大纲：${outline}

            请从以下方面进行检查：

            1. 世界观完整性：
               - 背景设定是否完整
               - 规则体系是否清晰
               - 特殊设定是否合理

            2. 主题深度：
               - 核心思想是否明确
               - 情感基调是否统一
               - 哲理内涵是否深刻

            3. 人物体系：
               - 角色关系是否完整
               - 冲突设置是否合理
               - 人物动机是否明确

            4. 情节结构：
               - 主线是否清晰
               - 支线是否合理
               - 结构是否完整

            请提供：
            1. 完整性评分（1-100）
            2. 每个方面的具体问题
            3. 需要补充的内容
            4. 修改建议

            如果评分低于85分，请详细说明需要如何改进。
        `,

        // 人物设定检查
        CHECK_CHARACTER_CREATION: (characters) => `
            ���是一位专业的角色设计顾问，请检查以下人物设定的完整性：

            人物设定：${characters}

            请检查以下方面：

            1. 基础信息完整性：
               - 每个角色是否都有完整基础信息
               - 设定是否前后一致
               - 是否有遗漏的关键信息

            2. 性格立体度：
               - 性格特征是否丰满
               - 是否有鲜明个性
               - 是否有成长空间

            3. 背景深度：
               - 成长经历是否合理
               - 动机是否充分
               - 矛盾冲突是否明确

            4. 人物关系网：
               - 角色间关系是否明确
               - 互动是否合理
               - 是否有发展空间

            请提供：
            1. 完整性评分（1-100）
            2. 每个角色的具体问题
            3. 需要补充的设定
            4. 改进建议

            如果评分低于85分，请详细说明需要如何改进。
        `,

        // 章节规划检查
        CHECK_CHAPTER_PLANNING: (chapterPlan) => `
            你是一位专业的小说结构规划顾问，请检查以下章节规划的完整性：

            章节规划：${chapterPlan}

            请检查以下���面：

            1. 结构完整性：
               - 是否包含所有必要章节
               - 情节是否连贯
               - 节奏是否合理

            2. 内容分配：
               - 各章节篇幅是否合理
               - 重点章节是否突出
               - 过渡是否自然

            3. 情节安排：
               - 主线发展是否清晰
               - 支线穿插是否得当
               - 高潮设置是否合理

            4. 人物安排：
               - 出场是否合理
               - 戏份是否均衡
               - 互动是否充分

            请提供：
            1. 完整性评分（1-100）
            2. 具体问题列表
            3. 优化建议
            4. 调整方案

            如果评分低于85分，请详细说明需要如何改进。
        `,

        // 章节生成检查
        CHECK_CHAPTER_GENERATION: (chapter, chapterInfo) => `
            你是一位专业的文学编辑，请检查以下章节内容的质量：

            章节内容：${chapter}
            章节信息：${chapterInfo}

            请检查以下方面：

            1. 内容完整性：
               - 是否符合大纲要求
               - 情节是否完整
               - 过渡是否自然

            2. 人物表现：
               - 性格是否一致
               - 对话是否生动
               - 行为是否合理

            3. 场景描写：
               - 细节是否到位
               - 氛围是否合适
               - 画面感是否强

            4. 语言质量：
               - 文字是否流畅
               - 用词是否准确
               - 风格是否统一

            请提供：
            1. 质量评分（1-100）
            2. 具体问题列表
            3. 修改建议
            4. 优化方向

            如果评分低于85分，请详细说明需要如何改进。
        `,

        // 内容优化检查
        CHECK_CONTENT_OPTIMIZATION: (originalContent, optimizedContent) => `
            你是一位资深的文学编辑，请评估以下内容优化的效果：

            原始内容：${originalContent}
            优化后内容：${optimizedContent}

            请从以下方面进行评估：

            1. 改进效果：
               - 文字是否更加流畅
               - 情节是否更加合理
               - 细节是否更加丰富

            2. 保持一致性：
               - 人物形象是否一致
               - 情节发展是否连贯
               - 风格是否统一

            3. 优化程度：
               - 修改是否到位
               - 问题是否解决
               - 效果是否明显

            4. 整体提升：
               - 可读性是否提高
               - 吸引力是否增强
               - 艺术性是否提升

            请提供：
            1. 优化效果评分（1-100）
            2. 具体改进之处
            3. 仍需优化的部分
            4. 进一步优化建议

            如果评分低于85分，请详细说明需要如何继续改进。
        `,

        // 连贯性检查
        CHECK_CONTINUITY: (previousContent, currentContent) => `
            你是一位专业的文学编辑，请检查内容的连贯性：

            上文内容：${previousContent}
            当前内容：${currentContent}

            请检查以下方面：

            1. 情节连贯性：
               - 情节是否自然衔接
               - 是否有跳跃感
               - 是否有矛盾之处

            2. 人物连贯性：
               - 性格表现是否一致
               - 行为是否合理
               - 发展是否自然

            3. 细节连贯性：
               - 背景设定是否一致
               - 时间线是否清晰
               - 细节是否吻合

            4. 风格连贯性：
               - 语言风格是否统一
               - 叙事视角是否一致
               - 情感基调是否和谐

            请提供：
            1. 连贯性评分（1-100）
            2. 不连贯之处列表
            3. 修改建议
            4. 衔接优化方案

            如果评分低于85分，请详细说明需要如何改进。
        `
    },

    // 进度反馈提示词
    PROGRESS_CHECK_PROMPTS: {
        // 阶段完成度检查
        CHECK_PHASE_COMPLETION: (phase, content) => `
            你是一位专业的创作顾问，请评估当前创作阶段的完成度：

            创作阶段：${phase}
            当前内容：${content}

            请评估以下方面：

            1. 完成程度：
               - 必要内容是否齐全
               - 质量是否达标
               - 是否需要补充

            2. 衔接准备：
               - 是否可以进入下一阶段
               - 是否有遗漏的关键内容
               - 是否需要额外准备

            3. 质量评估：
               - 内容质量是否合格
               - 是否需要优化
               - 是否有特殊亮点

            请提供：
            1. 完成度评分（1-100）
            2. 已完成的内容要点
            3. 待完成的内容
            4. 下一步建议

            如果评分低于85分，请详细说明需要如何补充完善。
        `,

        // 总体进度检查
        CHECK_OVERALL_PROGRESS: (allPhases) => `
            你是一位专业的项目管理顾问，请评估整体创作进度：

            各阶段信息：${allPhases}

            请评估以下方面：

            1. 整体进度：
               - 各阶段完成情况
               - 进度是否均衡
               - 是否有延迟

            2. 质量控制：
               - 各阶段质量评估
               - 是否需要返工
               - 优化建议

            3. 风险评估：
               - 潜在问题分析
               - 解决方案建议
               - 预防措施

            请提供：
            1. 总体进度评分（1-100）
            2. 各阶段完成度分析
            3. 需要重点关注的环节
            4. 后续工作建议

            如果评分低于85分，请详细说明需要如何调整推进。
        `
    },

    // 用户选项处理
    USER_PREFERENCES: {
        // 写作风格映射
        WRITING_STYLES: {
            '细腻': {
                description: '注重细节描写，感情细腻',
                promptModifier: '请使用细腻的笔触，着重描写细节和情感变化，多用细节烘托氛围。',
                styleGuide: {
                    description: '多用细节，重视情感',
                    dialogue: '对话要体现细腻情感',
                    scene: '场景描写要精细入微',
                    emotion: '情感表达要层次丰富'
                }
            },
            '简洁': {
                description: '文字简练，节奏明快',
                promptModifier: '请使用简练的文字，保持节奏明快，突出重点，避免冗长。',
                styleGuide: {
                    description: '文字简练，直击要害',
                    dialogue: '对话要简短有力',
                    scene: '场景描写要简明扼要',
                    emotion: '情感表达要干净利落'
                }
            },
            '华丽': {
                description: '辞藻华丽，意境优美',
                promptModifier: '请使用华丽的辞藻，营造优美的意境，重视修辞和意象。',
                styleGuide: {
                    description: '用词华丽，意境优美',
                    dialogue: '对话要优雅讲究',
                    scene: '场景描写要诗意盎然',
                    emotion: '情感表达要含蓄优美'
                }
            },
            '幽默': {
                description: '诙谐有趣，妙趣横生',
                promptModifier: '请使用幽默诙谐的笔调，注重制造笑点，保持轻松愉快的氛围。',
                styleGuide: {
                    description: '文字幽默，妙趣横生',
                    dialogue: '对话要诙谐有趣',
                    scene: '场景描写要轻松活泼',
                    emotion: '情感表达要轻松幽默'
                }
            },
            '严肃': {
                description: '严谨认真，深沉稳重',
                promptModifier: '请使用严谨的笔调，保持深沉稳重的风格，注重逻辑性。',
                styleGuide: {
                    description: '文字严谨，深沉稳重',
                    dialogue: '对话要严肃认真',
                    scene: '场景描写要严谨细致',
                    emotion: '情感表达要深沉内敛'
                }
            }
        },

        // 故事基调映射
        STORY_TONES: {
            '轻松': {
                description: '轻松欢快，阳光向上',
                promptModifier: '请营造轻松欢快的氛围，保持故事的正向基调。',
                toneGuide: {
                    plot: '情节要轻松愉快',
                    conflict: '冲突不宜过于激烈',
                    resolution: '结局要温暖治愈'
                }
            },
            '紧张': {
                description: '紧张刺激，扣人心弦',
                promptModifier: '请营造紧张刺激的氛围，保持故事的悬疑感和紧迫感。',
                toneGuide: {
                    plot: '情节要跌宕起伏',
                    conflict: '冲突要激烈紧张',
                    resolution: '结局要出人意料'
                }
            },
            '温馨': {
                description: '温暖感人，治愈系',
                promptModifier: '请营造温馨感人的氛围，注重情感的温暖传递。',
                toneGuide: {
                    plot: '情节要温情脉脉',
                    conflict: '冲突要温和委婉',
                    resolution: '结局要温暖治愈'
                }
            },
            '黑暗': {
                description: '阴郁深沉，氛围压抑',
                promptModifier: '请营造阴郁深沉的氛围，突出故事的黑暗面。',
                toneGuide: {
                    plot: '情节要深沉压抑',
                    conflict: '冲突要激烈黑暗',
                    resolution: '结局要深沉有力'
                }
            },
            '正能量': {
                description: '积极向上，充满希望',
                promptModifier: '请营造积极向上的氛围，传递正能量和希望。',
                toneGuide: {
                    plot: '情节要充满希望',
                    conflict: '冲突要彰显正义',
                    resolution: '结局要充满希望'
                }
            }
        },

        // 创意程度映射
        CREATIVITY_LEVELS: {
            getPromptModifier: (level) => {
                if (level < 30) {
                    return '请保持情节发展的常规性，避免过于奇特的设定和转折。';
                } else if (level < 60) {
                    return '可以适当加入创新元素，但要保持合理性。';
                } else if (level < 80) {
                    return '鼓励加入创新的设定和独特的情节转折，但要确保逻辑自洽。';
                } else {
                    return '大胆使用创新元素，追求独特的故事体验，但要维持基本的逻辑框架。';
                }
            },
            getStyleModifier: (level) => {
                return {
                    plotInnovation: Math.min(100, level * 1.2),
                    characterUniqueness: Math.min(100, level * 1.1),
                    worldBuildingCreativity: Math.min(100, level * 1.15),
                    narrativeExperimentation: Math.min(100, level)
                };
            }
        },

        // 小说类型映射
        NOVEL_TYPES: {
            '玄幻': {
                description: '玄幻仙侠，修仙问道',
                genreGuide: {
                    worldBuilding: '构建独特的修仙体系和世界规则',
                    characters: '设计修仙者的境界和能力体系',
                    plot: '以修仙升级为主线，融入江湖恩怨',
                    style: '讲究仙侠气韵，重视��功招式描写'
                }
            },
            '科幻': {
                description: '科幻未来，技术幻想',
                genreGuide: {
                    worldBuilding: '构建合理的未来科技世界',
                    characters: '设计具有科技特色的人物角色',
                    plot: '围绕科技发展和人性探索',
                    style: '注重科技细节的准确性和未来感'
                }
            },
            '言情': {
                description: '现代言情，情感故事',
                genreGuide: {
                    worldBuilding: '构建真实的现代生活场景',
                    characters: '塑造丰满的情感人物',
                    plot: '以情感发展为主线',
                    style: '重视情感描写和心理刻画'
                }
            },
            '悬疑': {
                description: '悬疑推理，解密探案',
                genreGuide: {
                    worldBuilding: '营造悬疑氛围和案件背景',
                    characters: '设计各类案件相关人物',
                    plot: '以案件解密为主线',
                    style: '注重线索铺设和推理过程'
                }
            }
        }
    },

    // 修改生成提示词，整合用户选���
    GENERATION_PROMPTS: {
        // 整合用户选项的章节生成
        GENERATE_WITH_PREFERENCES: (chapterInfo, userPreferences) => `
            你是一位专业的小说创作者，请基于以下信息和用户偏好创作内容：

            章节信息：${chapterInfo}
            写作风格：${userPreferences.style}
            故事基调：${userPreferences.tone}
            创意程度：${userPreferences.creativity}
            小说类型：${userPreferences.type}

            风格指导：
            ${CONFIG.USER_PREFERENCES.WRITING_STYLES[userPreferences.style].promptModifier}

            基调指导：
            ${CONFIG.USER_PREFERENCES.STORY_TONES[userPreferences.tone].promptModifier}

            创意指导：
            ${CONFIG.USER_PREFERENCES.CREATIVITY_LEVELS.getPromptModifier(userPreferences.creativity)}

            类型指导：
            ${CONFIG.USER_PREFERENCES.NOVEL_TYPES[userPreferences.type].genreGuide.style}

            创作要求：
            1. 严格遵循用户选择的写作风格
            2. 保持指定的故事基调
            3. 符合小说类型的特点
            4. 根据创意程度调整新颖程度
            5. 确保情节逻辑性和连贯性
            6. 注意人物形象的一致性
            7. 场景描写要符合类型特点

            请直接开始创作，无需重复以上要求。
        `,

        // 检查是否符合用户偏好
        CHECK_PREFERENCES_COMPLIANCE: (content, userPreferences) => `
            你是一位专业的文学编辑，请检查内容是否符合用户的偏好设置：

            内容：${content}
            用户偏好：
            - 写作风格：${userPreferences.style}
            - 故事基调：${userPreferences.tone}
            - 创意程度：${userPreferences.creativity}
            - 小说类型：${userPreferences.type}

            请检查以下方面：

            1. 风格符合度：
               - 是否符合选定的写作风格
               - 是否保持风格一致性
               - 是否体现风格特点

            2. 基调符合度：
               - 是否符合选定的故事基调
               - 是否保持基调统一
               - 是否营造相应氛围

            3. 创意水平：
               - 是否符合设定的创意程度
               - 是否有新颖元素
               - 是否保持合理性

            4. 类型特征：
               - 是否符合类型特点
               - 是否有类型标志性元素
               - 是否满足类型要求

            请提供：
            1. 各方面符���度评分（1-100）
            2. 不符合之处列表
            3. 改进建议
            4. 优化方向

            如果任何方面评分低于85分，请详细说明如何改进。
        `
    },

    // 添加小说整体设置处理
    NOVEL_STRUCTURE: {
        // 章节规模设置
        SCALE_SETTINGS: {
            // 总章节数配置
            CHAPTER_SCALE: {
                '10': {
                    description: '短篇小说',
                    structureGuide: {
                        introduction: 1,      // 引入章节数
                        development: 6,       // 发展章节数
                        climax: 2,           // 高潮章节数
                        conclusion: 1         // 结局章节数
                    }
                },
                '20': {
                    description: '中篇小说',
                    structureGuide: {
                        introduction: 2,
                        development: 12,
                        climax: 4,
                        conclusion: 2
                    }
                },
                '30': {
                    description: '中长篇小说',
                    structureGuide: {
                        introduction: 3,
                        development: 18,
                        climax: 6,
                        conclusion: 3
                    }
                },
                '50': {
                    description: '长篇小说',
                    structureGuide: {
                        introduction: 5,
                        development: 30,
                        climax: 10,
                        conclusion: 5
                    }
                },
                '100': {
                    description: '超长篇小说',
                    structureGuide: {
                        introduction: 10,
                        development: 60,
                        climax: 20,
                        conclusion: 10
                    }
                }
            },

            // 总字数配置
            WORD_COUNT_SCALE: {
                '20000': {
                    description: '短篇',
                    averageChapterWords: 2000,
                    structureGuide: {
                        introduction: 0.1,    // 占总字数比例
                        development: 0.6,
                        climax: 0.2,
                        conclusion: 0.1
                    }
                },
                '50000': {
                    description: '中篇',
                    averageChapterWords: 2500,
                    structureGuide: {
                        introduction: 0.1,
                        development: 0.6,
                        climax: 0.2,
                        conclusion: 0.1
                    }
                },
                '100000': {
                    description: '中长篇',
                    averageChapterWords: 3000,
                    structureGuide: {
                        introduction: 0.1,
                        development: 0.6,
                        climax: 0.2,
                        conclusion: 0.1
                    }
                },
                '200000': {
                    description: '长篇',
                    averageChapterWords: 4000,
                    structureGuide: {
                        introduction: 0.1,
                        development: 0.6,
                        climax: 0.2,
                        conclusion: 0.1
                    }
                },
                '500000': {
                    description: '超长篇',
                    averageChapterWords: 5000,
                    structureGuide: {
                        introduction: 0.1,
                        development: 0.6,
                        climax: 0.2,
                        conclusion: 0.1
                    }
                }
            }
        },

        // 结构规划提示词
        STRUCTURE_PROMPTS: {
            // 整体结构规划
            PLAN_OVERALL_STRUCTURE: (totalChapters, totalWords, type, outline) => `
                你是一位专业的小说结构规划师，请基于以下信息规划小说整体结构：

                规模信息：
                - 总章节数：${totalChapters}章
                - 总字数：${totalWords}字
                - 小说类型：${type}
                - 故事大纲：${outline}

                请按以下方面进行规划：

                1. 结构分配：
                   - 引入部分：${CONFIG.NOVEL_STRUCTURE.SCALE_SETTINGS.CHAPTER_SCALE[totalChapters].structureGuide.introduction}章
                   - 发展部分：${CONFIG.NOVEL_STRUCTURE.SCALE_SETTINGS.CHAPTER_SCALE[totalChapters].structureGuide.development}章
                   - 高潮部分：${CONFIG.NOVEL_STRUCTURE.SCALE_SETTINGS.CHAPTER_SCALE[totalChapters].structureGuide.climax}章
                   - 结局部分：${CONFIG.NOVEL_STRUCTURE.SCALE_SETTINGS.CHAPTER_SCALE[totalChapters].structureGuide.conclusion}章

                2. 字数分配：
                   - 引入部分：${Math.floor(totalWords * CONFIG.NOVEL_STRUCTURE.SCALE_SETTINGS.WORD_COUNT_SCALE[totalWords].structureGuide.introduction)}字
                   - 发展部分：${Math.floor(totalWords * CONFIG.NOVEL_STRUCTURE.SCALE_SETTINGS.WORD_COUNT_SCALE[totalWords].structureGuide.development)}字
                   - 高潮部分：${Math.floor(totalWords * CONFIG.NOVEL_STRUCTURE.SCALE_SETTINGS.WORD_COUNT_SCALE[totalWords].structureGuide.climax)}字
                   - 结局部分：${Math.floor(totalWords * CONFIG.NOVEL_STRUCTURE.SCALE_SETTINGS.WORD_COUNT_SCALE[totalWords].structureGuide.conclusion)}字

                3. 节奏控制：
                   - 每章平均字数：${CONFIG.NOVEL_STRUCTURE.SCALE_SETTINGS.WORD_COUNT_SCALE[totalWords].averageChapterWords}字
                   - 关键章节可上下浮动20%
                   - 保持整体节奏流畅

                请提供详细的章节规划方案，包括：
                1. 每个部分的主要内容概要
                2. 重点章节的详细规划
                3. 字数分配的具体建议
                4. 情节节奏的控制方案

                注意：
                1. 符合${type}类型的特点
                2. 保持结构的平衡性
                3. 确保情节的连贯性
                4. 为创意发挥预留空间
                5. ���虑读者阅读体验
            `,

            // 检查结构合理性
            CHECK_STRUCTURE_BALANCE: (structurePlan) => `
                你是一位专业的小说结构顾问，请检查以下结构规划的合理性：

                结构规划：${structurePlan}

                请检查以下方面：

                1. 整体平衡：
                   - 各部分比例是否合理
                   - 节奏安排是否得当
                   - 结构是否完整

                2. 资源分配：
                   - 字数分配是否合理
                   - 重点章节安排是否恰当
                   - 是否预留了足够的发挥空间

                3. 可执行性：
                   - 规划是否具体可行
                   - 是否考虑到实际创作需求
                   - 是否有操作性指导

                请提供：
                1. 合理性评分（1-100）
                2. 具体问题列表
                3. 改进建议
                4. 优化方案

                如果评分低于85分，请详细说明如何改进。
            `
        }
    }
};

export default CONFIG; 