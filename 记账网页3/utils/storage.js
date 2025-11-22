const fs = require('fs');
const path = require('path');

// 存储文件路径
const STORAGE_DIR = path.join(__dirname, '..', 'storage');
const RECEIVED_DATA_FILE = path.join(STORAGE_DIR, 'received_data.json');
const PROCESSED_RECORDS_FILE = path.join(STORAGE_DIR, 'processed_records.json');

// 确保存储目录存在
function ensureStorageDir() {
    if (!fs.existsSync(STORAGE_DIR)) {
        fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
}

// 初始化存储目录
ensureStorageDir();

// 保存数据到文件
function saveToFile(data, filePath) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`保存数据到文件 ${filePath} 失败:`, error);
        return false;
    }
}

// 从文件加载数据
function loadFromFile(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
        return [];
    } catch (error) {
        console.error(`从文件 ${filePath} 加载数据失败:`, error);
        return [];
    }
}

// 保存接收到的数据
exports.saveReceivedData = function(data) {
    return saveToFile(data, RECEIVED_DATA_FILE);
};

// 保存处理后的记录
exports.saveProcessedRecords = function(records) {
    return saveToFile(records, PROCESSED_RECORDS_FILE);
};

// 加载接收到的数据
exports.loadReceivedData = function() {
    return loadFromFile(RECEIVED_DATA_FILE);
};

// 加载处理后的记录
exports.loadProcessedRecords = function() {
    return loadFromFile(PROCESSED_RECORDS_FILE);
};

// 清空存储
exports.clearStorage = function() {
    try {
        if (fs.existsSync(RECEIVED_DATA_FILE)) {
            fs.unlinkSync(RECEIVED_DATA_FILE);
        }
        if (fs.existsSync(PROCESSED_RECORDS_FILE)) {
            fs.unlinkSync(PROCESSED_RECORDS_FILE);
        }
        return true;
    } catch (error) {
        console.error('清空存储失败:', error);
        return false;
    }
};

// 获取存储统计信息
exports.getStorageStats = function() {
    try {
        const receivedStats = fs.statSync(RECEIVED_DATA_FILE);
        const processedStats = fs.statSync(PROCESSED_RECORDS_FILE);
        
        return {
            received_data: {
                exists: true,
                size: receivedStats.size,
                modified_at: receivedStats.mtime
            },
            processed_records: {
                exists: true,
                size: processedStats.size,
                modified_at: processedStats.mtime
            }
        };
    } catch (error) {
        // 如果文件不存在，返回相应状态
        return {
            received_data: {
                exists: fs.existsSync(RECEIVED_DATA_FILE),
                size: 0,
                modified_at: null
            },
            processed_records: {
                exists: fs.existsSync(PROCESSED_RECORDS_FILE),
                size: 0,
                modified_at: null
            }
        };
    }
};