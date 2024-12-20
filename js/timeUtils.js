const timeUtils = {
    startTime: null,
    taskTimes: {},

    startTimer() {
        this.startTime = Date.now();
    },

    recordTaskCompletion(taskType) {
        if (!this.startTime) return;
        
        const endTime = Date.now();
        const duration = endTime - this.startTime;
        
        if (!this.taskTimes[taskType]) {
            this.taskTimes[taskType] = [];
        }
        
        this.taskTimes[taskType].push(duration);
    },

    calculateRemainingTime(taskType, completed, total) {
        if (!this.taskTimes[taskType] || this.taskTimes[taskType].length === 0) {
            return 0;
        }

        const averageTime = this.taskTimes[taskType].reduce((a, b) => a + b, 0) / this.taskTimes[taskType].length;
        const remaining = total - completed;
        return Math.round((averageTime * remaining) / 1000); // 转换为秒
    },

    formatTime(seconds) {
        if (seconds === 0) return '预计时间未知';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        let timeString = '';
        if (hours > 0) {
            timeString += `${hours}小时`;
        }
        if (minutes > 0 || (hours === 0 && minutes === 0)) {
            timeString += `${minutes}分钟`;
        }
        
        return `预计剩余时间：${timeString}`;
    }
};

export default timeUtils; 